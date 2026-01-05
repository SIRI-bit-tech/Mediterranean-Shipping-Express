"use client"

import { useState } from "react"
import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DriverStats } from "@/components/driver-stats"
import { DeliveryListItem } from "@/components/delivery-list-item"
import { MapPin, AlertCircle, Navigation, LogOut, CheckCircle2 } from "lucide-react"
import type { Shipment } from "@/lib/types/global"

export default function DriverDashboard() {
  const [deliveries, setDeliveries] = useState<Shipment[]>([
    {
      id: "1",
      trackingNumber: "1Z999AA10123",
      userId: "cust_1",
      originAddressId: "addr_1",
      destinationAddressId: "addr_2",
      driverId: "driver_123",
      status: "OUT_FOR_DELIVERY",
      transportMode: "LAND",
      currentCity: "Amsterdam",
      currentCountry: "Netherlands",
      currentLatitude: 52.37,
      currentLongitude: 4.89,
      estimatedDeliveryDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      weight: 5.5,
      description: "Office Supplies",
      isInternational: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      trackingNumber: "1Z888BB10456",
      userId: "cust_2",
      originAddressId: "addr_1",
      destinationAddressId: "addr_3",
      driverId: "driver_123",
      status: "OUT_FOR_DELIVERY",
      transportMode: "LAND",
      currentCity: "Amsterdam",
      currentCountry: "Netherlands",
      currentLatitude: 52.37,
      currentLongitude: 4.89,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
      weight: 2.3,
      description: "Electronics",
      isInternational: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Enable GPS tracking
  const toggleGPS = () => {
    if (!gpsEnabled) {
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setLocation({ lat: latitude, lng: longitude })

            // Send location update to backend
            fetch("/api/driver/location", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ latitude, longitude, accuracy: position.coords.accuracy }),
            }).catch(console.error)
          },
          (error) => console.error("GPS error:", error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        )
      }
    }
    setGpsEnabled(!gpsEnabled)
  }

  const handleCompleteDelivery = async (shipmentId: string) => {
    setDeliveries(deliveries.filter((d) => d.id !== shipmentId))

    // Send completion to backend
    try {
      await fetch(`/api/shipments/${shipmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DELIVERED",
          location: location ? `${location.lat},${location.lng}` : "Unknown",
        }),
      })
    } catch (error) {
      console.error("Failed to complete delivery:", error)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <MSEHeader />

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Driver Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your deliveries for today</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <Button
              onClick={toggleGPS}
              variant={gpsEnabled ? "default" : "outline"}
              className={gpsEnabled ? "bg-green-600 text-white hover:bg-green-700" : ""}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {gpsEnabled ? "GPS Active" : "Enable GPS"}
            </Button>
            <Button variant="outline" className="border-gray-300 bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* GPS Status Alert */}
        {gpsEnabled && location && (
          <Card className="mb-8 p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">GPS Tracking Active</p>
                <p className="text-sm text-green-700">
                  Your location is being shared: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="mb-8">
          <DriverStats
            assignedDeliveries={deliveries.length}
            completedToday={3}
            totalDistance={24.5}
            averageRating={4.8}
          />
        </div>

        {/* Deliveries */}
        <Card className="p-6">
          <Tabs defaultValue="assigned" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="assigned">
                Assigned ({deliveries.filter((d) => d.status === "OUT_FOR_DELIVERY").length})
              </TabsTrigger>
              <TabsTrigger value="completed">Completed (3)</TabsTrigger>
            </TabsList>

            <TabsContent value="assigned" className="space-y-4">
              {deliveries.filter((d) => d.status === "OUT_FOR_DELIVERY").length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active deliveries assigned</p>
                </div>
              ) : (
                deliveries
                  .filter((d) => d.status === "OUT_FOR_DELIVERY")
                  .map((delivery) => (
                    <DeliveryListItem
                      key={delivery.id}
                      shipment={delivery}
                      onNavigate={(s) =>
                        window.open(`https://maps.google.com/?q=${s.currentLatitude},${s.currentLongitude}`)
                      }
                      onComplete={handleCompleteDelivery}
                    />
                  ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <div className="text-center py-12 text-gray-600">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p>You've completed 3 deliveries today. Great work!</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <MSEFooter />
    </main>
  )
}
