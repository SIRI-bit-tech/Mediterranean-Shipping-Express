"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react"
import { useTrackingUpdates } from "@/lib/hooks/use-tracking-updates"
import type { TrackingUpdate } from "@/lib/types/global"

interface RealTimeTrackingCardProps {
  trackingNumber: string
  initialStatus?: string
}

export function RealTimeTrackingCard({ trackingNumber, initialStatus = "PROCESSING" }: RealTimeTrackingCardProps) {
  const { tracking, isConnected } = useTrackingUpdates(trackingNumber)
  const [displayData, setDisplayData] = useState<TrackingUpdate | null>(null)

  useEffect(() => {
    if (tracking) {
      setDisplayData(tracking)
    }
  }, [tracking])

  const getStatusIcon = (status: string) => {
    if (status === "DELIVERED") return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (status === "EXCEPTION") return <AlertCircle className="h-5 w-5 text-red-600" />
    return <MapPin className="h-5 w-5 text-yellow-500" />
  }

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Live indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-600 animate-pulse" : "bg-gray-400"}`}></div>
        <span className="text-xs font-semibold text-gray-600">{isConnected ? "LIVE" : "OFFLINE"}</span>
      </div>

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm mb-1">Tracking Number</p>
          <p className="font-mono font-semibold text-lg">{trackingNumber}</p>
        </div>
        <Badge
          className={
            displayData?.status === "DELIVERED" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
          }
        >
          {displayData?.status?.replace(/_/g, " ") || initialStatus}
        </Badge>
      </div>

      <div className="space-y-4">
        {displayData && (
          <>
            <div className="flex items-start gap-3">
              {getStatusIcon(displayData.status)}
              <div className="flex-1">
                <p className="text-sm text-gray-600">Current Location</p>
                <p className="font-semibold text-black">
                  {displayData.city}, {displayData.country}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Updated {new Date(displayData.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {displayData.estimatedDelivery && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Est. Delivery</p>
                <p className="font-semibold text-black">
                  {new Date(displayData.estimatedDelivery).toLocaleDateString()} at{" "}
                  {new Date(displayData.estimatedDelivery).toLocaleTimeString()}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
