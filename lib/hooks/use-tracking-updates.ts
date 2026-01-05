"use client"

// Hook for real-time tracking updates
import { useEffect, useState } from "react"
import { onTrackingUpdate, subscribeToShipment, unsubscribeFromShipment } from "@/lib/socket"
import type { TrackingUpdate } from "@/lib/types/global"

export function useTrackingUpdates(trackingNumber: string) {
  const [tracking, setTracking] = useState<TrackingUpdate | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    subscribeToShipment(trackingNumber)
    setIsConnected(true)

    const unsubscribe = onTrackingUpdate((data) => {
      if (data.trackingNumber === trackingNumber) {
        setTracking(data)
      }
    })

    return () => {
      unsubscribeFromShipment(trackingNumber)
      unsubscribe()
      setIsConnected(false)
    }
  }, [trackingNumber])

  return { tracking, isConnected }
}
