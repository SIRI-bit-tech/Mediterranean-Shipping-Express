"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, MapPin, Calendar, Truck } from "lucide-react"
import type { Shipment, ShipmentStatus } from "@/lib/types/global"

interface TrackingCardProps {
  shipment: Shipment
}

export function TrackingCard({ shipment }: TrackingCardProps) {
  const getStatusColor = (status: ShipmentStatus) => {
    const colors: Record<ShipmentStatus, string> = {
      PROCESSING: "bg-blue-100 text-blue-800",
      IN_TRANSIT: "bg-orange-100 text-orange-800",
      IN_CUSTOMS: "bg-purple-100 text-purple-800",
      OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
      DELIVERED: "bg-green-100 text-green-800",
      ON_HOLD: "bg-yellow-100 text-yellow-800",
      EXCEPTION: "bg-red-100 text-red-800",
    }
    return colors[status]
  }

  const getStatusIcon = () => {
    if (shipment.status === "DELIVERED") return "✓"
    if (shipment.status === "EXCEPTION") return "!"
    return "→"
  }

  return (
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-mono text-gray-600 break-all sm:break-normal">{shipment.trackingNumber}</p>
            <p className="font-semibold text-black text-sm sm:text-base truncate">{shipment.description}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(shipment.status)} text-xs sm:text-sm self-start sm:self-auto flex-shrink-0`}>
          {shipment.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
          <span className="truncate">{shipment.currentCity || "In Transit"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
          <span className="truncate">{shipment.transportMode}</span>
        </div>
        <div className="sm:col-span-2 flex items-center gap-2 text-gray-600">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
          <span className="truncate">Arriving by {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</span>
        </div>
      </div>

      <button className="w-full px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-gray-50 text-black font-medium hover:bg-gray-100 transition-colors text-sm sm:text-base">
        View Details
      </button>
    </Card>
  )
}
