"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Package, Truck, CheckCircle2, Search } from "lucide-react"
import { MapLibreMap } from "@/components/maplibre-map"
import type { RouteResult } from "@/lib/graphhopper-service"
import { useRealTimeTracking } from "@/lib/hooks/use-real-time-tracking"
import type { DriverLocation, AdminUpdate } from "@/lib/socket-client"

interface TrackingData {
  trackingNumber: string
  status: string
  estimatedDelivery: string
  carrier: string
  originCity: string
  destinationCity: string
  currentLocation: string
  weight: string
  dimensions: string
  service: string
  lastUpdate: string
  origin?: string
  destination?: string
  coordinates?: {
    origin: {
      latitude: number
      longitude: number
      address: string
    }
    destination: {
      latitude: number
      longitude: number
      address: string
    }
    current: {
      latitude: number
      longitude: number
      city: string
      country: string
    }
  }
  route?: {
    distance: number
    duration: number
    eta: string
  }
}

interface TimelineEvent {
  title: string
  location: string
  time: string
  completed: boolean
  icon: "check" | "truck" | "box"
}

export function TrackContent() {
  const searchParams = useSearchParams()
  const [trackingNumber, setTrackingNumber] = useState(searchParams?.get("id") || "")
  const [shipment, setShipment] = useState<TrackingData | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null)
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null)
  const [adminUpdates, setAdminUpdates] = useState<AdminUpdate[]>([])

  // Real-time tracking integration
  const { isConnected } = useRealTimeTracking({
    shipmentId: shipment?.trackingNumber || '',
    onDriverLocationUpdate: (location) => {
      setDriverLocation(location)
    },
    onShipmentStatusUpdate: (update) => {
      // Update shipment status in real-time
      if (shipment) {
        setShipment(prev => {
          if (!prev) return null
          
          // Safely handle coordinates update
          let updatedCoordinates = prev.coordinates
          
          if (update.location) {
            // If we have location data in the update
            if (prev.coordinates && prev.coordinates.current) {
              // Update existing coordinates
              updatedCoordinates = {
                ...prev.coordinates,
                current: {
                  latitude: update.location.latitude,
                  longitude: update.location.longitude,
                  city: prev.coordinates.current.city,
                  country: prev.coordinates.current.country
                }
              }
            } else if (prev.coordinates) {
              // Coordinates exist but current is missing - create current from update
              updatedCoordinates = {
                ...prev.coordinates,
                current: {
                  latitude: update.location.latitude,
                  longitude: update.location.longitude,
                  city: 'Unknown',
                  country: 'Unknown'
                }
              }
            } else {
              // No coordinates exist - create new coordinates object with sensible defaults
              updatedCoordinates = {
                origin: {
                  latitude: 0,
                  longitude: 0,
                  address: 'Origin'
                },
                destination: {
                  latitude: 0,
                  longitude: 0,
                  address: 'Destination'
                },
                current: {
                  latitude: update.location.latitude,
                  longitude: update.location.longitude,
                  city: 'Unknown',
                  country: 'Unknown'
                }
              }
            }
          }
          // If update.location is undefined, preserve existing coordinates
          
          return {
            ...prev,
            status: update.status,
            currentLocation: update.location?.address || prev.currentLocation,
            coordinates: updatedCoordinates
          }
        })
      }
    },
    onAdminUpdate: (update) => {
      // Handle admin updates
      setAdminUpdates(prev => [update, ...prev.slice(0, 9)]) // Keep last 10 updates
      
      // Update shipment based on admin action
      if (update.type === 'status_change' && shipment) {
        setShipment(prev => prev ? {
          ...prev,
          status: update.data.status
        } : null)
      }
    }
  })

  const handleTrack = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!trackingNumber.trim()) return

    setLoading(true)
    setError("")

    try {
      // Fetch shipment data
      const shipmentResponse = await fetch(`/api/track/${trackingNumber}`)
      if (!shipmentResponse.ok) {
        setError("Shipment not found. Please check your tracking number.")
        return
      }
      const shipmentData = await shipmentResponse.json()
      setShipment(shipmentData.data)

      // Fetch timeline data
      const timelineResponse = await fetch(`/api/track/${trackingNumber}/timeline`)
      if (timelineResponse.ok) {
        const timelineData = await timelineResponse.json()
        if (timelineData.success && timelineData.data.length > 0) {
          // Convert API timeline data to component format
          const formattedTimeline = timelineData.data.map((item: any) => ({
            title: item.event,
            location: item.location,
            time: new Date(item.timestamp).toLocaleString(),
            completed: true,
            icon: getIconForStatus(item.status)
          }))
          setTimeline(formattedTimeline)
        } else {
          // Fallback to basic timeline if no checkpoints exist
          setTimeline([
            {
              title: `Shipment ${shipmentData.data.status.replace('_', ' ')}`,
              location: shipmentData.data.currentLocation || 'Processing',
              time: new Date(shipmentData.data.lastUpdate).toLocaleString(),
              completed: true,
              icon: "box",
            }
          ])
        }
      }
    } catch (err) {
      console.error("Tracking error:", err)
      setError("Unable to retrieve tracking information.")
    } finally {
      setLoading(false)
    }
  }

  const getIconForStatus = (status: string): "check" | "truck" | "box" => {
    if (status === 'completed' || status === 'delivered') return 'check'
    if (status === 'in-transit' || status === 'out-for-delivery') return 'truck'
    return 'box'
  }

  const handleRouteCalculated = (route: RouteResult) => {
    setRouteInfo(route)
  }

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }
    return `${(meters / 1000).toFixed(1)} km`
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  useEffect(() => {
    if (trackingNumber && !shipment) {
      handleTrack()
    }
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-black mb-4">Track Your Package</h1>

          <form onSubmit={handleTrack} className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="1Z999AA10123456784"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="pl-12 text-lg px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 rounded-lg"
            >
              {loading ? "Tracking..." : "Track"}
            </Button>
          </form>

          {error && <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg">{error}</div>}
        </div>
      </section>

      {/* Results */}
      {shipment && (
        <section className="py-12 flex-1">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Status Header */}
            <Card className="mb-8 p-6 bg-white border-l-4 border-yellow-500">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      {shipment.status}
                    </span>
                    <span className="text-gray-600 text-sm font-mono"># {shipment.trackingNumber}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-black mb-2">
                    Estimated Delivery: {shipment.estimatedDelivery}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm">Carrier</p>
                  <p className="text-black font-bold text-lg">{shipment.carrier}</p>
                </div>
              </div>
            </Card>

            {/* Main Content - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Map & Journey */}
              <div className="lg:col-span-2 space-y-8">
                {/* Live Location Map */}
                <Card className="p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 text-sm font-semibold">LIVE LOCATION</p>
                    <div className="flex items-center gap-4">
                      {/* Connection status indicator - only show when connected */}
                      {isConnected && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-xs text-gray-500">Live</span>
                        </div>
                      )}
                      {routeInfo && (
                        <div className="text-right text-xs text-gray-500">
                          <div>Distance: {formatDistance(routeInfo.distance)}</div>
                          <div>Duration: {formatDuration(routeInfo.duration)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-96 rounded-lg overflow-hidden relative">
                    {shipment?.coordinates ? (
                      <MapLibreMap
                        shipmentLocation={shipment.coordinates.current}
                        originLocation={shipment.coordinates.origin}
                        destinationLocation={shipment.coordinates.destination}
                        driverLocation={driverLocation ? {
                          latitude: driverLocation.latitude,
                          longitude: driverLocation.longitude
                        } : undefined}
                        showRoute={true}
                        onRouteCalculated={handleRouteCalculated}
                        className="w-full h-full rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-gray-500">Loading map...</div>
                      </div>
                    )}
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-semibold">
                      {driverLocation && (
                        `DRIVER UPDATED: ${new Date(driverLocation.timestamp).toLocaleTimeString()}`
                      )}
                    </div>
                  </div>
                </Card>

                {/* Shipment Journey */}
                <Card className="p-8 bg-white">
                  <h3 className="text-xl font-bold text-black mb-8">Shipment Journey</h3>

                  <div className="space-y-6">
                    {timeline.map((event, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              event.completed ? "bg-yellow-500" : "bg-gray-300"
                            }`}
                          >
                            {event.icon === "check" && <CheckCircle2 className="h-6 w-6 text-white" />}
                            {event.icon === "truck" && <Truck className="h-6 w-6 text-white" />}
                            {event.icon === "box" && <Package className="h-6 w-6 text-white" />}
                          </div>
                          {idx < timeline.length - 1 && (
                            <div
                              className={`w-0.5 h-12 ${event.completed ? "bg-yellow-500" : "bg-gray-200"} my-2`}
                            ></div>
                          )}
                        </div>

                        <div className="pb-4 pt-1">
                          <p className="font-bold text-black text-base">{event.title}</p>
                          <p className="text-gray-600 text-sm">{event.location}</p>
                          <p className="text-yellow-600 text-xs font-semibold mt-1">{event.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                <Card className="p-6 bg-white">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-3">FROM</p>
                  <p className="font-bold text-black text-lg mb-1">Origin Address</p>
                  <p className="text-gray-600 text-sm">{shipment.origin || shipment.originCity || 'Origin Location'}</p>
                </Card>

                <Card className="p-6 bg-white">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-3">TO</p>
                  <p className="font-bold text-black text-lg mb-1">Destination Address</p>
                  <p className="text-gray-600 text-sm">{shipment.destination || shipment.destinationCity || 'Destination Location'}</p>
                </Card>

                <Card className="p-6 bg-white">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-3">WEIGHT & DIMS</p>
                  <p className="font-bold text-black text-base mb-2">{shipment.weight}</p>
                  <p className="text-gray-600 text-sm">{shipment.dimensions}</p>
                </Card>

                <Card className="p-6 bg-white">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-3">SERVICE</p>
                  <p className="font-bold text-black text-base">{shipment.service}</p>
                  <p className="text-gray-600 text-sm">Signature Required</p>
                </Card>

                {/* Admin Updates */}
                {adminUpdates.length > 0 && (
                  <Card className="p-6 bg-white">
                    <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-3">RECENT UPDATES</p>
                    <div className="space-y-3">
                      {adminUpdates.slice(0, 3).map((update, idx) => (
                        <div key={idx} className="border-l-2 border-yellow-500 pl-3">
                          <p className="font-semibold text-black text-sm">
                            {update.type.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-gray-600 text-xs">
                            by {update.adminName}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(update.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
