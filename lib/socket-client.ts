/**
 * Socket.IO Client for Real-time Updates
 * Handles driver location updates and shipment status changes
 */

import { io, Socket } from 'socket.io-client'

interface DriverLocation {
  driverId: string
  latitude: number
  longitude: number
  timestamp: string
  shipmentId?: string
}

interface ShipmentUpdate {
  shipmentId: string
  status: string
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
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 10000, // 10 second timeout
      reconnection: true, // Enable auto-reconnection
      reconnectionAttempts: 2, // Retry 2 times
      reconnectionDelay: 3000, // 3 seconds between retries
      autoConnect: true, // Auto-connect
    })

    this.socket.on('connect', () => {
      console.log('Socket.IO connected:', this.socket?.id)
      this.isConnected = true
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
      this.isConnected = false
    })

    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed after 2 attempts')
      this.isConnected = false
    })

    // Try to connect
    this.socket.connect()
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
  subscribeToAllDrivers(callback: (location: DriverLocation) => void) {
    if (!this.socket) return

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
    if (!this.socket) return

    this.socket.on('admin-activity-broadcast', callback)

    // Return unsubscribe function
    return () => {
      this.socket?.off('admin-activity-broadcast', callback)
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