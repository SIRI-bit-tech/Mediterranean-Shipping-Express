import type { Server as HTTPServer } from "http"
import { Server as IOServer } from "socket.io"
import type { TrackingUpdate } from "@/types" // Declare the TrackingUpdate variable

let io: IOServer | null = null

export function initializeSocketIO(httpServer: HTTPServer) {
  if (io) return io

  io = new IOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("[Socket] User connected:", socket.id)

    // Subscribe to shipment updates
    socket.on("subscribe:shipment", (data: { trackingNumber: string }) => {
      socket.join(`shipment:${data.trackingNumber}`)
      console.log(`[Socket] Subscribed to shipment: ${data.trackingNumber}`)
    })

    // Unsubscribe from shipment
    socket.on("unsubscribe:shipment", (data: { trackingNumber: string }) => {
      socket.leave(`shipment:${data.trackingNumber}`)
    })

    // Driver location update
    socket.on("driver:location-update", (data: { latitude: number; longitude: number; timestamp: Date }) => {
      io?.emit("driver:location", {
        driverId: socket.id,
        ...data,
      })
    })

    socket.on("disconnect", () => {
      console.log("[Socket] User disconnected:", socket.id)
    })
  })

  return io
}

export function broadcastTrackingUpdate(trackingNumber: string, update: TrackingUpdate) {
  if (io) {
    io.to(`shipment:${trackingNumber}`).emit("tracking:update", update)
  }
}

export function broadcastStatusChange(trackingNumber: string, update: TrackingUpdate) {
  if (io) {
    io.to(`shipment:${trackingNumber}`).emit("shipment:status-changed", update)
  }
}
