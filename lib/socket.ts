// Socket.io client for real-time tracking updates
import io, { type Socket } from "socket.io-client"
import type { TrackingUpdate, DriverLocation } from "./types" // Assuming TrackingUpdate and DriverLocation are declared in a separate file

let socket: Socket | null = null

export function initializeSocket() {
  if (socket) return socket

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on("connect", () => {
    console.log("[Socket] Connected to tracking server")
  })

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected from tracking server")
  })

  socket.on("error", (error) => {
    console.error("[Socket] Error:", error)
  })

  return socket
}

export function getSocket() {
  if (!socket) {
    initializeSocket()
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Event listeners for real-time updates
export function onTrackingUpdate(callback: (data: TrackingUpdate) => void) {
  const socket = getSocket()
  socket?.on("tracking:update", callback)

  return () => {
    socket?.off("tracking:update", callback)
  }
}

export function onDriverLocationUpdate(callback: (data: DriverLocation) => void) {
  const socket = getSocket()
  socket?.on("driver:location", callback)

  return () => {
    socket?.off("driver:location", callback)
  }
}

export function onStatusChanged(callback: (data: TrackingUpdate) => void) {
  const socket = getSocket()
  socket?.on("shipment:status-changed", callback)

  return () => {
    socket?.off("shipment:status-changed", callback)
  }
}

// Emit functions
export function subscribeToShipment(trackingNumber: string) {
  const socket = getSocket()
  socket?.emit("subscribe:shipment", { trackingNumber })
}

export function unsubscribeFromShipment(trackingNumber: string) {
  const socket = getSocket()
  socket?.emit("unsubscribe:shipment", { trackingNumber })
}

export function updateDriverLocation(latitude: number, longitude: number) {
  const socket = getSocket()
  socket?.emit("driver:location-update", { latitude, longitude, timestamp: new Date() })
}
