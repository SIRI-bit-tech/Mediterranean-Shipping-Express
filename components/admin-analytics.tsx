"use client"

import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Package, Users, Truck } from "lucide-react"

const deliveryData = [
  { day: "Mon", deliveries: 45 },
  { day: "Tue", deliveries: 52 },
  { day: "Wed", deliveries: 48 },
  { day: "Thu", deliveries: 61 },
  { day: "Fri", deliveries: 55 },
  { day: "Sat", deliveries: 42 },
  { day: "Sun", deliveries: 38 },
]

const statusData = [
  { name: "Delivered", value: 320, color: "#10B981" },
  { name: "In Transit", value: 145, color: "#F59E0B" },
  { name: "Processing", value: 89, color: "#3B82F6" },
  { name: "On Hold", value: 34, color: "#FFB700" },
  { name: "Exception", value: 12, color: "#EF4444" },
]

const revenueData = [
  { month: "Jan", revenue: 12500 },
  { month: "Feb", revenue: 15300 },
  { month: "Mar", revenue: 18200 },
  { month: "Apr", revenue: 21500 },
  { month: "May", revenue: 24100 },
  { month: "Jun", revenue: 27600 },
]

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">Total Shipments</p>
            <p className="text-2xl font-bold text-black mt-1">1,247</p>
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from last month
            </p>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">Delivered This Week</p>
            <p className="text-2xl font-bold text-black mt-1">341</p>
            <p className="text-xs text-gray-500 mt-1">+8 since yesterday</p>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">Active Drivers</p>
            <p className="text-2xl font-bold text-black mt-1">89</p>
            <p className="text-xs text-green-600 mt-1">42 on duty</p>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Truck className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">Avg Delivery Time</p>
            <p className="text-2xl font-bold text-black mt-1">2.3 days</p>
            <p className="text-xs text-gray-500 mt-1">International avg</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Deliveries */}
        <Card className="p-6">
          <h3 className="font-semibold text-black mb-4">Deliveries This Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="day" stroke="#666666" />
              <YAxis stroke="#666666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="deliveries" stroke="#FFB700" strokeWidth={2} dot={{ fill: "#000" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold text-black mb-4">Shipment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-black mb-4">Monthly Revenue</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis dataKey="month" stroke="#666666" />
            <YAxis stroke="#666666" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="revenue" fill="#FFB700" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
