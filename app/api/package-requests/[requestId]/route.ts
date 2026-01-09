import { type NextRequest, NextResponse } from "next/server"
import { pool, query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 })
    }

    const { requestId } = await params
    const body = await request.json()
    const { action, adminNotes, requestData } = body

    // Validate action
    const validActions = ['APPROVE', 'REJECT', 'COMPLETE', 'CANCEL']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Action verb mapping for proper grammar
    const actionVerb: Record<string, string> = {
      APPROVE: 'approved',
      REJECT: 'rejected', 
      COMPLETE: 'completed',
      CANCEL: 'cancelled'
    }

    // Start database transaction
    const client = await pool.connect()
    let updatedRequest: any
    let packageRequest: any
    let oldStatus: string
    let newStatus: string
    let shipmentUpdates: any = {}
    
    try {
      await client.query('BEGIN')

      // Get current request
      const requestResult = await client.query(
        `SELECT pr.*, s.tracking_number, s.user_id, s.status as shipment_status
         FROM package_requests pr
         JOIN shipments s ON pr.shipment_id = s.id
         WHERE pr.id = $1`,
        [requestId]
      )

      if (requestResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ error: "Package request not found" }, { status: 404 })
      }

      packageRequest = requestResult.rows[0]
      oldStatus = packageRequest.status

      // Determine new status based on action
      newStatus = packageRequest.status

      switch (action) {
        case 'APPROVE':
          if (packageRequest.status !== 'PENDING') {
            await client.query('ROLLBACK')
            return NextResponse.json({ error: "Can only approve pending requests" }, { status: 400 })
          }
          newStatus = 'APPROVED'
          
          // Apply the request to the shipment
          switch (packageRequest.request_type) {
            case 'HOLD':
              shipmentUpdates.status = 'ON_HOLD'
              shipmentUpdates.on_hold_reason = packageRequest.reason || 'Customer requested hold'
              break
            case 'REDIRECT': {
              const redirectData = typeof packageRequest.request_data === 'string' 
                ? JSON.parse(packageRequest.request_data) 
                : packageRequest.request_data
              if (redirectData.newAddress) {
                // In a real system, you'd create a new address record
                shipmentUpdates.current_location = redirectData.newAddress
              }
              break
            }
            case 'RETURN':
              shipmentUpdates.status = 'RETURNING'
              break
            case 'RESCHEDULE': {
              const rescheduleData = typeof packageRequest.request_data === 'string' 
                ? JSON.parse(packageRequest.request_data) 
                : packageRequest.request_data
              if (rescheduleData.newDeliveryDate) {
                shipmentUpdates.estimated_delivery_date = rescheduleData.newDeliveryDate
              }
              break
            }
            case 'INTERCEPT':
              // Stop current delivery and put on hold for new instructions
              shipmentUpdates.status = 'ON_HOLD'
              shipmentUpdates.on_hold_reason = `Delivery intercepted: ${packageRequest.reason || 'Customer request'}`
              break
          }
          break

        case 'REJECT':
          if (packageRequest.status !== 'PENDING') {
            await client.query('ROLLBACK')
            return NextResponse.json({ error: "Can only reject pending requests" }, { status: 400 })
          }
          newStatus = 'REJECTED'
          break

        case 'COMPLETE':
          if (packageRequest.status !== 'APPROVED') {
            await client.query('ROLLBACK')
            return NextResponse.json({ error: "Can only complete approved requests" }, { status: 400 })
          }
          newStatus = 'COMPLETED'
          break

        case 'CANCEL':
          if (!['PENDING', 'APPROVED'].includes(packageRequest.status)) {
            await client.query('ROLLBACK')
            return NextResponse.json({ error: "Cannot cancel completed or rejected requests" }, { status: 400 })
          }
          newStatus = 'CANCELLED'
          break
      }

      // Update package request
      const updateResult = await client.query(
        `UPDATE package_requests 
         SET status = $1, admin_notes = $2, approved_by = $3, approved_at = NOW(), updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [newStatus, adminNotes, admin.id, requestId]
      )

      updatedRequest = updateResult.rows[0]

      // Update shipment if needed
      if (Object.keys(shipmentUpdates).length > 0) {
        const updateFields = Object.keys(shipmentUpdates).map((key, index) => `${key} = $${index + 2}`).join(', ')
        const updateValues = [packageRequest.shipment_id, ...Object.values(shipmentUpdates)]
        
        await client.query(
          `UPDATE shipments SET ${updateFields}, updated_at = NOW() WHERE id = $1`,
          updateValues
        )

        // Create tracking checkpoint
        await client.query(
          `INSERT INTO tracking_checkpoints (shipment_id, status, location, timestamp, notes, created_at)
           VALUES ($1, $2, $3, NOW(), $4, NOW())`,
          [
            packageRequest.shipment_id,
            shipmentUpdates.status || packageRequest.shipment_status,
            shipmentUpdates.current_location || 'Admin Action',
            `Package request ${actionVerb[action] ?? action.toLowerCase()}: ${packageRequest.request_type}`
          ]
        )
      }

      // Create history entry
      await client.query(
        `INSERT INTO package_request_history 
         (package_request_id, action, old_status, new_status, performed_by, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          requestId,
          `REQUEST_${action}`,
          oldStatus,
          newStatus,
          admin.id,
          adminNotes || `Request ${actionVerb[action] ?? action.toLowerCase()} by admin`
        ]
      )

      // Commit transaction
      await client.query('COMMIT')
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK')
      throw error
    } finally {
      // Always release the client
      client.release()
    }

    // Emit Socket.IO event for real-time updates
    try {
      const io = (global as any).io
      if (io) {
        const updateData = {
          type: 'package_request_updated',
          packageRequestId: requestId,
          shipmentId: packageRequest.tracking_number,
          requestType: packageRequest.request_type,
          oldStatus,
          newStatus,
          action,
          adminId: admin.id,
          adminName: admin.name || admin.email,
          timestamp: new Date().toISOString()
        }

        // Notify all admins
        io.emit('admin-activity-broadcast', updateData)
        
        // Notify shipment owner
        io.to(`user-${packageRequest.user_id}`).emit('package-request-update', updateData)
        
        // Notify shipment tracking page
        io.to(`shipment-${packageRequest.tracking_number}`).emit(`shipment-update-${packageRequest.tracking_number}`, {
          shipmentId: packageRequest.tracking_number,
          status: shipmentUpdates.status || packageRequest.shipment_status,
          timestamp: new Date().toISOString(),
          updatedBy: 'admin',
          adminId: admin.id
        })
        
        console.log(`[Socket.IO] Package request updated: ${requestId}`)
      }
    } catch (socketError) {
      console.error('Error emitting Socket.IO event:', socketError)
    }

    return NextResponse.json({
      success: true,
      message: `Package request ${actionVerb[action] ?? action.toLowerCase()} successfully`,
      data: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        updatedAt: updatedRequest.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating package request:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    // Require authentication for accessing package request details
    const user = await requireAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 401 })
    }

    const { requestId } = await params

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
       WHERE pr.id = $1`,
      [requestId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Package request not found" }, { status: 404 })
    }

    // Get request history
    const historyResult = await query(
      `SELECT 
        prh.*,
        u.name as performed_by_name
       FROM package_request_history prh
       LEFT JOIN users u ON prh.performed_by = u.id
       WHERE prh.package_request_id = $1
       ORDER BY prh.created_at DESC`,
      [requestId]
    )

    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        history: historyResult.rows
      }
    })
  } catch (error) {
    console.error('Error fetching package request:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}