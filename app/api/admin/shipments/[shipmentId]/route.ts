import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { shipmentId } = await params
    const body = await request.json()

    // Build dynamic update query based on provided fields
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Define allowed fields for update
    const allowedFields = [
      'status', 'transport_mode', 'current_location', 'current_city', 'current_country',
      'current_latitude', 'current_longitude', 'estimated_delivery_date', 'description',
      'weight', 'dimensions', 'package_value', 'special_handling', 'on_hold_reason',
      'customs_status'
    ]

    // Map frontend field names to database column names
    const fieldMapping: Record<string, string> = {
      'transportMode': 'transport_mode',
      'currentLocation': 'current_location',
      'currentCity': 'current_city',
      'currentCountry': 'current_country',
      'currentLatitude': 'current_latitude',
      'currentLongitude': 'current_longitude',
      'estimatedDeliveryDate': 'estimated_delivery_date',
      'packageValue': 'package_value',
      'specialHandling': 'special_handling',
      'onHoldReason': 'on_hold_reason',
      'customsStatus': 'customs_status'
    }

    // Process each field in the request body
    Object.keys(body).forEach(key => {
      const dbField = fieldMapping[key] || key
      if (allowedFields.includes(dbField) && body[key] !== undefined) {
        updateFields.push(`${dbField} = $${paramIndex}`)
        values.push(body[key])
        paramIndex++
      }
    })

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`)

    // Add shipment ID as the last parameter
    values.push(shipmentId)

    const updateQuery = `
      UPDATE shipments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `

    const result = await query(updateQuery, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 })
    }

    const updatedShipment = result.rows[0]

    return NextResponse.json({
      success: true,
      message: "Shipment updated successfully",
      shipment: {
        id: updatedShipment.id,
        trackingNumber: updatedShipment.tracking_number,
        userId: updatedShipment.user_id,
        originAddressId: updatedShipment.origin_address_id,
        destinationAddressId: updatedShipment.destination_address_id,
        driverId: updatedShipment.driver_id,
        status: updatedShipment.status,
        transportMode: updatedShipment.transport_mode,
        currentLocation: updatedShipment.current_location,
        currentCity: updatedShipment.current_city,
        currentCountry: updatedShipment.current_country,
        currentLatitude: updatedShipment.current_latitude,
        currentLongitude: updatedShipment.current_longitude,
        estimatedDeliveryDate: updatedShipment.estimated_delivery_date,
        actualDeliveryDate: updatedShipment.actual_delivery_date,
        weight: updatedShipment.weight,
        dimensions: updatedShipment.dimensions,
        description: updatedShipment.description,
        packageValue: updatedShipment.package_value,
        specialHandling: updatedShipment.special_handling,
        onHoldReason: updatedShipment.on_hold_reason,
        isInternational: updatedShipment.is_international,
        customsStatus: updatedShipment.customs_status,
        createdAt: updatedShipment.created_at,
        updatedAt: updatedShipment.updated_at
      }
    })
  } catch (error) {
    console.error('Error updating shipment:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    // Verify admin authentication
    const admin = await requireAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    const { shipmentId } = await params

    // Soft delete shipment (set deleted_at timestamp)
    const result = await query(
      `UPDATE shipments 
       SET deleted_at = NOW(), updated_at = NOW() 
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [shipmentId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Shipment deleted successfully",
    })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}