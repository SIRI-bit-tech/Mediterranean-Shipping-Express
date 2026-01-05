"use client"

import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

interface MapboxMapProps {
  accessToken: string
  shipmentLocation?: {
    latitude: number
    longitude: number
    city: string
    country: string
  }
  originLocation?: {
    latitude: number
    longitude: number
  }
  destinationLocation?: {
    latitude: number
    longitude: number
  }
  driverLocation?: {
    latitude: number
    longitude: number
  }
}

export function MapboxMap({
  accessToken,
  shipmentLocation,
  originLocation,
  destinationLocation,
  driverLocation,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!accessToken || !mapContainer.current) return

    mapboxgl.accessToken = accessToken

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [shipmentLocation?.longitude || 0, shipmentLocation?.latitude || 0],
      zoom: 10,
    })

    // Add origin marker
    if (originLocation) {
      new mapboxgl.Marker({ color: "#10B981" })
        .setLngLat([originLocation.longitude, originLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML("<p><strong>Origin</strong></p>"))
        .addTo(map.current)
    }

    // Add shipment/current location marker
    if (shipmentLocation) {
      new mapboxgl.Marker({ color: "#FFB700" })
        .setLngLat([shipmentLocation.longitude, shipmentLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(`<p><strong>Current Location</strong><br/>${shipmentLocation.city}</p>`))
        .addTo(map.current)
    }

    // Add destination marker
    if (destinationLocation) {
      new mapboxgl.Marker({ color: "#3B82F6" })
        .setLngLat([destinationLocation.longitude, destinationLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML("<p><strong>Destination</strong></p>"))
        .addTo(map.current)
    }

    // Add driver location marker
    if (driverLocation) {
      new mapboxgl.Marker({ color: "#EF4444" })
        .setLngLat([driverLocation.longitude, driverLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML("<p><strong>Driver Location</strong></p>"))
        .addTo(map.current)
    }

    return () => {
      map.current?.remove()
    }
  }, [accessToken, shipmentLocation, originLocation, destinationLocation, driverLocation])

  return <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" style={{ minHeight: "400px" }} />
}
