/**
 * Socket.IO Client for Real-time Updates
 * Handles driver location updates and shipment status changes
 */

import { io, Socket } from 'socket.io-client'
import { logger } from './logger'

interface DriverLocation {
  driverId: string
  latitude: number
  longitude: number
  timestamp: Date
  accuracy?: number
  shipmentId?: string
}

interface ShipmentUpdate {
  shipmentId: string
  status: string
  transportMode?: string
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  timestamp: string
  updatedBy?: 'driver' | 'admin' | 'system'
  adminId?: string
  driverId?: string
}

interface AdminUpdate {
  type: 'status_change' | 'driver_assignment' | 'route_update' | 'delivery_instruction'
  shipmentId: string
  adminId: string
  adminName: string
  data: any
  timestamp: string
}

interface DriverAssignment {
  shipmentId: string
  driverId: string
  driverName: string
  assignedBy: string
  timestamp: string
}

class SocketService {
  private socket: Socket | null = null
  private isConnected = false

  constructor() {
    // Only connect when needed
  }

  private connect() {
    if (typeof window === 'undefined') return // Server-side guard

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    
    // Try to get auth token from localStorage (if user is logged in)
    let authToken = null
    try {
      authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    } catch (error) {
      // Ignore localStorage errors (e.g., in incognito mode)
    }
    
    const socketOptions: any = {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000, // 10 second timeout
      reconnection: true, // Enable auto-reconnection
      reconnectionAttempts: 3, // Retry 3 times
      reconnectionDelay: 2000, // 2 seconds between retries
      autoConnect: true, // Auto-connect
      forceNew: false, // Reuse existing connection
    }
    
    // Add auth token if available (for authenticated users)
    if (authToken) {
      socketOptions.auth = {
        token: authToken
      }
    }
    // If no token, socket will connect as anonymous user
    
    this.socket = io(socketUrl, socketOptions)

    this.socket.on('connect', () => {
      logger.debug('Socket.IO connected', { socketId: this.socket?.id })
      this.isConnected = true
      
      // Log connection type
      const connectionInfo = this.getConnectionInfo()
      logger.debug('Socket connection established', { userType: connectionInfo.userType })
    })

    this.socket.on('disconnect', (reason) => {
      logger.debug('Socket.IO disconnected', { reason })
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      logger.error('Socket.IO connection error', error)
      this.isConnected = false
    })

    this.socket.on('reconnect_failed', () => {
      logger.error('Socket.IO reconnection failed after attempts')
      this.isConnected = false
    })

    // Try to connect
    this.socket.connect()
  }

  /**
   * Async connection initialization with promise-based waiting
   */
  private async initConnection(): Promise<void> {
    if (typeof window === 'undefined') return // Server-side guard
    
    if (this.socket && this.isConnected) return // Already connected

    if (!this.socket) {
      this.connect()
    }

    // Wait for connection to establish
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        resolve()
        return
      }

      const onConnect = () => {
        this.socket?.off('connect', onConnect)
        this.socket?.off('connect_error', onError)
        resolve()
      }

      const onError = () => {
        this.socket?.off('connect', onConnect)
        this.socket?.off('connect_error', onError)
        resolve() // Resolve anyway to not block the caller
      }

      this.socket?.on('connect', onConnect)
      this.socket?.on('connect_error', onError)

