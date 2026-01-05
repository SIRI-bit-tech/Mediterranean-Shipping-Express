"use client"

import { useState } from "react"
import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import { TrackingCard } from "@/components/tracking-card"

export default function DashboardPage() {
  const [shipments, setShipments] = useState([
    {
      id: "1",
      trackingNumber: "1Z999AA10123",
      userId: "user_123",
      originAddressId: "addr_1",
      destinationAddressId: "addr_2",
      status: "IN_TRANSIT" as const,
      transportMode: "LAND" as const,
      currentCity: "Amsterdam",
      currentCountry: "Netherlands",
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      weight: 5.5,
      description: "Electronics Package",
      isInternational: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      trackingNumber: "1Z888BB10456",
      userId: "user_123",
      originAddressId: "addr_1",
      destinationAddressId: "addr_3",
      status: "DELIVERED" as const,
      transportMode: "AIR" as const,
      estimatedDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      weight: 2.3,
      description: "Document Package",
      isInternational: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  const stats = [
    {
      label: "Active Shipments",
      value: "3",
      icon: Clock,
      color: "text-blue-600",
    },
    { label: "Delivered", value: "24", icon: CheckCircle2, color: "text-green-600" },
    { label: "Total Shipped", value: "27", icon: TrendingUp, color: "text-yellow-600" },
    {
      label: "Issues",
      value: "0",
      icon: AlertCircle,
      color: "text-red-600",
    },
  ]

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
              {shipments.map((shipment) => (
                <TrackingCard key={shipment.id} shipment={shipment} />
              ))}
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
