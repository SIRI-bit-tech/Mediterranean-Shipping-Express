"use client"

import { useState, useEffect } from "react"
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
import { TrendingUp, Package, Users, Truck, Loader2, AlertCircle } from "lucide-react"

interface AnalyticsData {
  kpis: {
    totalShipments: {
      value: number
      growth: number
      label: string
    }
    deliveredThisWeek: {
      value: number
      growth: number
      label: string
    }
    activeDrivers: {
      value: number
      onDuty: number
      label: string
    }
    avgDeliveryTime: {
      value: string
      label: string
    }
  }
  charts: {
    dailyDeliveries: Array<{ day: string; deliveries: number }>
    statusDistribution: Array<{ name: string; value: number; color: string }>
    monthlyRevenue: Array<{ month: string; revenue: number }>
  }
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      } else {
        throw new Error(data.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error || 'Failed to load analytics'}</p>
          <button 
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">{analytics.kpis.totalShipments.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{analytics.kpis.totalShipments.value.toLocaleString()}</p>
            {analytics.kpis.totalShipments.growth !== 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                analytics.kpis.totalShipments.growth > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {analytics.kpis.totalShipments.growth > 0 ? '+' : ''}{analytics.kpis.totalShipments.growth}% from last month
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">{analytics.kpis.deliveredThisWeek.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{analytics.kpis.deliveredThisWeek.value}</p>
            {analytics.kpis.deliveredThisWeek.growth > 0 && (
              <p className="text-xs text-green-600 mt-1">+{analytics.kpis.deliveredThisWeek.growth} since yesterday</p>
            )}
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <Users className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">{analytics.kpis.activeDrivers.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{analytics.kpis.activeDrivers.value}</p>
            <p className="text-xs text-green-600 mt-1">{analytics.kpis.activeDrivers.onDuty} on duty</p>
          </div>
        </Card>

        <Card className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Truck className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm">{analytics.kpis.avgDeliveryTime.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{analytics.kpis.avgDeliveryTime.value}</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Deliveries */}
        <Card className="p-6">
          <h3 className="font-semibold text-black mb-4">Deliveries This Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.charts.dailyDeliveries}>
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
                data={analytics.charts.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.charts.statusDistribution.map((entry, index) => (
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
        <h3 className="font-semibold text-black mb-4">Monthly Revenue (Package Values)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.charts.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis dataKey="month" stroke="#666666" />
            <YAxis stroke="#666666" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E5E5",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
            />
            <Bar dataKey="revenue" fill="#FFB700" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
