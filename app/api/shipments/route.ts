import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { transformShipmentRows, ShipmentRow } from "@/lib/shipment-utils"

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's shipments from database
    const result = await query(
      `SELECT id, tracking_number, user_id, origin_address_id, destination_address_id, 
              driver_id, status, transport_mode, current_location, current_city, 
              current_country, current_latitude, current_longitude, 
              estimated_delivery_date, actual_delivery_date, weight, dimensions, 
              description, package_value, special_handling, on_hold_reason, 
              is_international, customs_status, created_at, updated_at
       FROM shipments 
       WHERE user_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC`,
      [user.id]
    )

    const shipments = transformShipmentRows(result.rows as ShipmentRow[])

    return NextResponse.json({
      success: true,
      shipments,
    })
  } catch (error) {
    console.error('Error fetching user shipments:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      originAddress,
      destinationAddress,
      weight,
      dimensions,
      description,
      packageValue,
      transportMode,
      specialHandling,
      isInternational
    } = body

    // Validate required fields
    if (!originAddress || !destinationAddress || !weight || !description) {
      return NextResponse.json({ 
        error: "Missing required fields: originAddress, destinationAddress, weight, description" 
      }, { status: 400 })
    }

    // Generate tracking number
    const trackingNumber = `MSE${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // For now, we'll store address data as strings until we implement proper address management
    const originAddressString = `${originAddress.street || ''}, ${originAddress.apt || ''}, ${originAddress.city || ''}, ${originAddress.state || ''} ${originAddress.zipCode || ''}`.trim()
    const destinationAddressString = `${destinationAddress.street || ''}, ${destinationAddress.apt || ''}, ${destinationAddress.city || ''}, ${destinationAddress.state || ''} ${destinationAddress.zipCode || ''}`.trim()

    // Create temporary address records for origin and destination
    // This is a simplified approach - in a full implementation, you'd have proper address management
    const originAddressResult = await query(
      `INSERT INTO addresses (user_id, street, city, state, country, postal_code, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
       RETURNING id`,
      [
        user.id,
        `${originAddress.street || ''} ${originAddress.apt || ''}`.trim(),
        originAddress.city || '',
        originAddress.state || '',
        'US', // Default country
        originAddress.zipCode || ''
      ]
    )

    const destinationAddressResult = await query(
      `INSERT INTO addresses (user_id, street, city, state, country, postal_code, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
       RETURNING id`,
      [
        user.id,
        `${destinationAddress.street || ''} ${destinationAddress.apt || ''}`.trim(),
        destinationAddress.city || '',
        destinationAddress.state || '',
        'US', // Default country
        destinationAddress.zipCode || ''
      ]
    )

    const originAddressId = originAddressResult.rows[0].id
    const destinationAddressId = destinationAddressResult.rows[0].id

    // Insert new shipment with proper address IDs
    const result = await query(
      `INSERT INTO shipments (
        tracking_number, user_id, origin_address_id, destination_address_id,
        status, transport_mode, weight, dimensions, 
        description, package_value, special_handling, is_international, 
        estimated_delivery_date, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING id, tracking_number, status, created_at`,
      [
        trackingNumber,
        user.id,
        originAddressId,
        destinationAddressId,
        'PROCESSING',
        transportMode || 'LAND',
        weight,
        dimensions || null,
        description,
        packageValue || null,
        specialHandling || null,
        isInternational || false,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      ]
    )

    const newShipment = result.rows[0]

    return NextResponse.json({
      success: true,
      shipment: {
        id: newShipment.id,
        trackingNumber: newShipment.tracking_number,
        status: newShipment.status,
        createdAt: newShipment.created_at,
        originAddress: originAddressString,
        destinationAddress: destinationAddressString
      },
      message: "Shipment created successfully"
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}