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
    <Card className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 hover:shadow-lg transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs sm:text-sm text-gray-600 break-all">{shipment.trackingNumber}</p>
            <p className="font-semibold text-black text-sm sm:text-base truncate">{shipment.description}</p>
          </div>
          <Badge className="bg-orange-100 text-orange-800 text-xs flex-shrink-0">{shipment.status}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm mb-3 sm:mb-0">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
            <span className="truncate">{shipment.currentCity || shipment.destinationAddressId}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
            <span className="truncate">+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Deliver by 5:00 PM</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => onNavigate?.(shipment)} 
          className="border-gray-300 flex-1 sm:flex-none text-xs sm:text-sm"
        >
          Navigate
        </Button>
        <Button 
          size="sm" 
          className="bg-black text-white hover:bg-gray-900 flex-1 sm:flex-none text-xs sm:text-sm" 
          onClick={() => onComplete?.(shipment.id)}
        >
          Delivered
        </Button>
      </div>
    </Card>
  )
}
