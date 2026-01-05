"use client"

import { Card } from "@/components/ui/card"
import { MapPin, CheckCircle2, Clock, TrendingUp } from "lucide-react"

interface DriverStatsProps {
  assignedDeliveries: number
  completedToday: number
  totalDistance: number
  averageRating: number
}

export function DriverStats({ assignedDeliveries, completedToday, totalDistance, averageRating }: DriverStatsProps) {
  const stats = [
    {
      label: "Assigned Today",
      value: assignedDeliveries.toString(),
      icon: Clock,
      color: "text-blue-600",
    },
    {
      label: "Completed",
      value: completedToday.toString(),
      icon: CheckCircle2,
      color: "text-green-600",
    },
    { label: "Distance", value: `${totalDistance} km`, icon: MapPin, color: "text-yellow-600" },
    { label: "Rating", value: averageRating.toFixed(1), icon: TrendingUp, color: "text-purple-600" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <stat.icon className={`h-6 w-6 ${stat.color}`} />
          </div>
          <div>
            <p className="text-gray-600 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-black mt-1">{stat.value}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}
