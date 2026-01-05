"use client"

import { Package, TrendingUp, MapPin, Truck } from "lucide-react"

const steps = [
  {
    number: "1",
    title: "Book",
    description: "Get a quote and create your shipment in seconds",
    icon: Package,
  },
  {
    number: "2",
    title: "Pack",
    description: "We pick up and securely pack your items",
    icon: TrendingUp,
  },
  {
    number: "3",
    title: "Track",
    description: "Monitor your shipment in real-time every step of the way",
    icon: MapPin,
  },
  {
    number: "4",
    title: "Deliver",
    description: "Swift arrival at the destination with signature",
    icon: Truck,
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-4xl font-bold text-black text-center mb-16">How It Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-2 border-gray-300 flex items-center justify-center mb-6 bg-white relative">
                  <Icon className="h-8 w-8 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-500 text-black font-bold rounded-full flex items-center justify-center text-sm">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-black mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
