"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { Coordinates, RouteResult } from "@/lib/graphhopper-service"

interface MapLibreMapProps {
  shipmentLocation?: {
    latitude: number
    longitude: number
    city: string
    country: string
  }
  originLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  destinationLocation?: {
    latitude: number
    longitude: number
    address?: string
  }
  driverLocation?: {
    latitude: number
    longitude: number
  }
  transportMode?: 'AIR' | 'LAND' | 'WATER' | 'MULTIMODAL'
  showRoute?: boolean
  onRouteCalculated?: (route: RouteResult) => void
  className?: string
  style?: React.CSSProperties
}

export function MapLibreMap({
  shipmentLocation,
  originLocation,
  destinationLocation,
  driverLocation,
  transportMode = 'LAND',
  showRoute = true,
  onRouteCalculated,
  className = "w-full h-full rounded-lg overflow-hidden",
  style = { minHeight: "400px" }
}: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const routeSourceId = 'route-source'
  const routeLayerId = 'route-layer'
  const onRouteCalculatedRef = useRef(onRouteCalculated)

  // Update the callback ref when it changes
  useEffect(() => {
    onRouteCalculatedRef.current = onRouteCalculated
  }, [onRouteCalculated])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Default center (Mediterranean Sea area for MSE branding)
    const defaultCenter: [number, number] = [18.0, 35.0] // [lng, lat]
    const defaultZoom = 6

    // Determine map center and zoom based on available locations
    const getMapCenter = (): [number, number] => {
      if (shipmentLocation) {
        return [shipmentLocation.longitude, shipmentLocation.latitude]
      }
      if (originLocation) {
        return [originLocation.longitude, originLocation.latitude]
      }
      return defaultCenter
    }

    const getMapZoom = (): number => {
      if (shipmentLocation || originLocation || destinationLocation) {
        return 10
      }
      return defaultZoom
    }

    // Initialize MapLibre GL map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles'
          }
        ]
      },
      center: getMapCenter(),
      zoom: getMapZoom(),
      attributionControl: false // We'll add it manually
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Add attribution control
    map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right')

    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left')

    // Set loaded state when map is ready
    map.current.on('load', () => {
      setIsLoaded(true)
    })

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update markers when locations change
  useEffect(() => {
    if (!map.current || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Create custom marker elements with transport mode icons and animations
    const createMarkerElement = (color: string, label: string, isActive = false, transportIcon?: string) => {
      const el = document.createElement('div')
      el.className = `custom-marker ${isActive ? 'active-marker' : ''}`
      
      const icon = transportIcon || label
      
      el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${transportIcon ? '18px' : '12px'};
        color: white;
        transition: all 0.3s ease;
        position: relative;
        ${isActive ? `
          animation: pulse 2s infinite;
          box-shadow: 0 0 0 0 ${color}40;
        ` : ''}
      `
      
      // Add pulsing animation for active markers
      if (isActive) {
        const style = document.createElement('style')
        style.textContent = `
          @keyframes pulse {
            0% {
              box-shadow: 0 0 0 0 ${color}70;
            }
            70% {
              box-shadow: 0 0 0 20px ${color}00;
            }
            100% {
              box-shadow: 0 0 0 0 ${color}00;
            }
          }
          .active-marker:hover {
            transform: scale(1.1);
          }
        `
        document.head.appendChild(style)
      }
      
      el.textContent = icon
      return el
    }

    // Get transport mode icon
    const getTransportIcon = (mode: string) => {
      switch (mode) {
        case 'AIR': return '✈️'
        case 'LAND': return '🚛'
        case 'WATER': return '🚢'
        case 'MULTIMODAL': return '📦'
        default: return '🚛'
      }
    }

    // Add origin marker
    if (originLocation) {
      const originMarker = new maplibregl.Marker({
        element: createMarkerElement('#10B981', 'O', false),
        anchor: 'center'
      })
        .setLngLat([originLocation.longitude, originLocation.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div><strong>Origin</strong>${originLocation.address ? '<br/>' + originLocation.address : ''}</div>`
          )
        )
        .addTo(map.current)

      markersRef.current.push(originMarker)
    }

    // Add current shipment location marker with transport mode icon and pulsing animation
    if (shipmentLocation) {
      const transportIcon = getTransportIcon(transportMode)
      const shipmentMarker = new maplibregl.Marker({
        element: createMarkerElement('#FFB700', 'S', true, transportIcon),
        anchor: 'center'
      })
        .setLngLat([shipmentLocation.longitude, shipmentLocation.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div><strong>Current Location</strong><br/>${shipmentLocation.city}, ${shipmentLocation.country}<br/><em>Transport: ${transportMode}</em></div>`
          )
        )
        .addTo(map.current)

      markersRef.current.push(shipmentMarker)
    }

    // Add destination marker
    if (destinationLocation) {
      const destMarker = new maplibregl.Marker({
        element: createMarkerElement('#3B82F6', 'D', false),
        anchor: 'center'
      })
        .setLngLat([destinationLocation.longitude, destinationLocation.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div><strong>Destination</strong>${destinationLocation.address ? '<br/>' + destinationLocation.address : ''}</div>`
          )
        )
        .addTo(map.current)

      markersRef.current.push(destMarker)
    }

    // Add driver location marker
    if (driverLocation) {
      const driverMarker = new maplibregl.Marker({
        element: createMarkerElement('#EF4444', '👤', true),
        anchor: 'center'
      })
        .setLngLat([driverLocation.longitude, driverLocation.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            '<div><strong>Driver Location</strong><br/>Live tracking</div>'
          )
        )
        .addTo(map.current)

      markersRef.current.push(driverMarker)
    }

    // Fit map to show all markers
    if (markersRef.current.length > 1) {
      const bounds = new maplibregl.LngLatBounds()
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat())
      })
      map.current.fitBounds(bounds, { padding: 50 })
    }
  }, [isLoaded, originLocation, shipmentLocation, destinationLocation, driverLocation, transportMode])

  // Add journey progress and connecting lines visualization
  useEffect(() => {
    if (!map.current || !isLoaded) return

    const progressSourceId = 'progress-source'
    const progressLayerId = 'progress-layer'
    const connectionSourceId = 'connection-source'
    const connectionLayerId = 'connection-layer'

    // Remove existing lines - must remove layers before sources
    const layersToRemove = [
      progressLayerId,
      connectionLayerId + '-full',
      connectionLayerId + '-remaining', 
      connectionLayerId + '-completed',
      connectionLayerId
    ]
    
    const sourcesToRemove = [
      progressSourceId,
      connectionSourceId
    ]

    try {
      // Remove layers first
      layersToRemove.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.removeLayer(layerId)
        }
      })

      // Then remove sources
      sourcesToRemove.forEach(sourceId => {
        if (map.current?.getSource(sourceId)) {
          map.current.removeSource(sourceId)
        }
      })
    } catch (error) {
      console.warn('Error removing map layers/sources:', error)
      // Continue execution - don't let map errors break the component
    }

    // Create connecting lines between all points
    const lines = []

    // Origin to Current (completed journey - thick orange line)
    if (originLocation && shipmentLocation) {
      lines.push({
        type: 'Feature' as const,
        properties: { type: 'completed' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [originLocation.longitude, originLocation.latitude],
            [shipmentLocation.longitude, shipmentLocation.latitude]
          ]
        }
      })
    }

    // Current to Destination (remaining journey - dashed gray line)
    if (shipmentLocation && destinationLocation) {
      lines.push({
        type: 'Feature' as const,
        properties: { type: 'remaining' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [shipmentLocation.longitude, shipmentLocation.latitude],
            [destinationLocation.longitude, destinationLocation.latitude]
          ]
        }
      })
    }

    // Direct Origin to Destination (full route - thin gray line)
    if (originLocation && destinationLocation) {
      lines.push({
        type: 'Feature' as const,
        properties: { type: 'full-route' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [originLocation.longitude, originLocation.latitude],
            [destinationLocation.longitude, destinationLocation.latitude]
          ]
        }
      })
    }

    if (lines.length > 0) {
      try {
        // Add connection lines source
        map.current.addSource(connectionSourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: lines
          }
        })

        // Add full route layer (background)
        map.current.addLayer({
          id: connectionLayerId + '-full',
          type: 'line',
          source: connectionSourceId,
          filter: ['==', ['get', 'type'], 'full-route'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#D1D5DB',
            'line-width': 2,
            'line-opacity': 0.5
          }
        })

        // Add remaining journey layer
        map.current.addLayer({
          id: connectionLayerId + '-remaining',
          type: 'line',
          source: connectionSourceId,
          filter: ['==', ['get', 'type'], 'remaining'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#9CA3AF',
            'line-width': 3,
            'line-opacity': 0.7,
            'line-dasharray': [2, 2]
          }
        })

        // Add completed journey layer (on top)
        map.current.addLayer({
          id: connectionLayerId + '-completed',
          type: 'line',
          source: connectionSourceId,
          filter: ['==', ['get', 'type'], 'completed'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FFB700',
            'line-width': 4,
            'line-opacity': 0.9
          }
        })
      } catch (error) {
        console.warn('Error adding map layers:', error)
        // Continue execution - don't let map errors break the component
      }
    }

  }, [isLoaded, originLocation, shipmentLocation, destinationLocation])

  // Calculate and display route
  useEffect(() => {
    if (!map.current || !isLoaded || !showRoute || !originLocation || !destinationLocation) return

    // Create a stable key for this route calculation to prevent duplicate calls
    const routeKey = `${originLocation.latitude},${originLocation.longitude}-${destinationLocation.latitude},${destinationLocation.longitude}`
    
    // Check if we already calculated this route
    if (map.current.getSource(routeSourceId)) {
      const existingSource = map.current.getSource(routeSourceId) as any
      if (existingSource._data?.properties?.routeKey === routeKey) {
        return // Route already calculated for these coordinates
      }
    }

    const calculateRoute = async () => {
      try {
        const response = await fetch('/api/route', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start: { latitude: originLocation.latitude, longitude: originLocation.longitude },
            end: { latitude: destinationLocation.latitude, longitude: destinationLocation.longitude },
            profile: 'car'
          }),
        })

        if (!response.ok) {
          console.warn('Could not calculate route:', response.statusText)
          return
        }

        const data = await response.json()
        
        if (!data.success || !data.data) {
          console.warn('Could not calculate route:', data.error)
          return
        }

        const route = data.data

        // Remove existing route layer and source
        if (map.current!.getLayer(routeLayerId)) {
          map.current!.removeLayer(routeLayerId)
        }
        if (map.current!.getSource(routeSourceId)) {
          map.current!.removeSource(routeSourceId)
        }

        // Add route source with route key for deduplication
        map.current!.addSource(routeSourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: { routeKey }, // Add route key to prevent duplicate calculations
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          }
        })

        // Add route layer
        map.current!.addLayer({
          id: routeLayerId,
          type: 'line',
          source: routeSourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FFB700',
            'line-width': 4,
            'line-opacity': 0.8
          }
        })

        // Callback with route information (only call once per route)
        if (onRouteCalculatedRef.current) {
          onRouteCalculatedRef.current(route)
        }

        // Fit map to route bounds
        const bounds = new maplibregl.LngLatBounds()
        route.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord)
        })
        map.current!.fitBounds(bounds, { padding: 50 })

      } catch (error) {
        console.error('Error calculating route:', error)
      }
    }

    calculateRoute()
  }, [isLoaded, originLocation?.latitude, originLocation?.longitude, destinationLocation?.latitude, destinationLocation?.longitude, showRoute])

  // Update driver location in real-time (for Socket.IO integration)
  const updateDriverLocation = (newLocation: Coordinates) => {
    if (!map.current || !isLoaded) return

    // Find existing driver marker
    const driverMarkerIndex = markersRef.current.findIndex(marker => {
      const element = marker.getElement()
      return element.textContent === 'D' && element.style.backgroundColor === 'rgb(239, 68, 68)'
    })

    if (driverMarkerIndex !== -1) {
      // Update existing driver marker
      markersRef.current[driverMarkerIndex].setLngLat([newLocation.longitude, newLocation.latitude])
    } else {
      // Create new driver marker
      const createMarkerElement = (color: string, label: string) => {
        const el = document.createElement('div')
        el.className = 'custom-marker'
        el.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          color: white;
        `
        el.textContent = label
        return el
      }

      const driverMarker = new maplibregl.Marker({
        element: createMarkerElement('#EF4444', 'D'),
        anchor: 'center'
      })
        .setLngLat([newLocation.longitude, newLocation.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            '<div><strong>Driver Location</strong><br/>Live Position</div>'
          )
        )
        .addTo(map.current)

      markersRef.current.push(driverMarker)
    }
  }

  // Expose updateDriverLocation method via ref
  useEffect(() => {
    if (mapContainer.current) {
      (mapContainer.current as any).updateDriverLocation = updateDriverLocation
    }
  }, [isLoaded])

  return (
    <div 
      ref={mapContainer} 
      className={className} 
      style={style}
    />
  )
}