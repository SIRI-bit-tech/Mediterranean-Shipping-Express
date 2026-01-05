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
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-sm font-mono text-gray-600">{shipment.trackingNumber}</p>
            <p className="font-semibold text-black">{shipment.description}</p>
          </div>
        </div>
        <Badge className={getStatusColor(shipment.status)}>{shipment.status.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4 text-yellow-500" />
          <span>{shipment.currentCity || "In Transit"}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Truck className="h-4 w-4 text-yellow-500" />
          <span>{shipment.transportMode}</span>
        </div>
        <div className="col-span-2 flex items-center gap-2 text-gray-600">
          <Calendar className="h-4 w-4 text-yellow-500" />
          <span>Arriving by {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}</span>
        </div>
      </div>

      <button className="w-full mt-4 px-4 py-2 rounded-lg bg-gray-50 text-black font-medium hover:bg-gray-100 transition-colors">
        View Details
      </button>
    </Card>
  )
}
