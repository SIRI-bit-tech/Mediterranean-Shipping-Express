// Server-side Socket.IO utilities ONLY
import type { Server as HTTPServer } from "http"
import { Server as IOServer } from "socket.io"
import { logger } from "./logger"

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
    logger.debug("Socket user connected", { socketId: socket.id })

    // Subscribe to shipment updates
    socket.on("subscribe:shipment", (data: { trackingNumber: string }) => {
      socket.join(`shipment:${data.trackingNumber}`)
      logger.debug("Socket subscribed to shipment", { 
        trackingNumber: data.trackingNumber,
        socketId: socket.id 
      })
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
      logger.debug("Socket user disconnected", { socketId: socket.id })
    })
  })

  return io
}

export function broadcastTrackingUpdate(trackingNumber: string, update: TrackingUpdate) {
  if (io) {
    io.to(`shipment:${trackingNumber}`).emit("tracking:update", update)
    logger.debug("Broadcast tracking update", { trackingNumber })
  }
}

export function broadcastStatusChange(trackingNumber: string, update: TrackingUpdate) {
  if (io) {
    io.to(`shipment:${trackingNumber}`).emit("shipment:status-changed", update)
    logger.debug("Broadcast status change", { trackingNumber, status: update.status })
  }
}

export function getSocketIO() {
  return io
}