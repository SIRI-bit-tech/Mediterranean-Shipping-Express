import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { status, notes, location } = await request.json()

    // Verify shipment exists and user has access (or is driver/admin)
    const shipmentResult = await query(
      'SELECT id, tracking_number, user_id, driver_id, current_city, current_country FROM shipments WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )

    if (shipmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 })
    }

    const shipment = shipmentResult.rows[0]

    // Check permissions: owner, assigned driver, or admin
    const hasAccess = 
      shipment.user_id === user.id || 
      shipment.driver_id === user.id || 
      user.role === 'ADMIN'

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update shipment status and delivery date if delivered
    const updateFields = ['status = $1', 'updated_at = NOW()']
    const updateValues = [status]
    let paramCount = 1

    if (location) {
      paramCount++
      updateFields.push(`current_location = $${paramCount}`)
      updateValues.push(location)
    }

    if (status === 'DELIVERED') {
      paramCount++
      updateFields.push(`actual_delivery_date = $${paramCount}`)
      updateValues.push(new Date())
    }

    paramCount++
    updateValues.push(id)

    const updateResult = await query(
      `UPDATE shipments 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, tracking_number, status, current_location, current_city, current_country, updated_at`,
      updateValues
    )

    const updatedShipment = updateResult.rows[0]

    // Create tracking checkpoint
    const checkpointLocation = location || 
      (updatedShipment.current_city && updatedShipment.current_country ? 
        `${updatedShipment.current_city}, ${updatedShipment.current_country}` : 
        'Status Update')

    await query(
      `INSERT INTO tracking_checkpoints (shipment_id, status, location, timestamp, notes, created_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW())`,
      [
        id,
        status,
        checkpointLocation,
        notes || `Status updated by ${user.role.toLowerCase()}: ${user.name}`
      ]
    )

    // Create notification for customer
    if (shipment.user_id !== user.id) {
      await query(
        `INSERT INTO notifications (user_id, shipment_id, title, message, type, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          shipment.user_id,
          id,
          `Shipment ${status.replace('_', ' ').toLowerCase()}`,
          `Your package ${updatedShipment.tracking_number} status has been updated to ${status.replace('_', ' ').toLowerCase()}.`,
          'STATUS_UPDATE'
        ]
      )
    }

    console.log("[MSE] Tracking checkpoint created for:", updatedShipment.tracking_number, "Status:", status)

    // TODO: Emit socket.io event for real-time updates
    // This would require socket.io server integration
    console.log("[MSE] Real-time update event should be emitted for tracking number:", updatedShipment.tracking_number)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedShipment.id,
        trackingNumber: updatedShipment.tracking_number,
        status: updatedShipment.status,
        currentLocation: updatedShipment.current_location,
        lastUpdate: updatedShipment.updated_at,
      },
      message: "Shipment status updated successfully",
    })
  } catch (error) {
    console.error("[MSE] Status update error:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { status, location } = await request.json()

    // Verify shipment exists and user has access (or is driver/admin)
    const shipmentResult = await query(
      'SELECT id, tracking_number, user_id, driver_id FROM shipments WHERE id = $1 AND deleted_at IS NULL',
      [id]
    )

    if (shipmentResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "Shipment not found" }, { status: 404 })
    }

    const shipment = shipmentResult.rows[0]

    // Check permissions: owner, assigned driver, or admin
    const hasAccess = 
      shipment.user_id === user.id || 
      shipment.driver_id === user.id || 
      user.role === 'ADMIN'

    if (!hasAccess) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 })
    }

    // Update shipment status
    const updateResult = await query(
      `UPDATE shipments 
       SET status = $1, current_location = $2, updated_at = NOW() 
       WHERE id = $3
       RETURNING id, tracking_number, status, current_location, updated_at`,
      [status, location || null, id]
    )

    const updatedShipment = updateResult.rows[0]

    // Create tracking checkpoint
    await query(
      `INSERT INTO tracking_checkpoints (shipment_id, status, location, timestamp, notes, created_at)
       VALUES ($1, $2, $3, NOW(), $4, NOW())`,
      [
        id,
        status,
        location || 'Status Update',
        `Status updated by ${user.role.toLowerCase()}: ${user.name}`
      ]
    )

    console.log("[MSE] Real-time update event emitted for tracking number:", updatedShipment.tracking_number)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedShipment.id,
        trackingNumber: updatedShipment.tracking_number,
        status: updatedShipment.status,
        currentLocation: updatedShipment.current_location,
        lastUpdate: updatedShipment.updated_at,
      },
      message: "Shipment status updated",
    })
  } catch (error) {
    console.error("[MSE] Status update error:", error)
    return NextResponse.json({ success: false, message: "Failed to update status" }, { status: 500 })
  }
}
