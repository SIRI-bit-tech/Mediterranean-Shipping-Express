"use client"

import { useState, useEffect } from "react"
import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Clock, CheckCircle2, AlertCircle, TrendingUp, Loader2, Package } from "lucide-react"
import { TrackingCard } from "@/components/tracking-card"

interface Shipment {
  id: string
  trackingNumber: string
  userId: string
  originAddressId: string
  destinationAddressId: string
  status: "PROCESSING" | "IN_TRANSIT" | "IN_CUSTOMS" | "OUT_FOR_DELIVERY" | "DELIVERED" | "ON_HOLD" | "EXCEPTION"
  transportMode: "AIR" | "LAND" | "WATER" | "MULTIMODAL"
  currentCity?: string
  currentCountry?: string
  estimatedDeliveryDate: Date
  weight: number
  description: string
  isInternational: boolean
  createdAt: Date
  updatedAt: Date
}

export default function DashboardPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")
      
      if (!token || !userData) {
        window.location.href = "/auth/login"
        return
      }

      const user = JSON.parse(userData)
      
      // Redirect based on user role
      if (user.role === "DRIVER") {
        window.location.href = "/driver"
        return
      } else if (user.role === "ADMIN") {
        window.location.href = "/admin"
        return
      }
      
      // If CUSTOMER, continue to fetch shipments
      fetchShipments()
    }

    checkAuthAndRedirect()
  }, [])

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        window.location.href = "/auth/login"
        return
      }

      const response = await fetch("/api/shipments", {
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
        throw new Error("Failed to fetch shipments")
      }

      const data = await response.json()
      setShipments(data.shipments || [])
    } catch (err) {
      setError("Failed to load shipments")
      console.error("Error fetching shipments:", err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real data
  const stats = [
    {
      label: "Active Shipments",
      value: shipments.filter(s => ["PROCESSING", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"].includes(s.status)).length.toString(),
      icon: Clock,
      color: "text-blue-600",
    },
    { 
      label: "Delivered", 
      value: shipments.filter(s => s.status === "DELIVERED").length.toString(), 
      icon: CheckCircle2, 
      color: "text-green-600" 
    },
    { 
      label: "Total Shipped", 
      value: shipments.length.toString(), 
      icon: TrendingUp, 
      color: "text-yellow-600" 
    },
    {
      label: "Issues",
      value: shipments.filter(s => ["ON_HOLD", "EXCEPTION"].includes(s.status)).length.toString(),
      icon: AlertCircle,
      color: "text-red-600",
    },
  ]

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <MSEHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
            <p className="text-gray-600">Loading your dashboard...</p>
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
            <Button onClick={fetchShipments} className="bg-black text-white hover:bg-gray-900">
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

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage and track your shipments</p>
          </div>
          <Button className="bg-black text-white hover:bg-gray-900 gap-2" asChild>
            <a href="/ship">
              <Plus className="h-5 w-5" />
              New Shipment
            </a>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 flex items-start gap-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Shipments Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Shipments</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {shipments.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments yet</h3>
                  <p className="text-gray-600 mb-4">Create your first shipment to get started</p>
                  <Button className="bg-black text-white hover:bg-gray-900" asChild>
                    <a href="/ship">Create Shipment</a>
                  </Button>
                </div>
              ) : (
                shipments.map((shipment) => (
                  <TrackingCard key={shipment.id} shipment={shipment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {shipments
                .filter((s) => ["PROCESSING", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"].includes(s.status))
                .map((shipment) => (
                  <TrackingCard key={shipment.id} shipment={shipment} />
                ))}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-4">
              {shipments
                .filter((s) => s.status === "DELIVERED")
                .map((shipment) => (
                  <TrackingCard key={shipment.id} shipment={shipment} />
                ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <MSEFooter />
    </main>
  )
}
