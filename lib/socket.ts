"use client"

// Client-side Socket.IO utilities (for browser usage ONLY)
// This file is safe to import in client components

let clientSocket: any = null
let socketInitPromise: Promise<any> | null = null

// Initialize socket connection
function initializeSocket() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  
  if (socketInitPromise) return socketInitPromise
  
  socketInitPromise = import('socket.io-client').then(({ io }) => {
    if (!clientSocket) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
      clientSocket = io(socketUrl)
    }
    return clientSocket
  }).catch(() => {
    // Silently fail if socket.io-client is not available
    return null
  })
  
  return socketInitPromise
}

export function subscribeToShipment(trackingNumber: string) {
  if (typeof window === 'undefined') return // Server-side guard
  
  initializeSocket().then(socket => {
    if (socket) {
      socket.emit('subscribe:shipment', { trackingNumber })
    }
  })
}

export function unsubscribeFromShipment(trackingNumber: string) {
  if (typeof window === 'undefined') return
  
  // Only emit unsubscribe if socket already exists or initialization is in progress
  if (clientSocket) {
    // Socket already exists, emit directly
    clientSocket.emit('unsubscribe:shipment', { trackingNumber })
  } else if (socketInitPromise) {
    // Initialization is in progress, wait for it to complete
    socketInitPromise.then(socket => {
      if (socket) {
        socket.emit('unsubscribe:shipment', { trackingNumber })
      }
    })
  }
  // If no socket exists and no initialization in progress, do nothing
}

export function onTrackingUpdate(callback: (update: TrackingUpdate) => void) {
  if (typeof window === 'undefined') return () => {}
  
  const handleUpdate = (update: TrackingUpdate) => {
    callback(update)
  }
  
  let unsubscribe = () => {}
  
  initializeSocket().then(socket => {
    if (socket) {
      socket.on('tracking:update', handleUpdate)
      
      unsubscribe = () => {
        socket.off('tracking:update', handleUpdate)
      }
    }
  })
  
  return () => unsubscribe()
}

export function onDriverLocationUpdate(callback: (location: DriverLocation) => void) {
  if (typeof window === 'undefined') return () => {}
  
  const handleLocationUpdate = (location: DriverLocation) => {
    callback(location)
  }
  
  let unsubscribe = () => {}
  
  initializeSocket().then(socket => {
    if (socket) {
      socket.on('driver:location', handleLocationUpdate)
      
      unsubscribe = () => {
        socket.off('driver:location', handleLocationUpdate)
      }
    }
  })
  
  return () => unsubscribe()
}