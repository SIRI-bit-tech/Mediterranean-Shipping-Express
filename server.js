const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Handle joining shipment rooms
    socket.on('join-shipment', (shipmentId) => {
      socket.join(`shipment-${shipmentId}`)
      console.log(`Client ${socket.id} joined shipment room: ${shipmentId}`)
    })

    // Handle leaving shipment rooms
    socket.on('leave-shipment', (shipmentId) => {
      socket.leave(`shipment-${shipmentId}`)
      console.log(`Client ${socket.id} left shipment room: ${shipmentId}`)
    })

    // Handle driver location updates
    socket.on('driver-location-update', (location) => {
      console.log('Driver location update:', location)
      if (location.shipmentId) {
        socket.to(`shipment-${location.shipmentId}`).emit(`driver-location-${location.shipmentId}`, location)
      }
    })

    // Handle shipment status updates
    socket.on('shipment-status-update', (update) => {
      console.log('Shipment status update:', update)
      socket.to(`shipment-${update.shipmentId}`).emit(`shipment-update-${update.shipmentId}`, update)
    })

    // Handle admin updates
    socket.on('admin-update', (update) => {
      console.log('Admin update:', update)
      socket.to(`shipment-${update.shipmentId}`).emit(`admin-update-${update.shipmentId}`, update)
      io.emit('admin-activity-broadcast', update)
    })

    // Handle driver assignments
    socket.on('assign-driver', (assignment) => {
      console.log('Driver assignment:', assignment)
      io.emit('driver-assignment', assignment)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.IO server is running')
    })
})