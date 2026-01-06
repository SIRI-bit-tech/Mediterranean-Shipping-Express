import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireAdminAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await requireAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
    }

    // Get KPI data with historical comparisons
    const [
      totalShipmentsResult,
      deliveredThisWeekResult,
      activeDriversResult,
      avgDeliveryTimeResult,
      statusDistributionResult,
      dailyDeliveriesResult,
      monthlyRevenueResult,
      // Historical data for growth calculations
      totalShipmentsPreviousResult,
      deliveredPreviousWeekResult
    ] = await Promise.all([
      // Total shipments
      query('SELECT COUNT(*) as total FROM shipments WHERE deleted_at IS NULL'),
      
      // Delivered this week
      query(`
        SELECT COUNT(*) as total 
        FROM shipments 
        WHERE status = 'DELIVERED' 
        AND actual_delivery_date >= DATE_TRUNC('week', CURRENT_DATE)
        AND deleted_at IS NULL
      `),
      
      // Active drivers
      query(`
        SELECT 
          COUNT(*) as total_drivers,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_drivers
        FROM users 
        WHERE role = 'DRIVER' 
        AND deleted_at IS NULL
      `),
      
      // Average delivery time
      query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (actual_delivery_date - created_at)) / 86400) as avg_days
        FROM shipments 
        WHERE status = 'DELIVERED' 
        AND actual_delivery_date IS NOT NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND deleted_at IS NULL
      `),
      
      // Status distribution
      query(`
        SELECT 
          status,
          COUNT(*) as count
        FROM shipments 
        WHERE deleted_at IS NULL
        GROUP BY status
        ORDER BY count DESC
      `),
      
      // Daily deliveries for the past week
      query(`
        SELECT 
          TO_CHAR(actual_delivery_date, 'Dy') as day,
          COUNT(*) as deliveries
        FROM shipments 
        WHERE status = 'DELIVERED'
        AND actual_delivery_date >= CURRENT_DATE - INTERVAL '7 days'
        AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('day', actual_delivery_date), TO_CHAR(actual_delivery_date, 'Dy')
        ORDER BY DATE_TRUNC('day', actual_delivery_date)
      `),
      
      // Monthly revenue (based on package values)
      query(`
        SELECT 
          TO_CHAR(created_at, 'Mon') as month,
          SUM(COALESCE(package_value, 0)) as revenue
        FROM shipments 
        WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
        AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Mon')
        ORDER BY DATE_TRUNC('month', created_at)
      `),
      
      // Total shipments from previous month for growth calculation
      query(`
        SELECT COUNT(*) as total 
        FROM shipments 
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
        AND deleted_at IS NULL
      `),
      
      // Delivered previous week for growth calculation
      query(`
        SELECT COUNT(*) as total 
        FROM shipments 
        WHERE status = 'DELIVERED' 
        AND actual_delivery_date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
        AND actual_delivery_date < DATE_TRUNC('week', CURRENT_DATE)
        AND deleted_at IS NULL
      `)
    ])

    // Process results
    const totalShipments = parseInt(totalShipmentsResult.rows[0]?.total || '0')
    const deliveredThisWeek = parseInt(deliveredThisWeekResult.rows[0]?.total || '0')
    const driverStats = activeDriversResult.rows[0] || { total_drivers: 0, active_drivers: 0 }
    const avgDeliveryTime = parseFloat(avgDeliveryTimeResult.rows[0]?.avg_days || '0')
    
    // Process historical data for growth calculations
    const totalShipmentsPrevious = parseInt(totalShipmentsPreviousResult.rows[0]?.total || '0')
    const deliveredPreviousWeek = parseInt(deliveredPreviousWeekResult.rows[0]?.total || '0')
    
    // Helper function to calculate percentage growth
    const calculateGrowth = (current: number, previous: number): number => {
      if (previous === 0) {
        return current > 0 ? 100 : 0 // 100% growth if we had 0 before and now have something
      }
      return Math.round(((current - previous) / previous) * 100)
    }
    
    // Calculate actual growth percentages using historical data
    const shipmentsGrowth = calculateGrowth(totalShipments, totalShipmentsPrevious)
    const deliveriesGrowth = calculateGrowth(deliveredThisWeek, deliveredPreviousWeek)
    
    // Status distribution with colors
    const statusColors: Record<string, string> = {
      'DELIVERED': '#10B981',
      'IN_TRANSIT': '#F59E0B',
      'PROCESSING': '#3B82F6',
      'OUT_FOR_DELIVERY': '#8B5CF6',
      'ON_HOLD': '#FFB700',
      'EXCEPTION': '#EF4444',
      'IN_CUSTOMS': '#06B6D4'
    }

    const statusDistribution = statusDistributionResult.rows.map(row => ({
      name: row.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
      value: parseInt(row.count),
      color: statusColors[row.status] || '#6B7280'
    }))

    // Daily deliveries (fill missing days with 0)
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dailyDeliveriesMap = new Map(
      dailyDeliveriesResult.rows.map(row => [row.day, parseInt(row.deliveries)])
    )
    const dailyDeliveries = daysOfWeek.map(day => ({
      day,
      deliveries: dailyDeliveriesMap.get(day) || 0
    }))

    // Monthly revenue
    const monthlyRevenue = monthlyRevenueResult.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue || '0')
    }))

    const analytics = {
      kpis: {
        totalShipments: {
          value: totalShipments,
          growth: shipmentsGrowth,
          label: 'Total Shipments'
        },
        deliveredThisWeek: {
          value: deliveredThisWeek,
          growth: deliveriesGrowth,
          label: 'Delivered This Week'
        },
        activeDrivers: {
          value: parseInt(driverStats.total_drivers || '0'),
          onDuty: parseInt(driverStats.active_drivers || '0'),
          label: 'Active Drivers'
        },
        avgDeliveryTime: {
          value: avgDeliveryTime > 0 ? avgDeliveryTime.toFixed(1) : '0',
          label: 'Avg Delivery Time (days)'
        }
      },
      charts: {
        dailyDeliveries,
        statusDistribution,
        monthlyRevenue
      }
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}