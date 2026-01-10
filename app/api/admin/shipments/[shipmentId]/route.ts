import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"

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

    // Define validation constraints
    const allowedStatuses = ['PROCESSING', 'IN_TRANSIT', 'IN_CUSTOMS', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ON_HOLD', 'EXCEPTION']
    const allowedTransportModes = ['AIR', 'LAND', 'WATER', 'MULTIMODAL']

    // Validation helper functions
    const validateStatus = (status: any): boolean => {
      return typeof status === 'string' && allowedStatuses.includes(status)
    }

    const validateTransportMode = (mode: any): boolean => {
      return typeof mode === 'string' && allowedTransportModes.includes(mode)
    }

    const validateDate = (dateValue: any): boolean => {
      if (!dateValue) return false
      
      const inputDate = new Date(dateValue)
      if (isNaN(inputDate.getTime())) return false
      
      // Normalize both dates to date-only (YYYY-MM-DD) to avoid timezone issues
      const today = new Date()
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate())
      
      // Allow same-day deliveries (date >= today)
      return inputDateOnly >= todayDateOnly
    }

    const validateWeight = (weight: any): boolean => {
      const num = parseFloat(weight)
      return !isNaN(num) && num > 0 && num <= 10000 // 0-10000 kg range
    }

    const validatePackageValue = (value: any): boolean => {
      const num = parseFloat(value)
      return !isNaN(num) && num >= 0 && num <= 1000000 // 0-1M USD range
    }

    const validateLatitude = (lat: any): boolean => {
      const num = parseFloat(lat)
      return !isNaN(num) && num >= -90 && num <= 90
    }

    const validateLongitude = (lng: any): boolean => {
      const num = parseFloat(lng)
      return !isNaN(num) && num >= -180 && num <= 180
    }

    // Process each field in the request body with validation
    const validationErrors: string[] = []

    Object.keys(body).forEach(key => {
      const dbField = fieldMapping[key] || key
      const value = body[key]
      
      if (!allowedFields.includes(dbField) || value === undefined) {
        return // Skip non-allowed or undefined fields
      }

      // Validate based on field type
      let isValid = true
      let validatedValue = value

      switch (dbField) {
        case 'status':
          isValid = validateStatus(value)
          if (!isValid) validationErrors.push(`Invalid status: ${value}`)
          break

        case 'transport_mode':
          isValid = validateTransportMode(value)
          if (!isValid) validationErrors.push(`Invalid transport mode: ${value}`)
          break

        case 'estimated_delivery_date':
          isValid = validateDate(value)
          if (!isValid) validationErrors.push(`Invalid or past delivery date: ${value}`)
          validatedValue = new Date(value).toISOString()
          break

        case 'weight':
          isValid = validateWeight(value)
          if (!isValid) validationErrors.push(`Invalid weight: ${value} (must be 0-10000 kg)`)
          validatedValue = parseFloat(value)
          break

        case 'package_value':
          isValid = validatePackageValue(value)
          if (!isValid) validationErrors.push(`Invalid package value: ${value} (must be 0-1000000)`)
          validatedValue = parseFloat(value)
          break

        case 'current_latitude':
          isValid = validateLatitude(value)
          if (!isValid) validationErrors.push(`Invalid latitude: ${value} (must be -90 to 90)`)
          validatedValue = parseFloat(value)
          break

        case 'current_longitude':
          isValid = validateLongitude(value)
          if (!isValid) validationErrors.push(`Invalid longitude: ${value} (must be -180 to 180)`)
          validatedValue = parseFloat(value)
          break

        default:
          // For string fields, ensure they're not empty if provided
          if (typeof value === 'string' && value.trim() === '') {
            return // Skip empty strings
          }
          validatedValue = typeof value === 'string' ? value.trim() : value
          break
      }

      // Only add valid fields to update
      if (isValid) {
        updateFields.push(`${dbField} = $${paramIndex}`)
        values.push(validatedValue)
        paramIndex++
      }
    })

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationErrors 
      }, { status: 400 })
    }

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

    // Create tracking checkpoint for the update (similar to status route)
    try {
      await query(
        `INSERT INTO tracking_checkpoints (shipment_id, status, location, timestamp, notes, created_at)
         VALUES ($1, $2, $3, NOW(), $4, NOW())`,
        [
          updatedShipment.id,
          updatedShipment.status,
          updatedShipment.current_location || 'Admin Update',
          `Shipment updated by admin: ${admin.name || admin.email}`
        ]
      )
    } catch (trackingError) {
      logger.error('Error creating tracking checkpoint', trackingError)
      // Don't block the response, just log the error
    }

    // Create notification for customer (similar to status route)
    try {
      await query(
        `INSERT INTO notifications (user_id, shipment_id, title, message, type, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          updatedShipment.user_id,
          updatedShipment.id,
          'Shipment Updated',
          `Your package ${updatedShipment.tracking_number} has been updated. Check tracking for latest details.`,
          'STATUS_UPDATE'
        ]
      )
    } catch (notificationError) {
      logger.error('Error creating notification', notificationError)
      // Don't block the response, just log the error
    }

    // Emit Socket.IO event for real-time updates
    try {
      // Check if Socket.IO server instance is available
      const io = (global as any).io
      
      if (io) {
        // Create shipment update event for real-time tracking
        const shipmentUpdate = {
          shipmentId: updatedShipment.tracking_number,
          status: updatedShipment.status,
          transportMode: updatedShipment.transport_mode,
          location: updatedShipment.current_latitude && updatedShipment.current_longitude ? {
            latitude: updatedShipment.current_latitude,
            longitude: updatedShipment.current_longitude,
            address: updatedShipment.current_location || `${updatedShipment.current_city || ''}, ${updatedShipment.current_country || ''}`.trim()
          } : undefined,
          timestamp: new Date().toISOString(),
          updatedBy: 'admin',
          adminId: admin.id
        }

        // Emit to shipment-specific room
        io.to(`shipment-${updatedShipment.tracking_number}`).emit(`shipment-update-${updatedShipment.tracking_number}`, shipmentUpdate)
        
        // Also emit admin update for admin dashboard
        const adminUpdate = {
          type: 'shipment_update',
          shipmentId: updatedShipment.tracking_number,
          adminId: admin.id,
          adminName: admin.name || admin.email,
          data: {
            status: updatedShipment.status,
            location: shipmentUpdate.location
          },
          timestamp: new Date().toISOString()
        }
        
        io.emit('admin-activity-broadcast', adminUpdate)
        
        logger.debug('Emitted shipment update', { trackingNumber: updatedShipment.tracking_number })
      }
    } catch (socketError) {
      logger.error('Error emitting Socket.IO event', socketError)
      // Don't block the response, just log the error
    }

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
    logger.error('Error updating shipment', error)
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
    logger.error('Error deleting shipment', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}