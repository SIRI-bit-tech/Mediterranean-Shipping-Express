"use client"

/// <reference path="../../lib/types/global.d.ts" />

import { useState, useEffect } from "react"
import { AdminHeader } from "@/components/admin-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminShipmentTable } from "@/components/admin-shipment-table"
import { AdminShipmentEditModal } from "@/components/admin-shipment-edit-modal"
import { AdminAnalytics } from "@/components/admin-analytics"
import { AdminPackageRequests } from "@/components/admin-package-requests"
import { Search, Filter, Download, Shield, Loader2, AlertCircle } from "lucide-react"

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [modeFilter, setModeFilter] = useState("all")
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")
      
      if (!token || !userData) {
        window.location.href = "/admin/auth/login"
        return
      }

      const user = JSON.parse(userData)
      if (user.role !== "ADMIN") {
        window.location.href = "/dashboard"
        return
      }

      // Fetch admin data
      await Promise.all([fetchShipments(), fetchUsers()])
    } catch (err) {
      setError("Failed to load admin data")
      console.error("Admin access error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchShipments = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/shipments", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) throw new Error("Failed to fetch shipments")
      
      const data = await response.json()
      setShipments(data.shipments || [])
    } catch (err) {
      console.error("Error fetching shipments:", err)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) throw new Error("Failed to fetch users")
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  const handlePromoteToDriver = async (userId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "DRIVER" })
      })

      if (!response.ok) throw new Error("Failed to promote user")
      
      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error("Error promoting user:", err)
    }
  }

  const handleDemoteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "CUSTOMER" })
      })

      if (!response.ok) throw new Error("Failed to demote user")
      
      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error("Error demoting user:", err)
    }
  }

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    const matchesMode = modeFilter === "all" || s.transportMode === modeFilter
    return matchesSearch && matchesStatus && matchesMode
  })

  const handleEdit = (shipment: Shipment) => {
    setEditingShipment(shipment)
    setIsEditModalOpen(true)
  }

  const handleSaveShipment = async (updatedData: Partial<Shipment>) => {
    if (!editingShipment) return

    const token = localStorage.getItem("token")
    const response = await fetch(`/api/admin/shipments/${editingShipment.id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update shipment")
    }

    const result = await response.json()
    
    // Update the shipments list with the updated shipment
    setShipments(shipments.map(s => 
      s.id === editingShipment.id ? result.shipment : s
    ))
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingShipment(null)
  }

  const handleDelete = async (shipmentId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/shipments/${shipmentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) throw new Error("Failed to delete shipment")
      
      setShipments(shipments.filter((s) => s.id !== shipmentId))
    } catch (err) {
      console.error("Error deleting shipment:", err)
    }
  }

  const handleStatusUpdate = async (shipmentId: string, status: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/admin/shipments/${shipmentId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error("Failed to update status")
      
      setShipments(
        shipments.map((s) =>
          s.id === shipmentId ? { ...s, status: status as ShipmentStatus } : s
        )
      )
    } catch (err) {
      console.error("Error updating status:", err)
    }
  }

  // Calculate real stats
  const stats = {
    totalCustomers: users.filter(u => u.role === "CUSTOMER").length,
    totalDrivers: users.filter(u => u.role === "DRIVER").length,
    driversOnDuty: users.filter(u => u.role === "DRIVER" && u.isActive).length
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <AdminHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
            <p className="text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
        <MSEFooter />
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <AdminHeader />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 max-w-md text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-black mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = "/admin/auth/login"} className="bg-black text-white hover:bg-gray-900">
              Go to Admin Login
            </Button>
          </Card>
        </div>
        <MSEFooter />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <AdminHeader />

      <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
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
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="shipments" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
            <TabsTrigger value="package-requests">Package Requests</TabsTrigger>
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

          {/* Package Requests Tab */}
          <TabsContent value="package-requests">
            <AdminPackageRequests />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-black mb-4">Users & Drivers Management</h2>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">Total Customers</p>
                    <p className="text-sm text-gray-600">Active users on platform</p>
                  </div>
                  <p className="text-3xl font-bold text-black">{stats.totalCustomers}</p>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">Total Drivers</p>
                    <p className="text-sm text-gray-600">Verified drivers</p>
                  </div>
                  <p className="text-3xl font-bold text-black">{stats.totalDrivers}</p>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">Drivers On Duty</p>
                    <p className="text-sm text-gray-600">Currently working</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{stats.driversOnDuty}</p>
                </div>
              </div>

              {/* User Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-black">User Management</h3>
                  <div className="flex gap-2">
                    <Input placeholder="Search users..." className="w-64" />
                    <Button variant="outline">Search</Button>
                  </div>
                </div>
                
                {/* User List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                      <div>Name</div>
                      <div>Email</div>
                      <div>Role</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  
                  {/* Real Users */}
                  <div className="divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No users found
                      </div>
                    ) : (
                      users.map((user) => (
                        <div key={user.id} className="px-4 py-3">
                          <div className="grid grid-cols-5 gap-4 items-center text-sm">
                            <div className="font-medium text-black">{user.name}</div>
                            <div className="text-gray-600">{user.email}</div>
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.role === "ADMIN" ? "bg-red-100 text-red-800" :
                                user.role === "DRIVER" ? "bg-green-100 text-green-800" :
                                "bg-blue-100 text-blue-800"
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}>
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {user.role === "CUSTOMER" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => handlePromoteToDriver(user.id)}
                                >
                                  Promote to Driver
                                </Button>
                              )}
                              {user.role === "DRIVER" && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs text-red-600"
                                  onClick={() => handleDemoteUser(user.id)}
                                >
                                  Demote to Customer
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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

      {/* Edit Modal */}
      <AdminShipmentEditModal
        shipment={editingShipment}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveShipment}
      />
    </main>
  )
}
