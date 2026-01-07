/**
 * Fallback Map Service
 * Provides basic geocoding and routing when external APIs are unavailable
 */

interface Coordinates {
  latitude: number
  longitude: number
}

interface FallbackLocation {
  coordinates: Coordinates
  formattedAddress: string
  confidence: number
}

/**
 * Common world locations for fallback geocoding
 */
const WORLD_LOCATIONS: Record<string, FallbackLocation> = {
  // Major Cities
  'new york': {
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    formattedAddress: 'New York, NY, USA',
    confidence: 0.9
  },
  'london': {
    coordinates: { latitude: 51.5074, longitude: -0.1278 },
    formattedAddress: 'London, UK',
    confidence: 0.9
  },
  'paris': {
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    formattedAddress: 'Paris, France',
    confidence: 0.9
  },
  'tokyo': {
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
    formattedAddress: 'Tokyo, Japan',
    confidence: 0.9
  },
  'dubai': {
    coordinates: { latitude: 25.2048, longitude: 55.2708 },
    formattedAddress: 'Dubai, UAE',
    confidence: 0.9
  },
  'singapore': {
    coordinates: { latitude: 1.3521, longitude: 103.8198 },
    formattedAddress: 'Singapore',
    confidence: 0.9
  },
  'hong kong': {
    coordinates: { latitude: 22.3193, longitude: 114.1694 },
    formattedAddress: 'Hong Kong',
    confidence: 0.9
  },
  'sydney': {
    coordinates: { latitude: -33.8688, longitude: 151.2093 },
    formattedAddress: 'Sydney, Australia',
    confidence: 0.9
  },
  'mumbai': {
    coordinates: { latitude: 19.0760, longitude: 72.8777 },
    formattedAddress: 'Mumbai, India',
    confidence: 0.9
  },
  'cairo': {
    coordinates: { latitude: 30.0444, longitude: 31.2357 },
    formattedAddress: 'Cairo, Egypt',
    confidence: 0.9
  },
  'istanbul': {
    coordinates: { latitude: 41.0082, longitude: 28.9784 },
    formattedAddress: 'Istanbul, Turkey',
    confidence: 0.9
  },
  'athens': {
    coordinates: { latitude: 37.9838, longitude: 23.7275 },
    formattedAddress: 'Athens, Greece',
    confidence: 0.9
  },
  'rome': {
    coordinates: { latitude: 41.9028, longitude: 12.4964 },
    formattedAddress: 'Rome, Italy',
    confidence: 0.9
  },
  'barcelona': {
    coordinates: { latitude: 41.3851, longitude: 2.1734 },
    formattedAddress: 'Barcelona, Spain',
    confidence: 0.9
  },
  'amsterdam': {
    coordinates: { latitude: 52.3676, longitude: 4.9041 },
    formattedAddress: 'Amsterdam, Netherlands',
    confidence: 0.9
  },
  'berlin': {
    coordinates: { latitude: 52.5200, longitude: 13.4050 },
    formattedAddress: 'Berlin, Germany',
    confidence: 0.9
  },
  'moscow': {
    coordinates: { latitude: 55.7558, longitude: 37.6176 },
    formattedAddress: 'Moscow, Russia',
    confidence: 0.9
  },
  'beijing': {
    coordinates: { latitude: 39.9042, longitude: 116.4074 },
    formattedAddress: 'Beijing, China',
    confidence: 0.9
  },
  'shanghai': {
    coordinates: { latitude: 31.2304, longitude: 121.4737 },
    formattedAddress: 'Shanghai, China',
    confidence: 0.9
  },
  'los angeles': {
    coordinates: { latitude: 34.0522, longitude: -118.2437 },
    formattedAddress: 'Los Angeles, CA, USA',
    confidence: 0.9
  },
  // Mediterranean region (MSE focus)
  'malta': {
    coordinates: { latitude: 35.8997, longitude: 14.5146 },
    formattedAddress: 'Malta',
    confidence: 0.9
  },
  'valletta': {
    coordinates: { latitude: 35.8989, longitude: 14.5146 },
    formattedAddress: 'Valletta, Malta',
    confidence: 0.9
  },
  'palermo': {
    coordinates: { latitude: 38.1157, longitude: 13.3615 },
    formattedAddress: 'Palermo, Italy',
    confidence: 0.9
  },
  'naples': {
    coordinates: { latitude: 40.8518, longitude: 14.2681 },
    formattedAddress: 'Naples, Italy',
    confidence: 0.9
  },
  'marseille': {
    coordinates: { latitude: 43.2965, longitude: 5.3698 },
    formattedAddress: 'Marseille, France',
    confidence: 0.9
  },
  'valencia': {
    coordinates: { latitude: 39.4699, longitude: -0.3763 },
    formattedAddress: 'Valencia, Spain',
    confidence: 0.9
  },
  'tunis': {
    coordinates: { latitude: 36.8065, longitude: 10.1815 },
    formattedAddress: 'Tunis, Tunisia',
    confidence: 0.9
  },
  'algiers': {
    coordinates: { latitude: 36.7538, longitude: 3.0588 },
    formattedAddress: 'Algiers, Algeria',
    confidence: 0.9
  },
  'casablanca': {
    coordinates: { latitude: 33.5731, longitude: -7.5898 },
    formattedAddress: 'Casablanca, Morocco',
    confidence: 0.9
  },
  'alexandria': {
    coordinates: { latitude: 31.2001, longitude: 29.9187 },
    formattedAddress: 'Alexandria, Egypt',
    confidence: 0.9
  },
  'beirut': {
    coordinates: { latitude: 33.8938, longitude: 35.5018 },
    formattedAddress: 'Beirut, Lebanon',
    confidence: 0.9
  },
  'tel aviv': {
    coordinates: { latitude: 32.0853, longitude: 34.7818 },
    formattedAddress: 'Tel Aviv, Israel',
    confidence: 0.9
  },
  'cyprus': {
    coordinates: { latitude: 35.1264, longitude: 33.4299 },
    formattedAddress: 'Cyprus',
    confidence: 0.9
  },
  'nicosia': {
    coordinates: { latitude: 35.1856, longitude: 33.3823 },
    formattedAddress: 'Nicosia, Cyprus',
    confidence: 0.9
  }
}

