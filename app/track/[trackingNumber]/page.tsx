"use client"

import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { RealTimeTrackingCard } from "@/components/real-time-tracking-card"
import { MapLibreMap } from "@/components/maplibre-map"
import { CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"

// Define the shipment interface locally since it's not exported from global types
interface Shipment {
  id: string
  trackingNumber: string
  status: string
  weight: number
  transportMode: string
  estimatedDeliveryDate: string
  isInternational: boolean
  currentLatitude?: number
  currentLongitude?: number
  currentCity?: string
  currentCountry?: string
}

interface TrackingPageProps {
  params: Promise<{ trackingNumber: string }>
}

export default function TrackingDetailPage({ params }: TrackingPageProps) {
  const [trackingNumber, setTrackingNumber] = useState<string>("")
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)

  // Resolve params and set tracking number
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setTrackingNumber(resolvedParams.trackingNumber)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!trackingNumber) return

    const fetchShipment = async () => {
      try {
        const response = await fetch(`/api/track/${trackingNumber}`)
        if (response.ok) {
          const data = await response.json()
          setShipment(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch shipment:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchShipment()
  }, [trackingNumber])

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <MSEHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
        <MSEFooter />
      </main>
    )
  }

  if (!shipment) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <MSEHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Shipment not found</p>
        </div>
        <MSEFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <MSEHeader />

      <div className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Real-time Card */}
        <div className="mb-8">
          <RealTimeTrackingCard trackingNumber={trackingNumber} initialStatus={shipment.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="p-4 overflow-hidden">
              <MapLibreMap
                shipmentLocation={{
                  latitude: shipment.currentLatitude || 35.0,
                  longitude: shipment.currentLongitude || 18.0,
                  city: shipment.currentCity || "In Transit",
                  country: shipment.currentCountry || "",
                }}
                className="w-full h-96"
              />
            </Card>
          </div>

          {/* Details */}
          <Card className="p-6 space-y-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Package Weight</p>
              <p className="font-semibold text-black">{shipment.weight} kg</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Transport Mode</p>
              <p className="font-semibold text-black">{shipment.transportMode}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Est. Delivery</p>
              <p className="font-semibold text-black">
                {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">International</p>
              <p className="font-semibold text-black">{shipment.isInternational ? "Yes" : "No"}</p>
            </div>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-black mb-6">Delivery Timeline</h2>
          <div className="space-y-6">
            {[
              {
                status: "Package Received",
                location: "Origin Facility",
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                completed: true,
              },
              {
                status: "In Transit",
                location: "Distribution Center",
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                completed: true,
              },
              {
                status: "Out for Delivery",
                location: "Local Hub",
                timestamp: new Date(),
                completed: shipment.status === "OUT_FOR_DELIVERY" || shipment.status === "DELIVERED",
              },
              {
                status: "Delivered",
                location: "Destination",
                timestamp: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
                completed: shipment.status === "DELIVERED",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center">
                  {item.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                  {idx < 3 && (
                    <div className={`w-1 h-12 ${item.completed ? "bg-green-200" : "bg-gray-200"} my-1`}></div>
                  )}
                </div>
                <div className="pb-4">
                  <p className={`font-semibold ${item.completed ? "text-black" : "text-gray-500"}`}>{item.status}</p>
                  <p className="text-sm text-gray-600">{item.location}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.timestamp.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <MSEFooter />
    </main>
  )
}
