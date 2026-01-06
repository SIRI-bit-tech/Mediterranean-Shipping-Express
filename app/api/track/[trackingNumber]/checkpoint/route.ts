import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ trackingNumber: string }> }) {
  try {
    // Verify authentication (admin or driver)
    const user = await requireAuth(request)
    if (!user || !['ADMIN', 'DRIVER'].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized - Admin or Driver access required" }, { status: 401 })
    }

    const { trackingNumber } = await params
    const { status, location, city, country, latitude, longitude, notes } = await request.json()

    if (!status || !location) {
      return NextResponse.json({ error: "Status and location are required" }, { status: 400 })
    }

    // Get shipment ID from tracking number
    const shipmentResult = await query(
      'SELECT id, driver_id FROM shipments WHERE tracking_number = $1 AND deleted_at IS NULL',
      [trackingNumber]
    )

    if (shipmentResult.rows.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 })
    }

    const shipment = shipmentResult.rows[0]

    // If user is a driver, verify they're assigned to this shipment
    if (user.role === 'DRIVER' && shipment.driver_id !== user.id) {
      return NextResponse.json({ error: "Access denied - Not assigned to this shipment" }, { status: 403 })
    }

    // Create tracking checkpoint
    const result = await query(
      `INSERT INTO tracking_checkpoints (shipment_id, status, location, city, country, latitude, longitude, timestamp, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW())
       RETURNING id, status, location, city, country, timestamp, notes`,
      [
        shipment.id,
        status,
        location,
        city || null,
        country || null,
        latitude || null,
        longitude || null,
        notes || `Checkpoint added by ${user.role.toLowerCase()}: ${user.name}`
      ]
    )

    const checkpoint = result.rows[0]

    // Update shipment status if it's a status change
    const statusUpdates = ['PROCESSING', 'IN_TRANSIT', 'IN_CUSTOMS', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ON_HOLD', 'EXCEPTION']
    if (statusUpdates.includes(status)) {
      await query(
        `UPDATE shipments 
         SET status = $1, current_location = $2, current_city = $3, current_country = $4, 
             current_latitude = $5, current_longitude = $6, updated_at = NOW()
         WHERE id = $7`,
        [status, location, city, country, latitude, longitude, shipment.id]
      )
    }

    console.log("[MSE] Tracking checkpoint created for:", trackingNumber, "Status:", status)

    return NextResponse.json({
      success: true,
      data: {
        id: checkpoint.id,
        trackingNumber,
        status: checkpoint.status,
        location: checkpoint.location,
        city: checkpoint.city,
        country: checkpoint.country,
        timestamp: checkpoint.timestamp,
        notes: checkpoint.notes,
      },
      message: "Tracking checkpoint created successfully",
    })
  } catch (error) {
    console.error("[MSE] Checkpoint creation error:", error)
    return NextResponse.json({ error: "Failed to create checkpoint" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ trackingNumber: string }> }) {
  try {
    const { trackingNumber } = await params

    // Get all tracking checkpoints for this shipment
    const result = await query(
      `SELECT tc.id, tc.status, tc.location, tc.city, tc.country, tc.latitude, tc.longitude, 
              tc.timestamp, tc.notes, tc.created_at
       FROM tracking_checkpoints tc
       JOIN shipments s ON tc.shipment_id = s.id
       WHERE s.tracking_number = $1 AND s.deleted_at IS NULL
       ORDER BY tc.timestamp DESC`,
      [trackingNumber]
    )

    const checkpoints = result.rows.map(checkpoint => ({
      id: checkpoint.id,
      status: checkpoint.status,
      location: checkpoint.location,
      city: checkpoint.city,
      country: checkpoint.country,
      coordinates: checkpoint.latitude && checkpoint.longitude ? {
        latitude: checkpoint.latitude,
        longitude: checkpoint.longitude
      } : null,
      timestamp: checkpoint.timestamp,
      notes: checkpoint.notes,
      createdAt: checkpoint.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: {
        trackingNumber,
        checkpoints,
        totalCheckpoints: checkpoints.length,
      },
    })
  } catch (error) {
    console.error("[MSE] Get checkpoints error:", error)
    return NextResponse.json({ error: "Failed to retrieve checkpoints" }, { status: 500 })
  }
}