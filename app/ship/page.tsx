import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Button } from "@/components/ui/button"
import { ShipForm } from "@/components/ship-form"
import { Suspense } from "react"

function ShipContent() {
  return (
    <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-black mb-2">Create New Shipment</h1>
          <p className="text-gray-600">Draft #MSE-8821</p>
        </div>
        <Button variant="ghost" className="text-gray-600 hover:text-black">
          Save as Draft
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-12 flex items-center justify-between">
        {[
          { step: 1, label: "SENDER" },
          { step: 2, label: "RECIPIENT" },
          { step: 3, label: "PACKAGE" },
          { step: 4, label: "REVIEW" },
        ].map((item, idx) => (
          <div key={item.step} className="flex items-center flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm bg-yellow-500 text-black`}
            >
              {item.step}
            </div>
            <div className="ml-3">
              <p className="text-xs font-semibold text-black">{item.label}</p>
            </div>
            {idx < 3 && <div className="h-1 flex-1 mx-4 bg-yellow-500" style={{ minWidth: "40px" }}></div>}
          </div>
        ))}
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
