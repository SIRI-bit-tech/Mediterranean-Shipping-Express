import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, NotFoundError } from "@/lib/api-errors"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ trackingNumber: string }> }) {
  try {
    const { trackingNumber } = await params

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      throw new ValidationError("Tracking number is required")
    }

    // Get shipment from database
    const shipmentResult = await query(
      `SELECT s.id, s.tracking_number, s.status, s.transport_mode, s.current_location, 
              s.current_city, s.current_country, s.estimated_delivery_date, s.weight, 
              s.dimensions, s.description, s.is_international, s.updated_at,
              origin.street as origin_street, origin.city as origin_city, origin.country as origin_country,
              dest.street as dest_street, dest.city as dest_city, dest.country as dest_country
       FROM shipments s
       LEFT JOIN addresses origin ON s.origin_address_id = origin.id
       LEFT JOIN addresses dest ON s.destination_address_id = dest.id
       WHERE s.tracking_number = $1 AND s.deleted_at IS NULL`,
      [trackingNumber]
    )

    if (shipmentResult.rows.length === 0) {
      throw new NotFoundError("Shipment")
    }

    const shipment = shipmentResult.rows[0]

    // Format response
    const response = {
      trackingNumber: shipment.tracking_number,
      status: shipment.status,
      estimatedDelivery: shipment.estimated_delivery_date ? 
        new Date(shipment.estimated_delivery_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }) : null,
      carrier: `MSE ${shipment.transport_mode === 'AIR' ? 'Express Air' : 
                    shipment.transport_mode === 'WATER' ? 'Ocean' : 
                    shipment.transport_mode === 'MULTIMODAL' ? 'Multimodal' : 'Ground'}`,
      originCity: shipment.origin_city,
      destinationCity: shipment.dest_city,
      currentLocation: shipment.current_location || `${shipment.current_city}, ${shipment.current_country}`,
      weight: shipment.weight ? `${shipment.weight} kg` : null,
      dimensions: shipment.dimensions,
      service: `MSE ${shipment.is_international ? 'International' : 'Domestic'} ${
        shipment.transport_mode === 'AIR' ? 'Priority Air' : 'Standard'
      }`,
      lastUpdate: shipment.updated_at,
      origin: `${shipment.origin_street}, ${shipment.origin_city}, ${shipment.origin_country}`,
      destination: `${shipment.dest_street}, ${shipment.dest_city}, ${shipment.dest_country}`,
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Tracking error:', error)
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}
