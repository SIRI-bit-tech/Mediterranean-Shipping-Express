"use client"

import type React from "react"
import { useState, useEffect, useRef, useSearchParams } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Package, Truck, CheckCircle2, Search } from "lucide-react"

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const mapRef = useRef<HTMLDivElement>(null)

  const handleTrack = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!trackingNumber.trim()) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/track/${trackingNumber}`)
      if (!response.ok) {
        setError("Shipment not found. Please check your tracking number.")
        return
      }
      const data = await response.json()
      setShipment(data.data)

      if (mapRef.current && window.mapboxgl) {
        initializeMap()
      }
    } catch (err) {
      console.error("[v0] Tracking error:", err)
      setError("Unable to retrieve tracking information.")
    } finally {
      setLoading(false)
    }
  }

  const initializeMap = () => {
    if (!mapRef.current || !shipment) return

    mapRef.current.style.backgroundImage = `url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-74.0,40.7,2/800x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycW43dnRjMWZuNWEifQ.rJcFIG214AriISLbB6B5aw')`
    mapRef.current.style.backgroundSize = "cover"
    mapRef.current.style.backgroundPosition = "center"
  }

  useEffect(() => {
    if (trackingNumber && !shipment) {
      handleTrack()
    }
  }, [])

  const timelineEvents: TimelineEvent[] = shipment
    ? [
        {
          title: "Arrived at Sort Facility",
          location: "New York, NY",
          time: "Today, 08:30 AM",
          completed: true,
          icon: "check",
        },
        {
          title: "Departed Logistics Hub",
          location: "Milan, IT",
          time: "Yesterday, 10:00 PM",
          completed: true,
          icon: "truck",
        },
        {
          title: "Processed at Origin",
          location: "Milan, IT",
          time: "Yesterday, 06:00 PM",
          completed: true,
          icon: "box",
        },
        {
          title: "Shipment Initiated",
          location: "Milan, IT",
          time: "Yesterday, 04:00 PM",
          completed: true,
          icon: "box",
        },
      ]
    : []

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
                  <p className="text-gray-600 text-sm font-semibold mb-4">LIVE LOCATION</p>
                  <div
                    ref={mapRef}
                    className="h-96 bg-gray-300 rounded-lg overflow-hidden relative flex items-center justify-center"
                  >
                    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                      <line x1="20%" y1="20%" x2="50%" y2="50%" stroke="#FFB700" strokeWidth="3" />
                      <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="#FFB700" strokeWidth="3" />

                      <circle cx="20%" cy="20%" r="8" fill="white" stroke="#FFB700" strokeWidth="2" />

                      <circle cx="50%" cy="50%" r="10" fill="#FFB700" stroke="white" strokeWidth="3" />
                      <rect x="45%" y="58%" width="10%" height="20" fill="#000" rx="3" />
                      <text x="50%" y="72%" fontSize="12" fill="white" textAnchor="middle" fontWeight="bold">
                        In Transit
                      </text>

                      <circle cx="80%" cy="30%" r="8" fill="white" stroke="#666" strokeWidth="2" />
                    </svg>

                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur text-white px-4 py-2 rounded-lg text-sm font-semibold">
                      UPDATED: 2 MINS AGO
                    </div>
                  </div>
                </Card>

                {/* Shipment Journey */}
                <Card className="p-8 bg-white">
                  <h3 className="text-xl font-bold text-black mb-8">Shipment Journey</h3>

                  <div className="space-y-6">
                    {timelineEvents.map((event, idx) => (
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
                          {idx < timelineEvents.length - 1 && (
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
                  <p className="font-bold text-black text-lg mb-1">MSE Logistics Hub</p>
                  <p className="text-gray-600 text-sm">Milan, Italy</p>
                </Card>

                <Card className="p-6 bg-white">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-wide mb-3">TO</p>
                  <p className="font-bold text-black text-lg mb-1">John Doe</p>
                  <p className="text-gray-600 text-sm">123 Fashion Ave, NY 10018</p>
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
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
