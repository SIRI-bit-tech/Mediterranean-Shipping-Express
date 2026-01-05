"use client"

import { Plane, Ship, Truck } from "lucide-react"
import Link from "next/link"

const services = [
  {
    title: "Air Freight",
    description: "Rapid express international shipping for time-sensitive deliveries across the globe.",
    icon: Plane,
    tags: ["Express", "Global"],
    image: "https://images.unsplash.com/photo-1586528116577-c245efdd3b14?w=400&h=300&fit=crop",
  },
  {
    title: "Ocean Cargo",
    description: "Cost-effective bulk shipping solutions for large volume international trade.",
    icon: Ship,
    tags: ["Standard", "Bulk"],
    image: "https://images.unsplash.com/photo-1578674387511-f90e939bbbdb?w=400&h=300&fit=crop",
  },
  {
    title: "Ground Transport",
    description: "Reliable regional logistics and last-mile delivery services for businesses.",
    icon: Truck,
    tags: ["Regional", "Door-to-Door"],
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop",
  },
]

export function ServicesSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16">
          <p className="text-yellow-500 font-semibold mb-2">OUR SERVICES</p>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Logistics Solutions for Every Need</h2>
          <Link href="/services" className="text-gray-600 hover:text-yellow-500 font-semibold">
            View All Services →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, idx) => {
            const Icon = service.icon
            return (
              <div
                key={idx}
                className="rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 bg-white"
              >
                {/* Image */}
                <div
                  className="h-48 bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url(${service.image})`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-black">{service.title}</h3>
                    <Icon className="h-6 w-6 text-yellow-500" />
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {service.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
