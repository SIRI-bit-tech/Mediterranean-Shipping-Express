import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shipmentId, requestType, requestData, reason, customerNotes } = body

    // Validate request type
    const validTypes = ['HOLD', 'REDIRECT', 'RESCHEDULE', 'RETURN', 'INTERCEPT']
    if (!validTypes.includes(requestType)) {
      return NextResponse.json({ error: "Invalid request type" }, { status: 400 })
    }

    // Verify shipment exists and get details
    const shipmentCheck = await query(
      `SELECT id, user_id, status, tracking_number FROM shipments 
       WHERE tracking_number = $1 AND deleted_at IS NULL`,
      [shipmentId]
    )

    if (shipmentCheck.rows.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 })
    }

    const shipment = shipmentCheck.rows[0]

    // Check if shipment can be modified (not delivered or cancelled)
    const nonModifiableStatuses = ['DELIVERED', 'CANCELLED', 'RETURNED']
    if (nonModifiableStatuses.includes(shipment.status)) {
      return NextResponse.json({ 
        error: `Cannot modify shipment with status: ${shipment.status}` 
      }, { status: 400 })
    }

    // Try to get authenticated user (optional)
    let user = null
    let isAdmin = false
    try {
      user = await requireAuth(request)
      isAdmin = user?.role === 'ADMIN'
    } catch (error) {
      // User not authenticated - that's okay for anonymous requests
    }

    // If user is authenticated, verify they own the shipment or are admin
    if (user) {
      const isOwner = shipment.user_id === user.id
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Create package request
    const result = await query(
      `INSERT INTO package_requests 
       (shipment_id, user_id, request_type, request_data, reason, customer_notes, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        shipment.id, // Use the UUID from the shipment
        user?.id || null, // Allow null for anonymous requests
        requestType,
        JSON.stringify(requestData || {}),
        reason,
        customerNotes,
        user ? (isAdmin ? 'ADMIN' : 'CUSTOMER') : 'CUSTOMER'
      ]
    )

    const packageRequest = result.rows[0]

    // Create history entry
    await query(
      `INSERT INTO package_request_history 
       (package_request_id, action, new_status, performed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        packageRequest.id,
        'REQUEST_CREATED',
        'PENDING',
        user?.id || null, // Handle null user for anonymous requests
        `${requestType} request created by ${user ? (isAdmin ? 'admin' : 'customer') : 'anonymous user'}`
      ]
    )

    // Emit Socket.IO event for real-time updates
    try {
      const io = (global as any).io
      if (io) {
        const updateData = {
          type: 'package_request_created',
          packageRequestId: packageRequest.id,
          shipmentId: shipment.tracking_number,
          requestType,
          requestedBy: user ? (isAdmin ? 'admin' : 'customer') : 'anonymous',
          userId: user?.id || null,
          userName: user?.name || user?.email || 'Anonymous User',
          timestamp: new Date().toISOString()
        }

        // Notify admins
        io.emit('admin-activity-broadcast', updateData)
        
        // Notify shipment owner (if they have an account)
        if (shipment.user_id) {
          io.to(`user-${shipment.user_id}`).emit('package-request-update', updateData)
        }
        
        console.log(`[Socket.IO] Package request created: ${packageRequest.id}`)
      }
    } catch (socketError) {
      console.error('Error emitting Socket.IO event:', socketError)
    }

    return NextResponse.json({
      success: true,
      message: "Package request created successfully",
      data: {
        id: packageRequest.id,
        requestType: packageRequest.request_type,
        status: packageRequest.status,
        createdAt: packageRequest.created_at
      }
    })
  } catch (error) {
    console.error('Error creating package request:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingNumber = searchParams.get('trackingNumber')
    const status = searchParams.get('status')

    // Try to get authenticated user (optional)
    let user = null
    try {
      user = await requireAuth(request)
    } catch (error) {
      // User not authenticated - that's okay for viewing requests by tracking number
    }

    let whereClause = 'WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    // Filter by tracking number if provided
    if (trackingNumber) {
      whereClause += ` AND s.tracking_number = $${paramIndex}`
      params.push(trackingNumber)
      paramIndex++
    }

    // Filter by status if provided
    if (status) {
      whereClause += ` AND pr.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    // If user is authenticated and not admin, only show their requests
    // If no user and no tracking number, return empty (prevent data leakage)
    if (user && user.role !== 'ADMIN') {
      whereClause += ` AND s.user_id = $${paramIndex}`
      params.push(user.id)
      paramIndex++
    } else if (!user && !trackingNumber) {
      // Anonymous users must provide tracking number
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const result = await query(
      `SELECT 
        pr.*,
        s.tracking_number,
        s.status as shipment_status,
        u.name as user_name,
        u.email as user_email,
        approver.name as approved_by_name
       FROM package_requests pr
       JOIN shipments s ON pr.shipment_id = s.id
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN users approver ON pr.approved_by = approver.id
       ${whereClause}
       ORDER BY pr.created_at DESC`,
      params
    )

    return NextResponse.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching package requests:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}