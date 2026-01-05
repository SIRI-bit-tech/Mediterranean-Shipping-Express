"use client"

import { useState } from "react"
import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminShipmentTable } from "@/components/admin-shipment-table"
import { AdminAnalytics } from "@/components/admin-analytics"
import { Search, Filter, Download, Shield, LogOut } from "lucide-react"
import type { Shipment } from "@/lib/types/global"

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modeFilter, setModeFilter] = useState("all")

  const [shipments, setShipments] = useState<Shipment[]>([
    {
      id: "1",
      trackingNumber: "1Z999AA10123",
      userId: "cust_1",
      originAddressId: "addr_1",
      destinationAddressId: "addr_2",
      driverId: "driver_1",
      status: "IN_TRANSIT",
      transportMode: "LAND",
      currentCity: "Paris",
      currentCountry: "France",
      currentLatitude: 48.8566,
      currentLongitude: 2.3522,
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
      userId: "cust_2",
      originAddressId: "addr_1",
      destinationAddressId: "addr_3",
      driverId: "driver_2",
      status: "PROCESSING",
      transportMode: "AIR",
      currentCity: "London",
      currentCountry: "United Kingdom",
      estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      weight: 2.3,
      description: "Documents",
      isInternational: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      trackingNumber: "1Z777CC10789",
      userId: "cust_3",
      originAddressId: "addr_2",
      destinationAddressId: "addr_4",
      status: "DELIVERED",
      transportMode: "LAND",
      estimatedDeliveryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      weight: 8.2,
      description: "Office Supplies",
      isInternational: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    const matchesMode = modeFilter === "all" || s.transportMode === modeFilter
    return matchesSearch && matchesStatus && matchesMode
  })

  const handleEdit = (shipment: Shipment) => {
    console.log("Edit shipment:", shipment)
    // Open edit modal/dialog
  }

  const handleDelete = (shipmentId: string) => {
    setShipments(shipments.filter((s) => s.id !== shipmentId))
  }

  const handleStatusUpdate = (shipmentId: string, status: string) => {
    setShipments(
      shipments.map((s) =>
        s.id === shipmentId
          ? {
              ...s,
              status: status as
                | "IN_TRANSIT"
                | "PROCESSING"
                | "DELIVERED"
                | "ON_HOLD"
                | "EXCEPTION"
                | "IN_CUSTOMS"
                | "OUT_FOR_DELIVERY",
            }
          : s,
      ),
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <MSEHeader />

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center gap-2">
              <Shield className="h-8 w-8 text-yellow-600" />
              Admin Portal
            </h1>
            <p className="text-gray-600 mt-2">Manage operations and monitor shipments</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <Button variant="outline" className="border-gray-300 bg-transparent gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="border-gray-300 bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="shipments" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users & Drivers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-6">
            {/* Filters */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by tracking number or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-200 bg-white"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 border-gray-200 bg-white">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="EXCEPTION">Exception</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={modeFilter} onValueChange={setModeFilter}>
                  <SelectTrigger className="w-full md:w-48 border-gray-200 bg-white">
                    <SelectValue placeholder="Filter by Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="AIR">Air</SelectItem>
                    <SelectItem value="LAND">Land</SelectItem>
                    <SelectItem value="WATER">Water</SelectItem>
                    <SelectItem value="MULTIMODAL">Multimodal</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-gray-300 bg-transparent gap-2">
                  <Filter className="h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </Card>

            {/* Table */}
            <AdminShipmentTable
              shipments={filteredShipments}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusUpdate={handleStatusUpdate}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">Users & Drivers Management</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">Total Customers</p>
                    <p className="text-sm text-gray-600">Active users on platform</p>
                  </div>
                  <p className="text-3xl font-bold text-black">2,847</p>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">Total Drivers</p>
                    <p className="text-sm text-gray-600">Verified drivers</p>
                  </div>
                  <p className="text-3xl font-bold text-black">342</p>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">Drivers On Duty</p>
                    <p className="text-sm text-gray-600">Currently working</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">87</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">System Settings</h2>
              <p className="text-gray-600">
                Coming soon: Service areas, pricing tiers, notification settings, and more.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <MSEFooter />
    </main>
  )
}
