import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function PUT(request: NextRequest) {
  try {
    // Verify driver authentication
    const user = await requireAuth(request)
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ error: "Unauthorized - Driver access required" }, { status: 401 })
    }

    const { latitude, longitude, shipmentId } = await request.json()

    if (!latitude || !longitude) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 })
    }

    // If shipmentId is provided, update specific shipment location
    if (shipmentId) {
      // Verify driver is assigned to this shipment
      const shipmentResult = await query(
        'SELECT id, tracking_number, status FROM shipments WHERE id = $1 AND driver_id = $2 AND deleted_at IS NULL',
        [shipmentId, user.id]
      )

      if (shipmentResult.rows.length === 0) {
        return NextResponse.json({ error: "Shipment not found or not assigned to you" }, { status: 404 })
      }

      const shipment = shipmentResult.rows[0]

      // Update shipment location
      await query(
        `UPDATE shipments 
         SET current_latitude = $1, current_longitude = $2, updated_at = NOW()
         WHERE id = $3`,
        [latitude, longitude, shipmentId]
      )

      // Create location tracking checkpoint if shipment is in transit or out for delivery
      if (['IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(shipment.status)) {
        await query(
          `INSERT INTO tracking_checkpoints (shipment_id, status, location, latitude, longitude, timestamp, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW())`,
          [
            shipmentId,
            'LOCATION_UPDATE',
            `Location: ${latitude}, ${longitude}`,
            latitude,
            longitude,
            `Driver location updated: ${user.name}`
          ]
        )
      }

      logger.debug('Location updated for shipment', { trackingNumber: shipment.tracking_number })
    }

    // Update all active deliveries for this driver
    await query(
      `UPDATE shipments 
       SET current_latitude = $1, current_longitude = $2, updated_at = NOW()
       WHERE driver_id = $3 AND status IN ('IN_TRANSIT', 'OUT_FOR_DELIVERY') AND deleted_at IS NULL`,
      [latitude, longitude, user.id]
    )

    return NextResponse.json({
      success: true,
      data: {
        driverId: user.id,
        latitude,
        longitude,
        timestamp: new Date(),
      },
      message: "Location updated successfully",
    })
  } catch (error) {
    logger.error('Location update error', error)
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify driver authentication
    const user = await requireAuth(request)
    if (!user || user.role !== 'DRIVER') {
      return NextResponse.json({ error: "Unauthorized - Driver access required" }, { status: 401 })
    }

    // Get current location from latest shipment
    const result = await query(
      `SELECT current_latitude, current_longitude, updated_at
       FROM shipments 
       WHERE driver_id = $1 AND current_latitude IS NOT NULL AND current_longitude IS NOT NULL
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: null, 
        message: "No location data available" 
      })
    }

    const location = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        latitude: location.current_latitude,
        longitude: location.current_longitude,
        lastUpdate: location.updated_at,
      },
    })
  } catch (error) {
    logger.error('Get location error', error)
    return NextResponse.json({ error: "Failed to get location" }, { status: 500 })
  }
}