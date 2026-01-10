import { type NextRequest, NextResponse } from "next/server"
import { query, pool } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { transformShipmentRows, ShipmentRow } from "@/lib/shipment-utils"
import { generateTrackingNumber } from "@/lib/api-utils"
import { logger } from "@/lib/logger"

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
    logger.error('Error fetching user shipments', error)
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
    const trackingNumber = generateTrackingNumber()

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

      // Helper function to find or create address using atomic upsert
      const findOrCreateAddress = async (addressData: any, userId: string, label: string = 'shipping') => {
        const street = `${addressData.street || ''} ${addressData.apt || ''}`.trim()
        const city = addressData.city || ''
        const state = addressData.state || ''
        const country = addressData.country || 'US' // Default country
        const postalCode = addressData.zipCode || ''

        try {
          // Atomic upsert using INSERT ... ON CONFLICT
          // Updated to include label in the unique constraint
          const result = await client.query(
            `INSERT INTO addresses (user_id, street, city, state, country, postal_code, label, latitude, longitude, is_default, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
             ON CONFLICT (user_id, street, city, state, country, postal_code, label) 
             DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [
              userId,
              street,
              city,
              state || '', // Use empty string instead of NULL
              country,
              postalCode || '', // Use empty string instead of NULL
              label,
              null, // latitude - to be populated later via geocoding
              null, // longitude - to be populated later via geocoding
              false // not default unless explicitly set
            ]
          )

          return result.rows[0].id
        } catch (dbError: any) {
          // Handle unique constraint violation with user-friendly message
          if (dbError.code === '23505' && dbError.constraint === 'addresses_user_composite_unique') {
            throw new Error(`You already have a ${label} address with these details. Please use a different label or modify the address.`)
          }
          throw dbError
        }
      }

      // Find or create origin address
      originAddressId = await findOrCreateAddress(originAddress, user.id, originAddress.label || 'shipping')

      // Find or create destination address  
      destinationAddressId = await findOrCreateAddress(destinationAddress, user.id, destinationAddress.label || 'shipping')

      // Insert new shipment with proper address IDs and initialize current location at origin
      const result = await client.query(
        `INSERT INTO shipments (
          tracking_number, user_id, origin_address_id, destination_address_id,
          status, transport_mode, weight, dimensions, 
          description, package_value, special_handling, is_international,
          current_location, current_city, current_country,
          estimated_delivery_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
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
          // Initialize current location at origin
          `${originAddress.street || ''}, ${originAddress.city || ''}, ${originAddress.state || ''} ${originAddress.zipCode || ''}`.trim(),
          originAddress.city || '',
          originAddress.country || 'US',
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

    } catch (transactionError: any) {
      // Rollback transaction on any error
      await client.query('ROLLBACK')
      logger.error('Transaction error during shipment creation', transactionError)
      
      // Handle user-friendly error messages
      if (transactionError.message && transactionError.message.includes('already have a')) {
        return NextResponse.json({ 
          error: transactionError.message,
          type: 'address_conflict'
        }, { status: 409 })
      }
      
      throw transactionError
    } finally {
      // Always release the client back to the pool
      client.release()
    }

  } catch (error) {
    logger.error('Error creating shipment', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}