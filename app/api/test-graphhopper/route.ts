import { type NextRequest, NextResponse } from "next/server"
import { graphHopperService } from "@/lib/graphhopper-service"

export async function GET(request: NextRequest) {
  try {
    console.log('Testing GraphHopper integration...')
    
    // Test geocoding with a simple address
    const geocodeResult = await graphHopperService.geocodeAddress("London, UK")
    console.log('Geocoding result:', geocodeResult)
    
    // Only test routing if geocoding works and we have a valid result
    let routeResult = null
    if (geocodeResult) {
      // Use known coordinates to avoid additional geocoding calls
      routeResult = await graphHopperService.getRoute(
        { latitude: 51.5074, longitude: -0.1278 }, // London
        { latitude: 48.8566, longitude: 2.3522 }, // Paris
        'car'
      )
      console.log('Routing result:', routeResult ? 'Success' : 'Failed')
    }
    
    return NextResponse.json({
      success: true,
      data: {
        geocoding: geocodeResult ? {
          coordinates: geocodeResult.coordinates,
          formattedAddress: geocodeResult.formattedAddress,
          confidence: geocodeResult.confidence
        } : null,
        routing: routeResult ? {
          distance: routeResult.distance,
          duration: routeResult.duration,
          coordinatesCount: routeResult.coordinates.length
        } : null
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('GraphHopper Test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}