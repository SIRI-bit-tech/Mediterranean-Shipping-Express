import { type NextRequest, NextResponse } from "next/server"
import { handleAPIError, ValidationError } from "@/lib/api-errors"
import { graphHopperService } from "@/lib/graphhopper-service"
import { requireAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Require authentication before processing geocoding request
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ 
        error: "Unauthorized - Authentication required" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { address } = body

    if (!address || typeof address !== 'string') {
      throw new ValidationError("Address is required")
    }

    // Use GraphHopper to geocode the address
    const result = await graphHopperService.geocodeAddress(address)

    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Could not geocode address",
        data: null
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        coordinates: result.coordinates,
        formattedAddress: result.formattedAddress,
        confidence: result.confidence
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Geocoding API error:', error)
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}

// Batch geocoding endpoint
export async function PUT(request: NextRequest) {
  try {
    // Require authentication before processing batch geocoding request
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ 
        error: "Unauthorized - Authentication required" 
      }, { status: 401 })
    }

    const body = await request.json()
    const { addresses } = body

    if (!addresses || !Array.isArray(addresses)) {
      throw new ValidationError("Addresses array is required")
    }

    if (addresses.length > 5) {
      throw new ValidationError("Maximum 5 addresses allowed per batch request to avoid rate limits")
    }

    // Geocode addresses sequentially to avoid rate limits
    const results = []
    for (const address of addresses) {
      const result = await graphHopperService.geocodeAddress(address)
      results.push({
        address,
        result: result ? {
          coordinates: result.coordinates,
          formattedAddress: result.formattedAddress,
          confidence: result.confidence
        } : null
      })
    }

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Batch geocoding API error:', error)
    const { statusCode, response } = handleAPIError(error)
    return NextResponse.json(response, { status: statusCode })
  }
}