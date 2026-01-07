/**
 * GraphHopper Integration
 * Provides geocoding, routing, distance matrix, and ETA calculations
 * Better rate limits and reliability compared to ORS
 */

import { fallbackMapService } from './fallback-map-service'

const GRAPHHOPPER_BASE_URL = process.env.GRAPHHOPPER_BASE_URL || 'https://graphhopper.com/api/1'
const GRAPHHOPPER_API_KEY = process.env.GRAPHHOPPER_API_KEY

interface Coordinates {
  latitude: number
  longitude: number
}

interface Address {
  street?: string
  city: string
  state?: string
  country: string
  postalCode?: string
}

interface GeocodingResult {
  coordinates: Coordinates
  formattedAddress: string
  confidence: number
}

interface RouteResult {
  coordinates: [number, number][] // [lng, lat] format for MapLibre
  distance: number // in meters
  duration: number // in seconds
  instructions: string[]
}

interface DistanceMatrixResult {
  distances: number[][] // in meters
  durations: number[][] // in seconds
}

class GraphHopperService {
  private apiKey: string
  private baseUrl: string
  private rateLimitDelay: number = 2000 // 2 seconds between requests (very conservative)
  private lastRequestTime: number = 0

  constructor() {
    // Ensure this service only runs on the server
    if (typeof window !== 'undefined') {
      throw new Error('GraphHopperService can only be used on the server side. Use /api/route or /api/geocode endpoints from client code.')
    }

    // Use fallback service if no API key is provided
    if (!GRAPHHOPPER_API_KEY || GRAPHHOPPER_API_KEY === 'your-graphhopper-api-key-here') {
      console.warn('GraphHopper API key not configured, using fallback service')
      this.apiKey = ''
      this.baseUrl = GRAPHHOPPER_BASE_URL
      return
    }
    
    this.apiKey = GRAPHHOPPER_API_KEY
    this.baseUrl = GRAPHHOPPER_BASE_URL
  }

