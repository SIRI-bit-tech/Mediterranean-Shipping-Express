"use client"

import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Phone, MessageSquare, MapPin, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Shipment } from "@/lib/types/global"

interface DeliveryDetailPageProps {
  params: { id: string }
}

export default function DeliveryDetailPage({ params }: DeliveryDetailPageProps) {
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock shipment data
  const shipment: Shipment = {
    id: params.id,
    trackingNumber: "1Z999AA10123",
    userId: "cust_1",
    originAddressId: "addr_1",
    destinationAddressId: "addr_2",
    driverId: "driver_123",
    status: "OUT_FOR_DELIVERY",
    transportMode: "LAND",
    currentCity: "Amsterdam",
    currentCountry: "Netherlands",
    currentLatitude: 52.37,
    currentLongitude: 4.89,
    estimatedDeliveryDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    weight: 5.5,
    description: "Office Supplies - Box 1",
    isInternational: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const handleCompleteDelivery = async () => {
    setIsSubmitting(true)
    try {
      await fetch(`/api/shipments/${shipment.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DELIVERED",
          notes,
        }),
      })
      // Redirect to dashboard after success
      window.location.href = "/driver"
    } catch (error) {
      console.error("Failed to complete delivery:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <MSEHeader />

      <div className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link href="/driver" className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Deliveries
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Info */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Tracking Number</p>
                  <p className="font-mono font-semibold text-lg">{shipment.trackingNumber}</p>
                </div>
                <Badge className="bg-orange-100 text-orange-800">OUT FOR DELIVERY</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-600 mb-1">Package</p>
                  <p className="font-semibold text-black">{shipment.description}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Weight</p>
                  <p className="font-semibold text-black">{shipment.weight} kg</p>
                </div>
              </div>

              <hr className="my-6" />

              {/* Delivery Address */}
              <h3 className="font-semibold text-black mb-4">Delivery Address</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">John Smith</p>
                <p className="text-gray-600">Prinsengracht 263-267</p>
                <p className="text-gray-600">1016 HW Amsterdam</p>
                <p className="text-gray-600">Netherlands</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <Phone className="h-4 w-4 text-yellow-500" />
                  <a href="tel:+31612345678" className="text-yellow-600 hover:text-yellow-700">
                    +31 6 1234 5678
                  </a>
                </div>
              </div>
            </Card>

            {/* Delivery Instructions */}
            <Card className="p-6">
              <h3 className="font-semibold text-black mb-4">Delivery Instructions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                Leave package in mailbox. Ring doorbell twice if not home. Do not leave in rain. Customer may sign via
                WhatsApp if not available.
              </div>
            </Card>

            {/* Notes */}
            <Card className="p-6">
              <h3 className="font-semibold text-black mb-4">Delivery Notes</h3>
              <Textarea
                placeholder="Add any delivery notes, issues, or customer feedback..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-24 border-gray-200"
              />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="font-semibold text-black mb-4">Actions</h3>
              <div className="space-y-3">
                <Button
                  className="w-full bg-black text-white hover:bg-gray-900"
                  onClick={() => window.open("https://maps.google.com/?q=52.37,4.89")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open Map
                </Button>
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  onClick={handleCompleteDelivery}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Completing..." : "Mark Delivered"}
                </Button>
                <Button variant="outline" className="w-full border-gray-300 bg-transparent">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Customer
                </Button>
              </div>
            </Card>

            {/* Time Estimate */}
            <Card className="p-6 bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-900 font-semibold">Estimated Time</p>
                  <p className="text-sm text-yellow-800 mt-1">Deliver by 2:30 PM</p>
                  <p className="text-xs text-yellow-700 mt-2">You're on schedule!</p>
                </div>
              </div>
            </Card>

            {/* Customer Contact */}
            <Card className="p-6">
              <h3 className="font-semibold text-black mb-4">Customer</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-black">John Smith</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-black">+31 6 1234 5678</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MSEFooter />
    </main>
  )
}
