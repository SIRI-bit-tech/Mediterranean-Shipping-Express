"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Clock, Package } from "lucide-react"
import type { Shipment } from "@/lib/types/global"

interface DeliveryListItemProps {
  shipment: Shipment
  onNavigate?: (shipment: Shipment) => void
  onComplete?: (shipmentId: string) => void
}

export function DeliveryListItem({ shipment, onNavigate, onComplete }: DeliveryListItemProps) {
  return (
    <Card className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-lg transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="font-mono text-sm text-gray-600">{shipment.trackingNumber}</p>
            <p className="font-semibold text-black">{shipment.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>{shipment.currentCity || shipment.destinationAddressId}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span>Deliver by 5:00 PM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-2 flex-shrink-0">
        <Badge className="bg-orange-100 text-orange-800">{shipment.status}</Badge>
        <Button size="sm" variant="outline" onClick={() => onNavigate?.(shipment)} className="border-gray-300">
          Navigate
        </Button>
        <Button size="sm" className="bg-black text-white hover:bg-gray-900" onClick={() => onComplete?.(shipment.id)}>
          Delivered
        </Button>
      </div>
    </Card>
  )
}
