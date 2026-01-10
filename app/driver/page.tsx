"use client"

import { useState, useEffect, useRef } from "react"
import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DriverStats } from "@/components/driver-stats"
import { DeliveryListItem } from "@/components/delivery-list-item"
import { MapPin, AlertCircle, Navigation, LogOut, CheckCircle2, Loader2 } from "lucide-react"
import type { Shipment } from "@/lib/types/global"

export default function DriverDashboard() {
  const [deliveries, setDeliveries] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    checkDriverAccess()
  }, [])

  // Cleanup GPS watch on unmount or when watchId changes to null
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
    }
  }, [])

  // Additional cleanup when GPS is disabled
  useEffect(() => {
    if (!gpsEnabled && watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [gpsEnabled])

  const checkDriverAccess = async () => {
    try {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")
      
      if (!token || !userData) {
        window.location.href = "/auth/login"
        return
      }

      const user = JSON.parse(userData)
      if (user.role !== "DRIVER") {
        window.location.href = "/dashboard"
        return
      }

      await fetchDeliveries()
    } catch (err) {
      setError("Failed to load driver data")
      console.error("Driver access error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveries = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/driver/deliveries", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          window.location.href = "/auth/login"
          return
        }
        throw new Error("Failed to fetch deliveries")
      }

      const data = await response.json()
      setDeliveries(data.deliveries || [])
    } catch (err) {
      setError("Failed to load deliveries")
      console.error("Error fetching deliveries:", err)
    }
  }

  // Enable/Disable GPS tracking
  const toggleGPS = () => {
    if (!gpsEnabled) {
      // Enable GPS tracking
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setLocation({ lat: latitude, lng: longitude })

            // Send location update to backend
            fetch("/api/driver/location", {
              method: "PUT",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({ latitude, longitude, accuracy: position.coords.accuracy }),
            }).catch(console.error)
          },
          (error) => console.error("GPS error:", error),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        )
        
        // Store the watch ID for later cleanup
        watchId.current = id
      }
    } else {
      // Disable GPS tracking
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      setLocation(null)
    }
    setGpsEnabled(!gpsEnabled)
  }

  const handleCompleteDelivery = async (shipmentId: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`/api/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "DELIVERED",
          location: location ? `${location.lat},${location.lng}` : "Delivered",
        }),
      })
      
      // Remove from deliveries list
      setDeliveries(deliveries.filter((d) => d.id !== shipmentId))
    } catch (error) {
      console.error("Failed to complete delivery:", error)
    }
  }

  // Calculate stats from real data
  const stats = {
    assignedDeliveries: deliveries.filter(d => ["OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(d.status)).length,
    completedToday: deliveries.filter(d => d.status === "DELIVERED" && 
      new Date(d.actualDeliveryDate || '').toDateString() === new Date().toDateString()).length,
    totalDistance: 24.5, // This would come from GPS tracking data
    averageRating: 4.8, // This would come from customer feedback
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <MSEHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
            <p className="text-gray-600">Loading driver dashboard...</p>
          </div>
        </div>
        <MSEFooter />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <MSEHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-black mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDeliveries} className="bg-black text-white hover:bg-gray-900">
              Try Again
            </Button>
          </Card>
        </div>
        <MSEFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <MSEHeader />

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Driver Dashboard</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">Manage your deliveries for today</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={toggleGPS}
              variant={gpsEnabled ? "default" : "outline"}
              className={`text-sm ${gpsEnabled ? "bg-green-600 text-white hover:bg-green-700" : ""}`}
              size="sm"
            >
              <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{gpsEnabled ? "GPS Active" : "Enable GPS"}</span>
              <span className="sm:hidden">{gpsEnabled ? "GPS" : "GPS"}</span>
            </Button>
            <Button variant="outline" className="border-gray-300 bg-transparent text-sm" size="sm">
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>

        {/* GPS Status Alert */}
        {gpsEnabled && location && (
          <Card className="mb-6 sm:mb-8 p-3 sm:p-4 bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-green-900 text-sm sm:text-base">GPS Tracking Active</p>
                <p className="text-xs sm:text-sm text-green-700 break-all">
                  Your location is being shared: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Stats */}
        <div className="mb-6 sm:mb-8">
          <DriverStats
            assignedDeliveries={stats.assignedDeliveries}
            completedToday={stats.completedToday}
            totalDistance={stats.totalDistance}
            averageRating={stats.averageRating}
          />
        </div>

        {/* Deliveries */}
        <Card className="p-3 sm:p-6">
          <Tabs defaultValue="assigned" className="w-full">
            <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto">
              <TabsTrigger value="assigned" className="flex-1 sm:flex-none text-xs sm:text-sm">
                <span className="hidden sm:inline">Assigned ({deliveries.filter((d) => ["OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(d.status)).length})</span>
                <span className="sm:hidden">Active ({deliveries.filter((d) => ["OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(d.status)).length})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 sm:flex-none text-xs sm:text-sm">
                Completed ({stats.completedToday})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assigned" className="space-y-3 sm:space-y-4">
              {deliveries.filter((d) => ["OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(d.status)).length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">No active deliveries assigned</p>
                </div>
              ) : (
                deliveries
                  .filter((d) => ["OUT_FOR_DELIVERY", "IN_TRANSIT"].includes(d.status))
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

            <TabsContent value="completed" className="space-y-3 sm:space-y-4">
              {stats.completedToday === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-600">
                  <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base">No deliveries completed today yet.</p>
                </div>
              ) : (
                deliveries
                  .filter(d => d.status === "DELIVERED" && 
                    new Date(d.actualDeliveryDate || '').toDateString() === new Date().toDateString())
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
          </Tabs>
        </Card>
      </div>

      <MSEFooter />
    </main>
  )
}