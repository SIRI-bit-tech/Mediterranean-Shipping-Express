/**
 * React Hook for Real-time Tracking Updates
 * Integrates Socket.IO with MapLibre GL for live driver location updates
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { socketService, type ShipmentUpdate, type AdminUpdate } from '@/lib/socket-client'
import type { DriverLocation } from '@/lib/types/global'

interface UseRealTimeTrackingProps {
  shipmentId: string
  onDriverLocationUpdate?: (location: DriverLocation) => void
  onShipmentStatusUpdate?: (update: ShipmentUpdate) => void
  onAdminUpdate?: (update: AdminUpdate) => void
}

interface TrackingState {
  isConnected: boolean
  lastDriverLocation: DriverLocation | null
  lastShipmentUpdate: ShipmentUpdate | null
  lastAdminUpdate: AdminUpdate | null
}

export function useRealTimeTracking({
  shipmentId,
  onDriverLocationUpdate,
  onShipmentStatusUpdate,
  onAdminUpdate
}: UseRealTimeTrackingProps) {
  const [state, setState] = useState<TrackingState>({
    isConnected: false,
    lastDriverLocation: null,
    lastShipmentUpdate: null,
    lastAdminUpdate: null
  })

  const unsubscribeRefs = useRef<(() => void)[]>([])
  
  // Use refs for callbacks to prevent dependency issues
  const onDriverLocationUpdateRef = useRef(onDriverLocationUpdate)
  const onShipmentStatusUpdateRef = useRef(onShipmentStatusUpdate)
  const onAdminUpdateRef = useRef(onAdminUpdate)

  // Update callback refs when they change
  useEffect(() => {
    onDriverLocationUpdateRef.current = onDriverLocationUpdate
  }, [onDriverLocationUpdate])

  useEffect(() => {
    onShipmentStatusUpdateRef.current = onShipmentStatusUpdate
  }, [onShipmentStatusUpdate])

  useEffect(() => {
    onAdminUpdateRef.current = onAdminUpdate
  }, [onAdminUpdate])

  // Stable connection check function
  const checkConnection = useCallback(() => {
    const connected = socketService.isSocketConnected()
    setState(prev => ({
      ...prev,
      isConnected: connected
    }))
  }, [])

  useEffect(() => {
    if (!shipmentId) return

    // Initial connection check
    checkConnection()

    // Set up periodic connection checks (less frequent)
    const connectionInterval = setInterval(checkConnection, 10000) // Check every 10 seconds

    // Subscribe to driver location updates
    const unsubscribeDriverLocation = socketService.subscribeToDriverLocation(
      shipmentId,
      (location: DriverLocation) => {
        setState(prev => ({
          ...prev,
          lastDriverLocation: location,
          isConnected: true // Update connection status on successful message
        }))

        // Call external callback if provided
        if (onDriverLocationUpdateRef.current) {
          onDriverLocationUpdateRef.current(location)
        }
      }
    )

    // Subscribe to shipment status updates
    const unsubscribeShipmentUpdates = socketService.subscribeToShipmentUpdates(
      shipmentId,
      (update: ShipmentUpdate) => {
        setState(prev => ({
          ...prev,
          lastShipmentUpdate: update,
          isConnected: true // Update connection status on successful message
        }))

        // Call external callback if provided
        if (onShipmentStatusUpdateRef.current) {
          onShipmentStatusUpdateRef.current(update)
        }
      }
    )

    // Subscribe to admin updates
    const unsubscribeAdminUpdates = socketService.subscribeToAdminUpdates(
      shipmentId,
      (update: AdminUpdate) => {
        setState(prev => ({
          ...prev,
          lastAdminUpdate: update,
          isConnected: true // Update connection status on successful message
        }))

        // Call external callback if provided
        if (onAdminUpdateRef.current) {
          onAdminUpdateRef.current(update)
        }
      }
    )

    // Store unsubscribe functions
    if (unsubscribeDriverLocation) {
      unsubscribeRefs.current.push(unsubscribeDriverLocation)
    }
    if (unsubscribeShipmentUpdates) {
      unsubscribeRefs.current.push(unsubscribeShipmentUpdates)
    }
    if (unsubscribeAdminUpdates) {
      unsubscribeRefs.current.push(unsubscribeAdminUpdates)
    }

    // Cleanup function
    return () => {
      clearInterval(connectionInterval)
      
      // Call all unsubscribe functions
      unsubscribeRefs.current.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      })
      unsubscribeRefs.current = []
    }
  }, [shipmentId, checkConnection]) // Only depend on shipmentId and stable checkConnection

  return state
}

/**
 * Hook for updating driver location (for driver app)
 */
