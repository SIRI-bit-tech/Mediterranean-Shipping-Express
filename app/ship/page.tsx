import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Button } from "@/components/ui/button"
import { ShipForm } from "@/components/ship-form"
import { Suspense } from "react"

function ShipContent() {
  return (
    <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-black mb-2">Create New Shipment</h1>
          <p className="text-gray-600">Draft #MSE-8821</p>
        </div>
        <Button variant="ghost" className="text-gray-600 hover:text-black self-start sm:self-auto">
          Save as Draft
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 sm:mb-12">
        {/* Mobile Progress - Vertical */}
        <div className="sm:hidden space-y-4">
          {[
            { step: 1, label: "SENDER" },
            { step: 2, label: "RECIPIENT" },
            { step: 3, label: "PACKAGE" },
            { step: 4, label: "REVIEW" },
          ].map((item, idx) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-yellow-500 text-black flex-shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-black">{item.label}</p>
              </div>
              {idx < 3 && <div className="w-1 h-8 bg-yellow-500 ml-5 -mt-4"></div>}
            </div>
          ))}
        </div>

        {/* Desktop Progress - Horizontal */}
        <div className="hidden sm:flex items-center justify-between">
          {[
            { step: 1, label: "SENDER" },
            { step: 2, label: "RECIPIENT" },
            { step: 3, label: "PACKAGE" },
            { step: 4, label: "REVIEW" },
          ].map((item, idx) => (
            <div key={item.step} className="flex items-center flex-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm bg-yellow-500 text-black">
                {item.step}
              </div>
              <div className="ml-3">
                <p className="text-xs font-semibold text-black">{item.label}</p>
              </div>
              {idx < 3 && <div className="h-1 flex-1 mx-4 bg-yellow-500" style={{ minWidth: "40px" }}></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <Suspense fallback={<div>Loading form...</div>}>
        <ShipForm />
      </Suspense>
    </div>
  )
}

export default function ShipPage() {
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <MSEHeader />
      <ShipContent />
      <MSEFooter />
    </main>
  )
}