  /**
   * Rate limiting helper
   */
  private async waitForRateLimit(): Promise<void> {
    if (!this.apiKey) return // Skip rate limiting for fallback mode
    
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: Address | string): Promise<GeocodingResult | null> {
    try {
      const query = typeof address === 'string' 
        ? address.trim()
        : this.formatAddressString(address)

      // Validate query is not empty and has meaningful content
      if (!query || query.length < 3) {
        console.error('GraphHopper Geocoding: Query too short or empty:', query)
        return null
      }

      // Use fallback service if no API key
      if (!this.apiKey) {
        const fallbackResult = fallbackMapService.geocodeAddress(query)
        if (fallbackResult) {
          return {
            coordinates: fallbackResult.coordinates,
            formattedAddress: fallbackResult.formattedAddress,
            confidence: fallbackResult.confidence
          }
        }
        return null
      }

      // Rate limiting
      await this.waitForRateLimit()

      const url = `${this.baseUrl}/geocode?q=${encodeURIComponent(query)}&limit=1&key=${this.apiKey}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`GraphHopper Geocoding failed: ${response.status} ${response.statusText}`)
        console.error('Error details:', errorText)
        
        // Use fallback on error
        const fallbackResult = fallbackMapService.geocodeAddress(query)
        if (fallbackResult) {
          return {
            coordinates: fallbackResult.coordinates,
            formattedAddress: fallbackResult.formattedAddress,
            confidence: fallbackResult.confidence * 0.7 // Lower confidence for fallback
          }
        }
        
        return null
      }

      const data = await response.json()

      if (data.hits && data.hits.length > 0) {
        const hit = data.hits[0]
        const point = hit.point

        return {
          coordinates: { latitude: point.lat, longitude: point.lng },
          formattedAddress: hit.name || query,
          confidence: hit.confidence || 0.8
        }
      }

      // Try fallback if no results
      const fallbackResult = fallbackMapService.geocodeAddress(query)
      if (fallbackResult) {
        return {
          coordinates: fallbackResult.coordinates,
          formattedAddress: fallbackResult.formattedAddress,
          confidence: fallbackResult.confidence * 0.6 // Lower confidence for fallback
        }
      }

      return null
    } catch (error) {
      console.error('GraphHopper Geocoding error:', error)
      
      // Try fallback on error
      const query = typeof address === 'string' ? address : this.formatAddressString(address)
      const fallbackResult = fallbackMapService.geocodeAddress(query)
      if (fallbackResult) {
        return {
          coordinates: fallbackResult.coordinates,
          formattedAddress: fallbackResult.formattedAddress,
          confidence: fallbackResult.confidence * 0.5 // Lower confidence for fallback
        }
      }
      
      return null
    }
  }

  /**
   * Get route between two points
   */
  async getRoute(
    start: Coordinates,
    end: Coordinates,
    profile: 'car' | 'bike' | 'foot' = 'car'
  ): Promise<RouteResult | null> {
    try {
      // Validate coordinates
      if (!start || !end || 
          typeof start.latitude !== 'number' || typeof start.longitude !== 'number' ||
          typeof end.latitude !== 'number' || typeof end.longitude !== 'number') {
        console.error('GraphHopper Routing: Invalid coordinates provided')
        return fallbackMapService.createStraightLineRoute(
          start || { latitude: 0, longitude: 0 },
          end || { latitude: 0, longitude: 0 }
        )
      }

      // Use fallback service if no API key
      if (!this.apiKey) {
        return fallbackMapService.createStraightLineRoute(start, end)
      }

      // Rate limiting
      await this.waitForRateLimit()

      const url = `${this.baseUrl}/route?point=${start.latitude},${start.longitude}&point=${end.latitude},${end.longitude}&vehicle=${profile}&instructions=true&key=${this.apiKey}`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`GraphHopper Routing failed: ${response.status} ${response.statusText}`)
        console.error('Error details:', errorText)
        
        // Use fallback on error
        return fallbackMapService.createStraightLineRoute(start, end)
      }

      const data = await response.json()

      if (data.paths && data.paths.length > 0) {
        const path = data.paths[0]
        
        // Convert coordinates to [lng, lat] format for MapLibre
        let coordinates: [number, number][] = []
        if (path.points && path.points.coordinates) {
          coordinates = path.points.coordinates.map((coord: number[]) => [coord[0], coord[1]])
        } else if (path.geometry && path.geometry.coordinates) {
          coordinates = path.geometry.coordinates
        } else {
          // Fallback to straight line if no coordinates
          coordinates = [[start.longitude, start.latitude], [end.longitude, end.latitude]]
        }
        
        // Extract instructions
        const instructions: string[] = []
        if (path.instructions && Array.isArray(path.instructions)) {
          path.instructions.forEach((instruction: any) => {
            if (instruction.text) {
              instructions.push(instruction.text)
            }
          })
        }

        return {
          coordinates,
          distance: Math.round(path.distance || 0),
          duration: Math.round((path.time || 0) / 1000), // Convert from ms to seconds
          instructions: instructions.length > 0 ? instructions : ['Navigate to destination']
        }
      }

      // Use fallback if no paths
      return fallbackMapService.createStraightLineRoute(start, end)
    } catch (error) {
      console.error('GraphHopper Routing error:', error)
      
      // Use fallback on error
      return fallbackMapService.createStraightLineRoute(
        start || { latitude: 0, longitude: 0 },
        end || { latitude: 0, longitude: 0 }
      )
    }
  }

  /**
   * Calculate distance matrix between multiple points
   */
  async getDistanceMatrix(
    locations: Coordinates[],
    profile: 'car' | 'bike' | 'foot' = 'car'
  ): Promise<DistanceMatrixResult | null> {
    try {
      // Use fallback service if no API key
      if (!this.apiKey) {
        return this.calculateFallbackMatrix(locations)
      }

      // Rate limiting
      await this.waitForRateLimit()

      // Build points parameter
      const points = locations.map(loc => `point=${loc.latitude},${loc.longitude}`).join('&')
      const url = `${this.baseUrl}/matrix?${points}&vehicle=${profile}&key=${this.apiKey}`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`GraphHopper Distance Matrix failed: ${response.status} ${response.statusText}`)
        console.error('Error details:', errorText)
        
        // Use fallback on error
        return this.calculateFallbackMatrix(locations)
      }

      const data = await response.json()

      if (data.distances && data.times) {
        return {
          distances: data.distances,
          durations: data.times.map((row: number[]) => row.map((time: number) => Math.round(time / 1000))) // Convert from ms to seconds
        }
      }

      // Use fallback if no data
      return this.calculateFallbackMatrix(locations)
    } catch (error) {
      console.error('GraphHopper Distance Matrix error:', error)
      
      // Use fallback on error
      return this.calculateFallbackMatrix(locations)
    }
  }

  /**
   * Calculate ETA between two points
   */
  async calculateETA(
    start: Coordinates,
    end: Coordinates,
    profile: 'car' | 'bike' | 'foot' = 'car'
  ): Promise<{ duration: number; distance: number; eta: Date } | null> {
    try {
      const route = await this.getRoute(start, end, profile)
      
      if (!route) {
        return null
      }

      const eta = new Date(Date.now() + route.duration * 1000)

      return {
        duration: route.duration,
        distance: route.distance,
        eta
      }
    } catch (error) {
      console.error('GraphHopper ETA calculation error:', error)
      return null
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string | null> {
    try {
      // Use fallback service if no API key
      if (!this.apiKey) {
        return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
      }

      // Rate limiting
      await this.waitForRateLimit()

      const url = `${this.baseUrl}/geocode?reverse=true&point=${coordinates.latitude},${coordinates.longitude}&key=${this.apiKey}`
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`GraphHopper Reverse Geocoding failed: ${response.status} ${response.statusText}`)
        console.error('Error details:', errorText)
        return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
      }

      const data = await response.json()

      if (data.hits && data.hits.length > 0) {
        return data.hits[0].name || `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
      }

      return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
    } catch (error) {
      console.error('GraphHopper Reverse Geocoding error:', error)
      return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
    }
  }

  /**
   * Format address object to string
   */
  private formatAddressString(address: Address): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.country,
      address.postalCode
    ].filter(Boolean)

    return parts.join(', ')
  }

  /**
   * Calculate fallback distance matrix using straight-line distances
   */
  private calculateFallbackMatrix(locations: Coordinates[]): DistanceMatrixResult {
    const distances: number[][] = []
    const durations: number[][] = []

    for (let i = 0; i < locations.length; i++) {
      distances[i] = []
      durations[i] = []
      
      for (let j = 0; j < locations.length; j++) {
        if (i === j) {
          distances[i][j] = 0
          durations[i][j] = 0
        } else {
          const distance = fallbackMapService.calculateDistance(locations[i], locations[j])
          const duration = (distance / 1000) * 60 // Assume 60 km/h average speed
          
          distances[i][j] = Math.round(distance)
          durations[i][j] = Math.round(duration)
        }
      }
    }

    return { distances, durations }
  }

  /**
   * Check if GraphHopper service is available
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return true // Fallback service is always available
    }

    try {
      // Simple geocoding test
      const result = await this.geocodeAddress('London')
      return result !== null
    } catch (error) {
      console.error('GraphHopper Health Check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const graphHopperService = new GraphHopperService()

// Export types
export type {
  Coordinates,
  Address,
  GeocodingResult,
  RouteResult,
  DistanceMatrixResult
}