class FallbackMapService {
  /**
   * Fallback geocoding using predefined locations
   */
  geocodeAddress(address: string): FallbackLocation | null {
    const normalizedAddress = address.toLowerCase().trim()
    
    // Direct match
    if (WORLD_LOCATIONS[normalizedAddress]) {
      return WORLD_LOCATIONS[normalizedAddress]
    }
    
    // Partial match
    for (const [key, location] of Object.entries(WORLD_LOCATIONS)) {
      if (normalizedAddress.includes(key) || key.includes(normalizedAddress)) {
        return {
          ...location,
          confidence: location.confidence * 0.8 // Lower confidence for partial matches
        }
      }
    }
    
    return null
  }

  /**
   * Calculate straight-line distance between two points using Haversine formula
   */
  calculateDistance(start: Coordinates, end: Coordinates): number {
    const R = 6371000 // Earth's radius in meters
    const lat1Rad = (start.latitude * Math.PI) / 180
    const lat2Rad = (end.latitude * Math.PI) / 180
    const deltaLatRad = ((end.latitude - start.latitude) * Math.PI) / 180
    const deltaLngRad = ((end.longitude - start.longitude) * Math.PI) / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c
  }

  /**
   * Create a simple straight-line route between two points
   */
  createStraightLineRoute(start: Coordinates, end: Coordinates) {
    const distance = this.calculateDistance(start, end)
    
    // Estimate duration (assuming average speed of 60 km/h for international shipping routes)
    const duration = (distance / 1000) * 60 // seconds (60 km/h = 60 seconds per km)

    // Create a simple straight-line route
    const coordinates: [number, number][] = [
      [start.longitude, start.latitude],
      [end.longitude, end.latitude]
    ]

    return {
      coordinates,
      distance: Math.round(distance),
      duration: Math.round(duration),
      instructions: [
        'Depart from origin',
        'Travel towards destination',
        'Arrive at destination'
      ]
    }
  }

  /**
   * Get all available locations (for debugging/testing)
   */
  getAvailableLocations(): string[] {
    return Object.keys(WORLD_LOCATIONS).sort()
  }
}

// Export singleton instance
export const fallbackMapService = new FallbackMapService()

// Export types
export type { Coordinates, FallbackLocation }