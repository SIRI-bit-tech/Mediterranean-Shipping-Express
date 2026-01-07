import { type NextRequest, NextResponse } from "next/server"
import { query, pool } from "@/lib/db"
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

    // Proper address management - check for existing addresses or create new ones
    const client = await pool.connect()
    let originAddressId: string
    let destinationAddressId: string
    
    try {
      // Begin transaction
      await client.query('BEGIN')

      // Helper function to find or create address
      const findOrCreateAddress = async (addressData: any, userId: string) => {
        const street = `${addressData.street || ''} ${addressData.apt || ''}`.trim()
        const city = addressData.city || ''
        const state = addressData.state || ''
        const country = 'US' // Default country
        const postalCode = addressData.zipCode || ''

        // First, try to find existing address for this user
        const existingAddress = await client.query(
          `SELECT id FROM addresses 
           WHERE user_id = $1 AND street = $2 AND city = $3 AND state = $4 AND country = $5 AND postal_code = $6
           LIMIT 1`,
          [userId, street, city, state, country, postalCode]
        )

        if (existingAddress.rows.length > 0) {
          // Address already exists, return its ID
          return existingAddress.rows[0].id
        }

        // Address doesn't exist, create new one
        const newAddress = await client.query(
          `INSERT INTO addresses (user_id, street, city, state, country, postal_code, latitude, longitude, is_default, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
           RETURNING id`,
          [
            userId,
            street,
            city,
            state,
            country,
            postalCode,
            null, // latitude - to be populated later via geocoding
            null, // longitude - to be populated later via geocoding
            false // not default unless explicitly set
          ]
        )

        return newAddress.rows[0].id
      }

      // Find or create origin address
      originAddressId = await findOrCreateAddress(originAddress, user.id)

      // Find or create destination address
      destinationAddressId = await findOrCreateAddress(destinationAddress, user.id)

      // Insert new shipment with proper address IDs
      const result = await client.query(
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

      // Commit transaction
      await client.query('COMMIT')
      
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

    } catch (transactionError) {
      // Rollback transaction on any error
      await client.query('ROLLBACK')
      console.error('Transaction error during shipment creation:', transactionError)
      throw transactionError
    } finally {
      // Always release the client back to the pool
      client.release()
    }

  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}