"use client"

// Client-side Socket.IO utilities (for browser usage ONLY)
// This file is safe to import in client components

let clientSocket: any = null

export function subscribeToShipment(trackingNumber: string) {
  if (typeof window === 'undefined') return // Server-side guard
  
  // Import socket.io-client dynamically to avoid SSR issues
  import('socket.io-client').then(({ io }) => {
    if (!clientSocket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      clientSocket = io(socketUrl)
    }
    
    clientSocket.emit('subscribe:shipment', { trackingNumber })
  }).catch(() => {
    // Silently fail if socket.io-client is not available
  })
}

export function unsubscribeFromShipment(trackingNumber: string) {
  if (typeof window === 'undefined' || !clientSocket) return
  
  clientSocket.emit('unsubscribe:shipment', { trackingNumber })
}

export function onTrackingUpdate(callback: (update: TrackingUpdate) => void) {
  if (typeof window === 'undefined') return () => {}
  
  const handleUpdate = (update: TrackingUpdate) => {
    callback(update)
  }
  
  if (clientSocket) {
    clientSocket.on('tracking:update', handleUpdate)
    
    return () => {
      clientSocket.off('tracking:update', handleUpdate)
    }
  }
  
  // Return empty unsubscribe function if no socket
  return () => {}
}

export function onDriverLocationUpdate(callback: (location: DriverLocation) => void) {
  if (typeof window === 'undefined') return () => {}
  
  const handleLocationUpdate = (location: DriverLocation) => {
    callback(location)
  }
  
  if (clientSocket) {
    clientSocket.on('driver:location', handleLocationUpdate)
    
    return () => {
      clientSocket.off('driver:location', handleLocationUpdate)
    }
  }
  
  // Return empty unsubscribe function if no socket
  return () => {}
}