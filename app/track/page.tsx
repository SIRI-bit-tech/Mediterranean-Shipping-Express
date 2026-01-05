import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { TrackContent } from "@/components/track-content"
import { Suspense } from "react"

export default function TrackPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <MSEHeader />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <TrackContent />
      </Suspense>
      <MSEFooter />
    </main>
  )
}
