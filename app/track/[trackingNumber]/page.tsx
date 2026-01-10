"use client"

import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { TrackContent } from "@/components/track-content"

interface TrackingPageProps {
  params: Promise<{ trackingNumber: string }>
}

export default function TrackingDetailPage({ params }: TrackingPageProps) {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <MSEHeader />
      <div className="flex-1">
        <TrackContent />
      </div>
      <MSEFooter />
    </main>
  )
}
