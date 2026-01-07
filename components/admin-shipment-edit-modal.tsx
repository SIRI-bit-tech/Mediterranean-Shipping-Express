"use client"

/// <reference path="../lib/types/global.d.ts" />

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MapPin, Package, Truck } from "lucide-react"

interface AdminShipmentEditModalProps {
  shipment: Shipment | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedShipment: Partial<Shipment>) => Promise<void>
}

export function AdminShipmentEditModal({ shipment, isOpen, onClose, onSave }: AdminShipmentEditModalProps) {
  const [formData, setFormData] = useState<Partial<Shipment>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (shipment) {
      setFormData({
        status: shipment.status,
        transportMode: shipment.transportMode,
        currentLocation: shipment.currentLocation || "",
        currentCity: shipment.currentCity || "",
        currentCountry: shipment.currentCountry || "",
        currentLatitude: shipment.currentLatitude || 0,
        currentLongitude: shipment.currentLongitude || 0,
        estimatedDeliveryDate: shipment.estimatedDeliveryDate,
        description: shipment.description,
        weight: shipment.weight,
        dimensions: shipment.dimensions || "",
        packageValue: shipment.packageValue || 0,
        specialHandling: shipment.specialHandling || "",
        onHoldReason: shipment.onHoldReason || "",
        customsStatus: shipment.customsStatus || ""
      })
      setError("")
    }
  }, [shipment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shipment) return

    setLoading(true)
    setError("")

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shipment")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Shipment, value: any) => {
    setFormData((prev: Partial<Shipment>) => ({ ...prev, [field]: value }))
  }

  if (!shipment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Shipment: {shipment.trackingNumber}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Status and Transport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="IN_CUSTOMS">In Customs</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="EXCEPTION">Exception</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportMode">Transport Mode</Label>
              <Select
                value={formData.transportMode}
                onValueChange={(value) => handleInputChange("transportMode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transport mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AIR">Air</SelectItem>
                  <SelectItem value="LAND">Land</SelectItem>
                  <SelectItem value="WATER">Water</SelectItem>
                  <SelectItem value="MULTIMODAL">Multimodal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5" />
              Current Location
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentCity">Current City</Label>
                <Input
                  id="currentCity"
                  value={formData.currentCity || ""}
                  onChange={(e) => handleInputChange("currentCity", e.target.value)}
                  placeholder="e.g., New York"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentCountry">Current Country</Label>
                <Input
                  id="currentCountry"
                  value={formData.currentCountry || ""}
                  onChange={(e) => handleInputChange("currentCountry", e.target.value)}
                  placeholder="e.g., United States"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentLocation">Current Location Description</Label>
              <Input
                id="currentLocation"
                value={formData.currentLocation || ""}
                onChange={(e) => handleInputChange("currentLocation", e.target.value)}
                placeholder="e.g., JFK Airport Terminal 4"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentLatitude">Latitude</Label>
                <Input
                  id="currentLatitude"
                  type="number"
                  step="any"
                  value={formData.currentLatitude || ""}
                  onChange={(e) => handleInputChange("currentLatitude", parseFloat(e.target.value) || 0)}
                  placeholder="40.6413"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentLongitude">Longitude</Label>
                <Input
                  id="currentLongitude"
                  type="number"
                  step="any"
                  value={formData.currentLongitude || ""}
                  onChange={(e) => handleInputChange("currentLongitude", parseFloat(e.target.value) || 0)}
                  placeholder="-73.7781"
                />
              </div>
            </div>
          </div>

          {/* Package Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Truck className="h-5 w-5" />
              Package Details
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Package description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight || ""}
                  onChange={(e) => handleInputChange("weight", parseFloat(e.target.value) || 0)}
                  placeholder="5.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions</Label>
                <Input
                  id="dimensions"
                  value={formData.dimensions || ""}
                  onChange={(e) => handleInputChange("dimensions", e.target.value)}
                  placeholder="30x20x15 cm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageValue">Value ($)</Label>
                <Input
                  id="packageValue"
                  type="number"
                  step="0.01"
                  value={formData.packageValue || ""}
                  onChange={(e) => handleInputChange("packageValue", parseFloat(e.target.value) || 0)}
                  placeholder="150.00"
                />
              </div>
            </div>
          </div>

          {/* Special Handling & Status Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="specialHandling">Special Handling Instructions</Label>
              <Textarea
                id="specialHandling"
                value={formData.specialHandling || ""}
                onChange={(e) => handleInputChange("specialHandling", e.target.value)}
                placeholder="Fragile, Keep upright, etc."
                rows={2}
              />
            </div>

            {formData.status === "ON_HOLD" && (
              <div className="space-y-2">
                <Label htmlFor="onHoldReason">On Hold Reason</Label>
                <Textarea
                  id="onHoldReason"
                  value={formData.onHoldReason || ""}
                  onChange={(e) => handleInputChange("onHoldReason", e.target.value)}
                  placeholder="Reason for holding the shipment"
                  rows={2}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customsStatus">Customs Status</Label>
              <Input
                id="customsStatus"
                value={formData.customsStatus || ""}
                onChange={(e) => handleInputChange("customsStatus", e.target.value)}
                placeholder="Cleared, Pending, Under Review"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedDeliveryDate">Estimated Delivery Date</Label>
              <Input
                id="estimatedDeliveryDate"
                type="datetime-local"
                value={formData.estimatedDeliveryDate ? new Date(formData.estimatedDeliveryDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => handleInputChange("estimatedDeliveryDate", new Date(e.target.value))}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-black text-white hover:bg-gray-900">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}