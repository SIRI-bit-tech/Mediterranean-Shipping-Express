"use client"

import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { Phone, MessageSquare, MapPin, Clock, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface DeliveryData {
  id: string
  trackingNumber: string
  userId: string
  originAddressId: string
  destinationAddressId: string
  driverId: string
  status: string
  transportMode: string
  currentLocation?: string
  currentCity?: string
  currentCountry?: string
  currentLatitude?: number
  currentLongitude?: number
  estimatedDeliveryDate: string
  actualDeliveryDate?: string
  weight: number
  dimensions?: string
  description: string
  packageValue?: number
  specialHandling?: string
  onHoldReason?: string
  isInternational: boolean
  customsStatus?: string
  createdAt: string
  updatedAt: string
  customer: {
    name: string
    phone: string
  }
  destinationAddress: {
    street: string
    city: string
    state?: string
    country: string
    postalCode: string
    latitude?: number
    longitude?: number
  }
}

interface DeliveryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DeliveryDetailPage({ params }: DeliveryDetailPageProps) {
  const { id } = await params
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryDetails()
  }, [params.id])

  const fetchDeliveryDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/auth/login'
        return
      }

      const response = await fetch(`/api/driver/deliveries/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/auth/login'
          return
        }
        throw new Error('Failed to fetch delivery details')
      }

      const data = await response.json()
      if (data.success) {
        setDelivery(data.delivery)
      } else {
        throw new Error(data.error || 'Failed to fetch delivery details')
      }
    } catch (error) {
      console.error('Error fetching delivery:', error)
      setError(error instanceof Error ? error.message : 'Failed to load delivery details')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteDelivery = async () => {
    if (!delivery) return
    
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shipments/${delivery.id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "DELIVERED",
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update delivery status')
      }

      // Redirect to dashboard after success
      window.location.href = "/driver"
    } catch (error) {
      console.error("Failed to complete delivery:", error)
      alert("Failed to complete delivery. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'OUT_FOR_DELIVERY': { label: 'OUT FOR DELIVERY', className: 'bg-orange-100 text-orange-800' },
      'IN_TRANSIT': { label: 'IN TRANSIT', className: 'bg-blue-100 text-blue-800' },
      'DELIVERED': { label: 'DELIVERED', className: 'bg-green-100 text-green-800' },
      'PENDING': { label: 'PENDING', className: 'bg-yellow-100 text-yellow-800' },
    }
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  }

  const formatDeliveryTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <MSEHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading delivery details...</span>
          </div>
        </div>
        <MSEFooter />
      </main>
    )
  }

  if (error || !delivery) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <MSEHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Delivery not found'}</p>
            <Link href="/driver" className="text-yellow-600 hover:text-yellow-700">
              ← Back to Deliveries
            </Link>
          </div>
        </div>
        <MSEFooter />
      </main>
    )
  }

  const statusInfo = getStatusBadge(delivery.status)

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
                  <p className="font-mono font-semibold text-lg">{delivery.trackingNumber}</p>
                </div>
                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-gray-600 mb-1">Package</p>
                  <p className="font-semibold text-black">{delivery.description}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Weight</p>
                  <p className="font-semibold text-black">{delivery.weight} kg</p>
                </div>
                {delivery.dimensions && (
                  <div>
                    <p className="text-gray-600 mb-1">Dimensions</p>
                    <p className="font-semibold text-black">{delivery.dimensions}</p>
                  </div>
                )}
                {delivery.packageValue && (
                  <div>
                    <p className="text-gray-600 mb-1">Value</p>
                    <p className="font-semibold text-black">${delivery.packageValue}</p>
                  </div>
                )}
              </div>

              <hr className="my-6" />

              {/* Delivery Address */}
              <h3 className="font-semibold text-black mb-4">Delivery Address</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">{delivery.customer.name}</p>
                <p className="text-gray-600">{delivery.destinationAddress.street}</p>
                <p className="text-gray-600">
                  {delivery.destinationAddress.city}
                  {delivery.destinationAddress.state && `, ${delivery.destinationAddress.state}`} {delivery.destinationAddress.postalCode}
                </p>
                <p className="text-gray-600">{delivery.destinationAddress.country}</p>
                {delivery.customer.phone && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Phone className="h-4 w-4 text-yellow-500" />
                    <a href={`tel:${delivery.customer.phone}`} className="text-yellow-600 hover:text-yellow-700">
                      {delivery.customer.phone}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Delivery Instructions */}
            {delivery.specialHandling && (
              <Card className="p-6">
                <h3 className="font-semibold text-black mb-4">Special Handling Instructions</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                  {delivery.specialHandling}
                </div>
              </Card>
            )}

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
                  onClick={() => {
                    const lat = delivery.destinationAddress.latitude || delivery.currentLatitude
                    const lng = delivery.destinationAddress.longitude || delivery.currentLongitude
                    if (lat && lng) {
                      window.open(`https://maps.google.com/?q=${lat},${lng}`)
                    } else {
                      const address = `${delivery.destinationAddress.street}, ${delivery.destinationAddress.city}, ${delivery.destinationAddress.country}`
                      window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`)
                    }
                  }}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Open Map
                </Button>
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  onClick={handleCompleteDelivery}
                  disabled={isSubmitting || delivery.status === 'DELIVERED'}
                >
                  {isSubmitting ? "Completing..." : delivery.status === 'DELIVERED' ? "Already Delivered" : "Mark Delivered"}
                </Button>
                {delivery.customer.phone && (
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-300 bg-transparent"
                    onClick={() => window.open(`tel:${delivery.customer.phone}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Customer
                  </Button>
                )}
              </div>
            </Card>

            {/* Time Estimate */}
            <Card className="p-6 bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-yellow-900 font-semibold">Estimated Delivery</p>
                  <p className="text-sm text-yellow-800 mt-1">
                    {formatDeliveryTime(delivery.estimatedDeliveryDate)}
                  </p>
                  <p className="text-xs text-yellow-700 mt-2">
                    {new Date(delivery.estimatedDeliveryDate) > new Date() ? "On schedule!" : "Past due"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Customer Contact */}
            <Card className="p-6">
              <h3 className="font-semibold text-black mb-4">Customer</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-black">{delivery.customer.name}</p>
                </div>
                {delivery.customer.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-black">{delivery.customer.phone}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MSEFooter />
    </main>
  )
}
