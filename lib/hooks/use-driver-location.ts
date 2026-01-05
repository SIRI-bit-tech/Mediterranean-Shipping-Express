"use client"

// Hook for driver location tracking
import { useEffect, useState } from "react"
import { onDriverLocationUpdate } from "@/lib/socket"
import type { DriverLocation } from "@/lib/types/global"

export function useDriverLocation(driverId: string) {
  const [location, setLocation] = useState<DriverLocation | null>(null)

  useEffect(() => {
    const unsubscribe = onDriverLocationUpdate((data) => {
      if (data.driverId === driverId) {
        setLocation(data)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [driverId])

  return location
}
