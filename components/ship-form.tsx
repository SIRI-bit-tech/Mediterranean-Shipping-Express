"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Package, MapPin, Truck, CheckCircle2, Search, ArrowRight, Loader2 } from "lucide-react"

interface GeocodingResult {
  coordinates: {
    latitude: number
    longitude: number
  }
  formattedAddress: string
  confidence: number
}

export function ShipForm() {
  const [step, setStep] = useState(1)
  const [saveDraft, setSaveDraft] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState("--")
  const [createdShipment, setCreatedShipment] = useState<any>(null)
  const [geocodingLoading, setGeocodingLoading] = useState(false)
  const [originCoords, setOriginCoords] = useState<GeocodingResult | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<GeocodingResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [formData, setFormData] = useState({
    contactName: "",
    companyName: "",
    phoneNumber: "",
    email: "",
    searchAddress: "",
    streetAddress: "",
    apt: "",
    city: "",
    state: "",
    zipCode: "",
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientCompany: "",
    recipientAddress: "",
    recipientApt: "",
    recipientCity: "",
    recipientState: "",
    recipientZip: "",
    packageWeight: "",
    packageLength: "",
    packageWidth: "",
    packageHeight: "",
    packageDescription: "",
    serviceType: "STANDARD",
  })

  // Geocode address using GraphHopper
  const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
    try {
      setGeocodingLoading(true)
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        console.warn('Geocoding failed:', data.error)
        return null
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    } finally {
      setGeocodingLoading(false)
    }
  }

  // Handle address search and geocoding
  const handleAddressSearch = async (addressType: 'origin' | 'destination') => {
    const address = addressType === 'origin' 
      ? `${formData.streetAddress}, ${formData.city}, ${formData.state}, ${formData.zipCode}`.replace(/^,\s*/, '').replace(/,\s*$/, '')
      : `${formData.recipientAddress}, ${formData.recipientCity}, ${formData.recipientState}, ${formData.recipientZip}`.replace(/^,\s*/, '').replace(/,\s*$/, '')

    if (!address.trim()) {
      return
    }

    const result = await geocodeAddress(address)
    
    if (result) {
      if (addressType === 'origin') {
        setOriginCoords(result)
        // Update form with formatted address if needed
        if (result.confidence > 0.8) {
          // High confidence - could auto-fill missing fields
        }
      } else {
        setDestinationCoords(result)
        // Update form with formatted address if needed
        if (result.confidence > 0.8) {
          // High confidence - could auto-fill missing fields
        }
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "packageWeight") {
      const weight = Number.parseFloat(value)
      const baseRate = { STANDARD: 2.5, EXPRESS: 5, PRIORITY: 8 }
      if (weight > 0) {
        const rate = baseRate[formData.serviceType as keyof typeof baseRate] || 2.5
        setEstimatedCost((weight * rate).toFixed(2))
      }
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrorMessage("") // Clear any previous errors
    
    try {
      const shipmentData = {
        originAddress: {
          street: formData.streetAddress,
          apt: formData.apt,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          contactName: formData.contactName,
          companyName: formData.companyName,
          phone: formData.phoneNumber,
          email: formData.email
        },
        destinationAddress: {
          street: formData.recipientAddress,
          apt: formData.recipientApt,
          city: formData.recipientCity,
          state: formData.recipientState,
          zipCode: formData.recipientZip,
          contactName: formData.recipientName,
          companyName: formData.recipientCompany,
          phone: formData.recipientPhone,
          email: formData.recipientEmail
        },
        weight: Number.parseFloat(formData.packageWeight),
        dimensions: `${formData.packageLength}x${formData.packageWidth}x${formData.packageHeight}`,
        description: formData.packageDescription,
        transportMode: formData.serviceType === 'PRIORITY' ? 'AIR' : 'LAND',
        packageValue: Number.parseFloat(estimatedCost),
        isInternational: false
      }

      const response = await fetch("/api/shipments", {
        method: "POST",
        credentials: 'include', // Include cookies for authentication
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipmentData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Shipment created:', data)
        setCreatedShipment(data.shipment)
        setStep(4)
      } else {
        const errorData = await response.json()
        console.error('Shipment creation failed:', errorData)
        setErrorMessage(errorData.error || errorData.message || "Failed to create shipment. Please try again.")
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Shipment creation failed:", error)
      setErrorMessage(error instanceof Error ? error.message : "Network error. Please check your connection and try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Form */}
      <div className="lg:col-span-2">
        {step === 1 && (
          <Card className="p-8 bg-white">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                <MapPin className="h-6 w-6 text-yellow-500" />
                Sender Details
              </h2>
              <button className="text-yellow-500 text-sm font-semibold hover:text-yellow-600">
                Load Saved Address
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold mb-2 block text-sm">Contact Name</Label>
                  <Input
                    name="contactName"
                    placeholder="e.g. John Doe"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div>
                  <Label className="text-black font-semibold mb-2 block text-sm">
                    Company Name <span className="text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    name="companyName"
                    placeholder="e.g. MSE Corp"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold mb-2 block text-sm">Phone Number</Label>
                  <Input
                    name="phoneNumber"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
                <div>
                  <Label className="text-black font-semibold mb-2 block text-sm">Email Address</Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-lg font-bold text-black flex items-center gap-2 mb-6">
                  <Package className="h-5 w-5 text-yellow-500" />
                  Pickup Address
                </h3>

                <div className="mb-6">
                  <Label className="text-black font-semibold mb-2 block text-sm">Search Address</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      name="searchAddress"
                      placeholder="Start typing to search address..."
                      value={formData.searchAddress}
                      onChange={handleInputChange}
                      className="pl-10 bg-gray-50 border-gray-200"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-yellow-500">
                      <MapPin className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="col-span-2">
                    <Label className="text-black font-semibold mb-2 block text-sm">Street Address</Label>
                    <Input
                      name="streetAddress"
                      placeholder="123 Logistics Way"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    name="apt"
                    placeholder="Apt / Suite"
                    value={formData.apt}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                  <Input
                    name="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Input
                    name="state"
                    placeholder="NY"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                  <Input
                    name="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="save-address" />
                  <label htmlFor="save-address" className="text-sm text-gray-600">
                    Save this address to my address book
                  </label>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 text-lg"
              >
                Next: Recipient Details <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-8 bg-white">
            <h2 className="text-2xl font-bold text-black flex items-center gap-3 mb-8">
              <MapPin className="h-6 w-6 text-yellow-500" />
              Recipient Details
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="recipientName"
                  placeholder="Recipient Name"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
                <Input
                  name="recipientCompany"
                  placeholder="Company (Optional)"
                  value={formData.recipientCompany}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="recipientPhone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.recipientPhone}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
                <Input
                  name="recipientEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div>
                <Input
                  name="recipientAddress"
                  placeholder="Street Address"
                  value={formData.recipientAddress}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="recipientApt"
                  placeholder="Apt / Suite"
                  value={formData.recipientApt}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
                <Input
                  name="recipientCity"
                  placeholder="City"
                  value={formData.recipientCity}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  name="recipientState"
                  placeholder="State"
                  value={formData.recipientState}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
                <Input
                  name="recipientZip"
                  placeholder="Zip Code"
                  value={formData.recipientZip}
                  onChange={handleInputChange}
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-gray-300 bg-white">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  Next: Package <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8 bg-white">
            <h2 className="text-2xl font-bold text-black flex items-center gap-3 mb-8">
              <Truck className="h-6 w-6 text-yellow-500" />
              Package Details
            </h2>

            <div className="space-y-6">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-red-500 rounded-full flex-shrink-0"></div>
                    <p className="text-red-800 text-sm font-medium">Error creating shipment</p>
                  </div>
                  <p className="text-red-700 text-sm mt-1 ml-6">{errorMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black font-semibold mb-2 block text-sm">Weight (kg)</Label>
                  <Input
                    name="packageWeight"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.packageWeight}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div>
                <Label className="text-black font-semibold mb-2 block text-sm">Dimensions (L × W × H cm)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    name="packageLength"
                    type="number"
                    placeholder="Length"
                    value={formData.packageLength}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                  <Input
                    name="packageWidth"
                    type="number"
                    placeholder="Width"
                    value={formData.packageWidth}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                  <Input
                    name="packageHeight"
                    type="number"
                    placeholder="Height"
                    value={formData.packageHeight}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div>
                <Label className="text-black font-semibold mb-2 block text-sm">Description</Label>
                <textarea
                  name="packageDescription"
                  placeholder="What's in the package?"
                  value={formData.packageDescription}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-500 bg-gray-50 text-black"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-black font-semibold mb-2 block text-sm">Service Type</Label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-yellow-500 bg-gray-50 text-black"
                >
                  <option value="STANDARD">Standard (5-7 days)</option>
                  <option value="EXPRESS">Express (2-3 days)</option>
                  <option value="PRIORITY">Priority (Next day)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1 border-gray-300 bg-white" disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Shipment <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-12 bg-white text-center">
            <CheckCircle2 className="h-20 w-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-black mb-4">Shipment Created!</h2>
            <p className="text-gray-600 mb-8 text-lg">Your shipment has been successfully registered.</p>
            <div className="bg-gray-100 rounded-lg p-8 mb-8 font-mono text-2xl font-bold text-black tracking-wider">
              {createdShipment?.trackingNumber || 'MSE-LOADING...'}
            </div>
            <p className="text-gray-600 mb-8">
              Check your email for confirmation. You can track your package anytime using the tracking number above.
            </p>
            <div className="flex gap-4 flex-col sm:flex-row justify-center">
              <Button
                onClick={() => (window.location.href = `/track?id=${createdShipment?.trackingNumber || ''}`)}
                className="bg-black text-white hover:bg-gray-900 px-8 py-3"
              >
                Track Now
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-gray-300 bg-white px-8 py-3"
              >
                Back to Home
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Right Column - Route Preview & Estimated Cost */}
      <div className="lg:col-span-1">
        <Card className="p-8 bg-white sticky top-4 h-fit">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-yellow-500" />
            ROUTE PREVIEW
          </h3>

          <div className="h-60 bg-gray-200 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Route will appear here</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Origin</p>
            <p className="text-sm text-gray-600">Pending Input...</p>
          </div>

          <div className="mb-6">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Destination</p>
            <p className="text-sm text-gray-600">--</p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100">
            <p className="text-xs text-yellow-600 font-bold uppercase tracking-wider mb-3">Estimated Cost</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-black">{estimatedCost}</span>
              <span className="text-sm text-gray-600">USD</span>
            </div>
            <p className="text-xs text-gray-600">Complete Sender and Recipient details to calculate shipping rates.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