      // Timeout after 5 seconds
      setTimeout(() => {
        this.socket?.off('connect', onConnect)
        this.socket?.off('connect_error', onError)
        resolve()
      }, 5000)
    })
  }

  /**
   * Subscribe to driver location updates for a specific shipment
   */
  subscribeToDriverLocation(shipmentId: string, callback: (location: DriverLocation) => void) {
    // Initialize connection if not already done
    if (!this.socket) {
      this.connect()
    }

    if (!this.socket) return

    const eventName = `driver-location-${shipmentId}`
    
    this.socket.on(eventName, callback)
    
    // Join the shipment room
    this.socket.emit('join-shipment', shipmentId)

    // Return unsubscribe function
    return () => {
      this.socket?.off(eventName, callback)
      this.socket?.emit('leave-shipment', shipmentId)
    }
  }

  /**
   * Subscribe to shipment status updates
   */
  subscribeToShipmentUpdates(shipmentId: string, callback: (update: ShipmentUpdate) => void) {
    // Initialize connection if not already done
    if (!this.socket) {
      this.connect()
    }

    if (!this.socket) return

    const eventName = `shipment-update-${shipmentId}`
    
    this.socket.on(eventName, callback)
    
    // Join the shipment room
    this.socket.emit('join-shipment', shipmentId)

    // Return unsubscribe function
    return () => {
      this.socket?.off(eventName, callback)
      this.socket?.emit('leave-shipment', shipmentId)
    }
  }

  /**
   * Emit driver location update (for driver app)
   */
  updateDriverLocation(location: DriverLocation) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('driver-location-update', location)
  }

  /**
   * Emit shipment status update (for driver/admin app)
   */
  updateShipmentStatus(update: ShipmentUpdate) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('shipment-status-update', update)
  }

  /**
   * Subscribe to admin updates for a specific shipment
   */
  subscribeToAdminUpdates(shipmentId: string, callback: (update: AdminUpdate) => void) {
    // Initialize connection if not already done
    if (!this.socket) {
      this.connect()
    }

    if (!this.socket) return

    const eventName = `admin-update-${shipmentId}`
    
    this.socket.on(eventName, callback)
    
    // Join the shipment room
    this.socket.emit('join-shipment', shipmentId)

    // Return unsubscribe function
    return () => {
      this.socket?.off(eventName, callback)
      this.socket?.emit('leave-shipment', shipmentId)
    }
  }

  /**
   * Subscribe to driver assignment updates
   */
  subscribeToDriverAssignments(callback: (assignment: DriverAssignment) => void) {
    // Initialize connection if not already done
    if (!this.socket) {
      this.connect()
    }

    if (!this.socket) return

    this.socket.on('driver-assignment', callback)

    // Return unsubscribe function
    return () => {
      this.socket?.off('driver-assignment', callback)
    }
  }

  /**
   * Emit admin update (for admin dashboard)
   */
  emitAdminUpdate(update: AdminUpdate) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('admin-update', update)
  }

  /**
   * Emit driver assignment (for admin dashboard)
   */
  assignDriverToShipment(assignment: DriverAssignment) {
    if (!this.socket || !this.isConnected) return

    this.socket.emit('assign-driver', assignment)
  }

  /**
   * Subscribe to all driver locations (for admin dashboard)
   */
  async subscribeToAllDrivers(callback: (location: DriverLocation) => void) {
    // Initialize connection and wait for it to be ready
    await this.initConnection()

    if (!this.socket) {
      // Return noop unsubscribe if socket is still absent
      return () => {}
    }

    this.socket.on('driver-location-broadcast', callback)

    // Return unsubscribe function
    return () => {
      this.socket?.off('driver-location-broadcast', callback)
    }
  }

  /**
   * Subscribe to all admin activities (for admin dashboard)
   */
  subscribeToAllAdminActivities(callback: (update: AdminUpdate) => void) {
    // Initialize connection if not already done
    if (!this.socket) {
      this.connect()
    }

    if (!this.socket) return

    this.socket.on('admin-activity-broadcast', callback)

    // Return unsubscribe function
    return () => {
      this.socket?.off('admin-activity-broadcast', callback)
    }
  }

  /**
   * Get connection status and user type
   */
  getConnectionInfo(): { connected: boolean; userType: 'authenticated' | 'anonymous' | 'disconnected' } {
    if (!this.socket || !this.isConnected) {
      return { connected: false, userType: 'disconnected' }
    }
    
    // Check if we have an auth token
    let hasToken = false
    try {
      hasToken = !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))
    } catch (error) {
      // Ignore localStorage errors
    }
    
    return { 
      connected: true, 
      userType: hasToken ? 'authenticated' : 'anonymous' 
    }
  }

  /**
   * Get connection status
   */
  isSocketConnected(): boolean {
    if (!this.socket) {
      this.connect()
      return false
    }
    return this.isConnected && this.socket?.connected === true
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }
}

// Export singleton instance
export const socketService = new SocketService()

// Export types
export type { DriverLocation, ShipmentUpdate, AdminUpdate, DriverAssignment }