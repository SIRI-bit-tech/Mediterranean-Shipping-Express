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
    const checkAuthAndFetchData = async () => {
      try {
        // Check authentication by calling a protected endpoint
        const response = await fetch("/api/shipments", {
          credentials: 'include', // Include cookies
          headers: {
            "Content-Type": "application/json"
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, redirect to login
            window.location.href = "/auth/login"
            return
          }
          throw new Error("Failed to fetch shipments")
        }

        const data = await response.json()
        
        // Check if user should be redirected based on role
        // We can get user info from the response or make a separate call
        // For now, assume CUSTOMER role if we can access shipments
        
        setShipments(data.shipments || [])
        setLoading(false)
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load dashboard")
        setLoading(false)
      }
    }

    checkAuthAndFetchData()
  }, [])

  const retryFetch = async () => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/shipments", {
        credentials: 'include',
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
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
            <Button onClick={retryFetch} className="bg-black text-white hover:bg-gray-900">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Dashboard</h1>
            <p className="text-gray-600 mt-1 sm:mt-2">Manage and track your shipments</p>
          </div>
          <Button className="bg-black text-white hover:bg-gray-900 gap-2 self-start sm:self-auto" asChild>
            <a href="/ship">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">New Shipment</span>
              <span className="sm:hidden">New</span>
            </a>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-3 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-gray-600 text-xs sm:text-sm">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold text-black mt-1">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Shipments Tabs */}
        <Card className="p-3 sm:p-6">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none text-xs sm:text-sm">All</TabsTrigger>
              <TabsTrigger value="active" className="flex-1 sm:flex-none text-xs sm:text-sm">Active</TabsTrigger>
              <TabsTrigger value="delivered" className="flex-1 sm:flex-none text-xs sm:text-sm">Delivered</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 sm:space-y-4">
              {shipments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No shipments yet</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Create your first shipment to get started</p>
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

            <TabsContent value="active" className="space-y-3 sm:space-y-4">
              {shipments
                .filter((s) => ["PROCESSING", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"].includes(s.status))
                .map((shipment) => (
                  <TrackingCard key={shipment.id} shipment={shipment} />
                ))}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-3 sm:space-y-4">
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
