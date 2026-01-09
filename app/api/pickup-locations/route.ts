import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const type = searchParams.get('type')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '50' // Default 50km radius

    let whereClause = 'WHERE is_active = true'
    const params: any[] = []
    let paramIndex = 1

    // Filter by city
    if (city) {
      whereClause += ` AND LOWER(city) LIKE LOWER($${paramIndex})`
      params.push(`%${city}%`)
      paramIndex++
    }

    // Filter by type
    if (type) {
      whereClause += ` AND type = $${paramIndex}`
      params.push(type)
      paramIndex++
    }

    // Filter by distance if coordinates provided
    let distanceSelect = ''
    if (lat && lng) {
      distanceSelect = `, 
        (6371 * acos(cos(radians($${paramIndex})) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * sin(radians(latitude)))) AS distance`
      
      whereClause += ` AND (6371 * acos(cos(radians($${paramIndex})) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians($${paramIndex + 1})) + 
        sin(radians($${paramIndex})) * sin(radians(latitude)))) <= $${paramIndex + 2}`
      
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(radius))
      paramIndex += 3
    }

    const result = await query(
      `SELECT 
        id, name, type, street, city, state, country, postal_code,
        latitude, longitude, phone, email, operating_hours, capacity
        ${distanceSelect}
       FROM pickup_locations
       ${whereClause}
       ${lat && lng ? 'ORDER BY distance ASC' : 'ORDER BY city, name'}
       LIMIT 50`,
      params
    )

    return NextResponse.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching pickup locations:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}