export function useDriverLocationUpdater() {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateLocation = async (location: DriverLocation) => {
    setIsUpdating(true)
    try {
      socketService.updateDriverLocation(location)
    } catch (error) {
      console.error('Failed to update driver location', {
        error: error instanceof Error ? error.message : error,
        driverId: location.driverId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
          accuracy: location.accuracy
        }
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return {
    updateLocation,
    isUpdating
  }
}

/**
 * Hook for admin dashboard to monitor all activities
 */
export function useAdminDashboard() {
  const [drivers, setDrivers] = useState<Map<string, DriverLocation>>(new Map())
  const [adminActivities, setAdminActivities] = useState<AdminUpdate[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check connection status
    const checkConnection = () => {
      setIsConnected(socketService.isSocketConnected())
    }

    checkConnection()
    const connectionInterval = setInterval(checkConnection, 5000)

    let unsubscribeDrivers: (() => void) | null = null

    // Subscribe to all driver location updates (async)
    const unsubscribePromise = socketService.subscribeToAllDrivers((location: DriverLocation) => {
      setDrivers(prev => {
        const updated = new Map(prev)
        updated.set(location.driverId, location)
        return updated
      })
    })

    unsubscribePromise.then(unsubscribe => {
      unsubscribeDrivers = unsubscribe
    })

    // Subscribe to all admin activities
    const unsubscribeAdminActivities = socketService.subscribeToAllAdminActivities((update: AdminUpdate) => {
      setAdminActivities(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 activities
    })

    return () => {
      clearInterval(connectionInterval)
      
      // Handle async unsubscribe properly
      if (unsubscribeDrivers) {
        unsubscribeDrivers()
      } else {
        // If unsubscribeDrivers hasn't been set yet, wait for the promise
        unsubscribePromise.then(unsubscribe => {
          if (unsubscribe) {
            unsubscribe()
          }
        })
      }
      
      if (unsubscribeAdminActivities) {
        unsubscribeAdminActivities()
      }
    }
  }, [])

  // Admin action functions
  const updateShipmentStatus = (shipmentId: string, status: string, adminId: string, adminName: string) => {
    const update: AdminUpdate = {
      type: 'status_change',
      shipmentId,
      adminId,
      adminName,
      data: { status, previousStatus: null },
      timestamp: new Date().toISOString()
    }
    socketService.emitAdminUpdate(update)
  }

  const assignDriver = (shipmentId: string, driverId: string, driverName: string, adminId: string, adminName: string) => {
    const assignment = {
      shipmentId,
      driverId,
      driverName,
      assignedBy: adminName,
      timestamp: new Date().toISOString()
    }
    socketService.assignDriverToShipment(assignment)

    const update: AdminUpdate = {
      type: 'driver_assignment',
      shipmentId,
      adminId,
      adminName,
      data: { driverId, driverName },
      timestamp: new Date().toISOString()
    }
    socketService.emitAdminUpdate(update)
  }

  return {
    drivers: Array.from(drivers.values()),
    adminActivities,
    isConnected,
    updateShipmentStatus,
    assignDriver
  }
}