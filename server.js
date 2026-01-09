const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

// Load environment variables from .env file
require('dotenv').config()

const { verifyToken } = require('./lib/jwt')
const { query } = require('./lib/db')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

const app = next({ dev, hostname, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler)
  
  // Parse allowed origins from environment variable
  const getAllowedOrigins = () => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
    
    if (!allowedOrigins) {
      // Default to localhost in development, require explicit configuration in production
      if (dev) {
        return ['http://localhost:3000', 'http://127.0.0.1:3000']
      } else {
        console.warn('WARNING: ALLOWED_ORIGINS not set in production. Socket.IO connections will be rejected.')
        return []
      }
    }
    
    // Parse comma-separated origins and always include localhost in development
    const origins = allowedOrigins.split(',').map(origin => origin.trim()).filter(Boolean)
    
    // Always allow localhost in development
    if (dev) {
      if (!origins.includes('http://localhost:3000')) {
        origins.push('http://localhost:3000')
      }
      if (!origins.includes('http://127.0.0.1:3000')) {
        origins.push('http://127.0.0.1:3000')
      }
    }
    
    return origins
  }
  
  // Origin validation function
  const validateOrigin = (origin, callback) => {
    const allowedOrigins = getAllowedOrigins()
    
    console.log(`Socket.IO CORS check - Origin: ${origin}, Allowed: [${allowedOrigins.join(', ')}], Dev mode: ${dev}`)
    
    // Allow requests with no origin (mobile apps, server-to-server)
    if (!origin) {
      console.log('Socket.IO: Allowing request with no origin')
      return callback(null, true)
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log(`Socket.IO: Allowing origin ${origin}`)
      return callback(null, true)
    }
    
    console.warn(`Socket.IO connection rejected from unauthorized origin: ${origin}`)
    console.warn(`Allowed origins: [${allowedOrigins.join(', ')}]`)
    return callback(new Error('Origin not allowed by CORS policy'), false)
  }
  
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? true : validateOrigin, // Allow all origins in development
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  // Make io instance available globally for API routes
  global.io = io

  // Flexible Authentication middleware - supports both authenticated and anonymous users
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        // Allow anonymous users for public tracking
        socket.user = {
          id: 'anonymous',
          name: 'Anonymous User',
          email: 'anonymous@tracking.com',
          role: 'ANONYMOUS'
        }
        console.log(`Socket connected (anonymous): ${socket.id}`)
        return next()
      }

      try {
        // Verify JWT token for authenticated users
        const decoded = await verifyToken(token)
        if (!decoded) {
          // Invalid token - fallback to anonymous
          socket.user = {
            id: 'anonymous',
            name: 'Anonymous User',
            email: 'anonymous@tracking.com',
            role: 'ANONYMOUS'
          }
          console.log(`Socket connected (anonymous - invalid token): ${socket.id}`)
          return next()
        }

        // Get user from database to ensure they're still active
        const result = await query(
          'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
          [decoded.id]
        )

        if (result.rows.length === 0 || !result.rows[0].is_active) {
          // User not found or inactive - fallback to anonymous
          socket.user = {
            id: 'anonymous',
            name: 'Anonymous User',
            email: 'anonymous@tracking.com',
            role: 'ANONYMOUS'
          }
          console.log(`Socket connected (anonymous - user not found): ${socket.id}`)
          return next()
        }

        const user = result.rows[0]
        
        // Verify role matches token
        if (user.role !== decoded.role) {
          // Role mismatch - fallback to anonymous
          socket.user = {
            id: 'anonymous',
            name: 'Anonymous User',
            email: 'anonymous@tracking.com',
            role: 'ANONYMOUS'
          }
          console.log(`Socket connected (anonymous - role mismatch): ${socket.id}`)
          return next()
        }

        // Attach authenticated user to socket
        socket.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }

        console.log(`Socket authenticated: ${user.name} (${user.role}) - ${socket.id}`)
        next()
      } catch (error) {
        // Token verification failed - fallback to anonymous
        console.log(`Socket authentication failed, using anonymous: ${error.message}`)
        socket.user = {
          id: 'anonymous',
          name: 'Anonymous User',
          email: 'anonymous@tracking.com',
          role: 'ANONYMOUS'
        }
        next()
      }
    } catch (error) {
      console.error('Socket authentication error:', error)
      // Even on error, allow anonymous access
      socket.user = {
        id: 'anonymous',
        name: 'Anonymous User',
        email: 'anonymous@tracking.com',
        role: 'ANONYMOUS'
      }
      next()
    }
  })

  // Helper function to check shipment ownership/access
  const checkShipmentAccess = async (userId, userRole, shipmentId) => {
    try {
      
      // Admin can access all shipments
      if (userRole === 'ADMIN') {
        return true
      }
      
      // Anonymous users can only track shipments (read-only access)
      if (userRole === 'ANONYMOUS') {
        // Check if shipment exists (anonymous users can track any existing shipment)
        // Handle both UUID and tracking number safely
        const result = await query(
          `SELECT id FROM shipments 
           WHERE (
             (CASE WHEN $1 ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
              THEN id = $1::uuid 
              ELSE false END) 
             OR tracking_number = $1
           ) AND deleted_at IS NULL`,
          [shipmentId]
        )
        return result.rows.length > 0
      }
      
      // Check if user owns the shipment or is assigned as driver
      const result = await query(
        `SELECT user_id, driver_id FROM shipments 
         WHERE (
           (CASE WHEN $1 ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
            THEN id = $1::uuid 
            ELSE false END) 
           OR tracking_number = $1
         ) AND deleted_at IS NULL`,
        [shipmentId]
      )
      
      if (result.rows.length === 0) {
        return false
      }
      
      const shipment = result.rows[0]
      
      // Customer can access their own shipments
      if (userRole === 'CUSTOMER' && shipment.user_id === userId) {
        return true
      }
      
      // Driver can access assigned shipments
      if (userRole === 'DRIVER' && shipment.driver_id === userId) {
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error checking shipment access:', error)
      return false
    }
  }

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.user.name} (${socket.user.role}) - ${socket.id}`)

    // Handle joining shipment rooms with authorization
    socket.on('join-shipment', async (shipmentId) => {
      try {
        if (!shipmentId) {
          socket.emit('error', { message: 'Shipment ID required' })
          return
        }

        // Check if user has access to this shipment
        const hasAccess = await checkShipmentAccess(socket.user.id, socket.user.role, shipmentId)
        
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to shipment' })
          console.warn(`Access denied: ${socket.user.name} tried to join shipment ${shipmentId}`)
          return
        }

        socket.join(`shipment-${shipmentId}`)
        console.log(`${socket.user.name} (${socket.user.role}) joined shipment room: ${shipmentId}`)
        socket.emit('joined-shipment', { shipmentId })
      } catch (error) {
        console.error('Error joining shipment room:', error)
        socket.emit('error', { message: 'Failed to join shipment room' })
      }
    })

    // Handle leaving shipment rooms
    socket.on('leave-shipment', (shipmentId) => {
      socket.leave(`shipment-${shipmentId}`)
      console.log(`${socket.user.name} left shipment room: ${shipmentId}`)
    })

    // Handle driver location updates with role and ownership validation
    socket.on('driver-location-update', async (location) => {
      try {
        // Only drivers can update location
        if (socket.user.role !== 'DRIVER') {
          socket.emit('error', { message: 'Only drivers can update location' })
          return
        }

        if (!location.shipmentId || !location.latitude || !location.longitude) {
          socket.emit('error', { message: 'Invalid location data' })
          return
        }

        // Verify driver is assigned to this shipment
        const hasAccess = await checkShipmentAccess(socket.user.id, socket.user.role, location.shipmentId)
        
        if (!hasAccess) {
          socket.emit('error', { message: 'Driver not assigned to this shipment' })
          console.warn(`Unauthorized location update: ${socket.user.name} for shipment ${location.shipmentId}`)
          return
        }

        // Add driver info to location update
        const locationUpdate = {
          ...location,
          driverId: socket.user.id,
          driverName: socket.user.name,
          timestamp: new Date().toISOString()
        }

        console.log(`Driver location update from ${socket.user.name}:`, locationUpdate)
        socket.to(`shipment-${location.shipmentId}`).emit(`driver-location-${location.shipmentId}`, locationUpdate)
      } catch (error) {
        console.error('Error handling driver location update:', error)
        socket.emit('error', { message: 'Failed to update location' })
      }
    })

    // Handle shipment status updates with role validation
    socket.on('shipment-status-update', async (update) => {
      try {
        // Only drivers and admins can update shipment status
        if (!['DRIVER', 'ADMIN'].includes(socket.user.role)) {
          socket.emit('error', { message: 'Insufficient permissions to update shipment status' })
          return
        }

        if (!update.shipmentId || !update.status) {
          socket.emit('error', { message: 'Invalid status update data' })
          return
        }

        // Check access to shipment
        const hasAccess = await checkShipmentAccess(socket.user.id, socket.user.role, update.shipmentId)
        
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to shipment' })
          console.warn(`Unauthorized status update: ${socket.user.name} for shipment ${update.shipmentId}`)
          return
        }

        // Add user info to update
        const statusUpdate = {
          ...update,
          updatedBy: socket.user.role.toLowerCase(),
          updatedById: socket.user.id,
          updatedByName: socket.user.name,
          timestamp: new Date().toISOString()
        }

        console.log(`Shipment status update from ${socket.user.name}:`, statusUpdate)
        socket.to(`shipment-${update.shipmentId}`).emit(`shipment-update-${update.shipmentId}`, statusUpdate)
      } catch (error) {
        console.error('Error handling shipment status update:', error)
        socket.emit('error', { message: 'Failed to update shipment status' })
      }
    })

    // Handle admin updates with strict role validation
    socket.on('admin-update', async (update) => {
      try {
        // Only admins can send admin updates
        if (socket.user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Admin role required' })
          return
        }

        if (!update.shipmentId || !update.type) {
          socket.emit('error', { message: 'Invalid admin update data' })
          return
        }

        // Add admin info to update
        const adminUpdate = {
          ...update,
          adminId: socket.user.id,
          adminName: socket.user.name,
          timestamp: new Date().toISOString()
        }

        console.log(`Admin update from ${socket.user.name}:`, adminUpdate)
        
        // Send to specific shipment room
        socket.to(`shipment-${update.shipmentId}`).emit(`admin-update-${update.shipmentId}`, adminUpdate)
        
        // Only broadcast to admin activity feed for admins
        io.to('admin-room').emit('admin-activity-broadcast', adminUpdate)
      } catch (error) {
        console.error('Error handling admin update:', error)
        socket.emit('error', { message: 'Failed to process admin update' })
      }
    })

    // Handle driver assignments with admin role validation
    socket.on('assign-driver', async (assignment) => {
      try {
        // Only admins can assign drivers
        if (socket.user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Admin role required for driver assignment' })
          return
        }

        if (!assignment.shipmentId || !assignment.driverId) {
          socket.emit('error', { message: 'Invalid assignment data' })
          return
        }

        // Add admin info to assignment
        const driverAssignment = {
          ...assignment,
          assignedBy: socket.user.id,
          assignedByName: socket.user.name,
          timestamp: new Date().toISOString()
        }

        console.log(`Driver assignment from ${socket.user.name}:`, driverAssignment)
        
        // Emit to driver assignment listeners (admins only)
        io.to('admin-room').emit('driver-assignment', driverAssignment)
      } catch (error) {
        console.error('Error handling driver assignment:', error)
        socket.emit('error', { message: 'Failed to assign driver' })
      }
    })

    // Auto-join admin room for admin users (not anonymous)
    if (socket.user.role === 'ADMIN' && socket.user.id !== 'anonymous') {
      socket.join('admin-room')
      console.log(`Admin ${socket.user.name} joined admin room`)
    }

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.user.name} (${socket.user.role}) - ${socket.id}`)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.IO server is running')
      console.log(`> Development mode: ${dev}`)
      console.log(`> Socket.IO CORS origins: ${getAllowedOrigins().join(', ')}`)
    })
})