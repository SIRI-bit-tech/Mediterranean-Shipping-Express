import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError, NotFoundError } from "@/lib/api-errors"
import { query } from "@/lib/db"
import { graphHopperService } from "@/lib/graphhopper-service"

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
              origin.street as origin_street, origin.city as origin_city, origin.state as origin_state, origin.country as origin_country,
              dest.street as dest_street, dest.city as dest_city, dest.state as dest_state, dest.country as dest_country
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

    // Use GraphHopper for real-time geocoding
    const getLocationCoordinates = async (city: string, state: string | null, country: string, street?: string) => {
      try {
        // Provide Swiss fallback for missing location data
        if (!city || !country) {
          console.warn(`Missing required location data: city=${city}, country=${country} - using Swiss fallback`)
          // Use Zurich, Switzerland as fallback
          return { lat: 47.3769, lng: 8.5417 }
        }

        const addressString = [street, city, state, country].filter(Boolean).join(', ')
        
        // Ensure we have a meaningful address string
        if (addressString.trim().length < 3) {
          console.warn(`Address string too short: "${addressString}"`)
          return { lat: 0, lng: 0 }
        }

        const result = await graphHopperService.geocodeAddress(addressString)
        
        if (result) {
          return {
            lat: result.coordinates.latitude,
            lng: result.coordinates.longitude
          }
        }

        // Fallback: try without street
        if (street) {
          const fallbackAddress = [city, state, country].filter(Boolean).join(', ')
          if (fallbackAddress.trim().length >= 3) {
            const fallbackResult = await graphHopperService.geocodeAddress(fallbackAddress)
            
            if (fallbackResult) {
              return {
                lat: fallbackResult.coordinates.latitude,
                lng: fallbackResult.coordinates.longitude
              }
            }
          }
        }

        // Final fallback: country center coordinates with Swiss locations
        const countryDefaults: { [key: string]: { lat: number; lng: number } } = {
          'US': { lat: 39.8283, lng: -98.5795 },
          'United States': { lat: 39.8283, lng: -98.5795 },
          'Canada': { lat: 56.1304, lng: -106.3468 },
          'Mexico': { lat: 23.6345, lng: -102.5528 },
          'UK': { lat: 55.3781, lng: -3.4360 },
          'United Kingdom': { lat: 55.3781, lng: -3.4360 },
          'Germany': { lat: 51.1657, lng: 10.4515 },
          'France': { lat: 46.2276, lng: 2.2137 },
          'Italy': { lat: 41.8719, lng: 12.5674 },
          'Spain': { lat: 40.4637, lng: -3.7492 },
          'Greece': { lat: 39.0742, lng: 21.8243 },
          'Turkey': { lat: 38.9637, lng: 35.2433 },
          'Egypt': { lat: 26.8206, lng: 30.8025 },
          'China': { lat: 35.8617, lng: 104.1954 },
          'Japan': { lat: 36.2048, lng: 138.2529 },
          'Australia': { lat: -25.2744, lng: 133.7751 },
          'Brazil': { lat: -14.2350, lng: -51.9253 },
          'India': { lat: 20.5937, lng: 78.9629 },
          'Russia': { lat: 61.5240, lng: 105.3188 },
          'Switzerland': { lat: 47.3769, lng: 8.5417 }, // Zurich
          'CH': { lat: 47.3769, lng: 8.5417 }, // Zurich
        }
        
        return countryDefaults[country] || { lat: 47.3769, lng: 8.5417 } // Default to Zurich, Switzerland
      } catch (error) {
        console.error(`Geocoding error for ${city}, ${country}:`, error)
        return { lat: 0, lng: 0 }
      }
    }

    // Get coordinates for all locations using GraphHopper
    const [originCoords, destCoords, currentCoords] = await Promise.all([
      getLocationCoordinates(
        shipment.origin_city,
        shipment.origin_state,
        shipment.origin_country,
        shipment.origin_street
      ),
      getLocationCoordinates(
        shipment.dest_city,
        shipment.dest_state,
        shipment.dest_country,
        shipment.dest_street
      ),
      getLocationCoordinates(
        shipment.current_city,
        null, // Current location usually doesn't have state info
        shipment.current_country
      )
    ])

    // Calculate route and ETA using GraphHopper
    let routeInfo = null
    try {
      const eta = await graphHopperService.calculateETA(
        { latitude: originCoords.lat, longitude: originCoords.lng },
        { latitude: destCoords.lat, longitude: destCoords.lng },
        shipment.transport_mode === 'LAND' ? 'car' : 'car'
      )
      
      if (eta) {
        routeInfo = {
          distance: eta.distance,
          duration: eta.duration,
          eta: eta.eta.toISOString()
        }
      }
    } catch (error) {
      console.error('Route calculation error:', error)
    }

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
      transportMode: shipment.transport_mode,
      lastUpdate: shipment.updated_at,
      origin: `${shipment.origin_street}, ${shipment.origin_city}, ${shipment.origin_country}`,
      destination: `${shipment.dest_street}, ${shipment.dest_city}, ${shipment.dest_country}`,
      // Add coordinate data for map with GraphHopper geocoding
      coordinates: {
        origin: {
          latitude: originCoords.lat,
          longitude: originCoords.lng,
          address: `${shipment.origin_street}, ${shipment.origin_city}, ${shipment.origin_country}`
        },
        destination: {
          latitude: destCoords.lat,
          longitude: destCoords.lng,
          address: `${shipment.dest_street}, ${shipment.dest_city}, ${shipment.dest_country}`
        },
        current: {
          latitude: currentCoords.lat,
          longitude: currentCoords.lng,
          city: shipment.current_city,
          country: shipment.current_country
        }
      },
      // Add route information
      route: routeInfo
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
