"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Package, 
  MapPin, 
  Calendar, 
  RotateCcw, 
  StopCircle,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"

interface PickupLocation {
  id: number
  name: string
  type: string
  street: string
  city: string
  state: string
  country: string
  phone: string
  operating_hours: any
  distance?: number
}

interface PackageRequestModalProps {
  isOpen: boolean
  onClose: () => void
  trackingNumber: string
  currentStatus: string
  onRequestSubmitted?: (request: any) => void
}

type RequestType = 'HOLD' | 'REDIRECT' | 'RESCHEDULE' | 'RETURN' | 'INTERCEPT'

export function PackageRequestModal({
  isOpen,
  onClose,
  trackingNumber,
  currentStatus,
  onRequestSubmitted
}: PackageRequestModalProps) {
  const [requestType, setRequestType] = useState<RequestType | ''>('')
  const [reason, setReason] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Request-specific data
  const [newAddress, setNewAddress] = useState('')
  const [newDeliveryDate, setNewDeliveryDate] = useState('')
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<number | null>(null)
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setRequestType('')
      setReason('')
      setCustomerNotes('')
      setNewAddress('')
      setNewDeliveryDate('')
      setSelectedPickupLocation(null)
      setSubmitStatus('idle')
      setErrorMessage('')
    }
  }, [isOpen])

  // Load pickup locations when HOLD is selected
  useEffect(() => {
    if (requestType === 'HOLD') {
      loadPickupLocations()
    }
  }, [requestType])

  const loadPickupLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch('/api/pickup-locations')
      if (response.ok) {
        const data = await response.json()
        setPickupLocations(data.data || [])
      }
    } catch (error) {
      console.error('Error loading pickup locations:', error)
    } finally {
      setLoadingLocations(false)
    }
  }

  const getRequestTypeIcon = (type: RequestType) => {
    switch (type) {
      case 'HOLD': return Package
      case 'REDIRECT': return MapPin
      case 'RESCHEDULE': return Calendar
      case 'RETURN': return RotateCcw
      case 'INTERCEPT': return StopCircle
      default: return Package
    }
  }

  const getRequestTypeDescription = (type: RequestType) => {
    switch (type) {
      case 'HOLD':
        return 'Hold your package at a pickup location for collection'
      case 'REDIRECT':
        return 'Change the delivery address while package is in transit'
      case 'RESCHEDULE':
        return 'Request a different delivery date and time'
      case 'RETURN':
        return 'Return the package to sender'
      case 'INTERCEPT':
        return 'Stop current delivery and modify instructions (package remains trackable)'
      default:
        return ''
    }
  }

  const isRequestTypeAvailable = (type: RequestType) => {
    // Some request types may not be available for certain statuses
    const unavailableForDelivered = ['HOLD', 'REDIRECT', 'RESCHEDULE', 'INTERCEPT']
    const unavailableForProcessing = ['RETURN']
    
    if (currentStatus === 'DELIVERED' && unavailableForDelivered.includes(type)) {
      return false
    }
    
    if (currentStatus === 'PROCESSING' && unavailableForProcessing.includes(type)) {
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!requestType || !reason.trim()) {
      setErrorMessage('Please select a request type and provide a reason')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Prepare request data based on type
      let requestData: any = {}
      
      switch (requestType) {
        case 'HOLD':
          if (!selectedPickupLocation) {
            setErrorMessage('Please select a pickup location')
            setIsSubmitting(false)
            return
          }
          requestData.pickupLocationId = selectedPickupLocation
          break
        case 'REDIRECT':
          if (!newAddress.trim()) {
            setErrorMessage('Please provide the new delivery address')
            setIsSubmitting(false)
            return
          }
          requestData.newAddress = newAddress.trim()
          break
        case 'RESCHEDULE':
          if (!newDeliveryDate) {
            setErrorMessage('Please select a new delivery date')
            setIsSubmitting(false)
            return
          }
          requestData.newDeliveryDate = newDeliveryDate
          break
      }

      const response = await fetch('/api/package-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: trackingNumber, // Pass tracking number instead of ID
          requestType,
          requestData,
          reason: reason.trim(),
          customerNotes: customerNotes.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        onRequestSubmitted?.(data.data)
        
        // Close modal after short delay
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setErrorMessage(data.error || 'Failed to submit request')
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting package request:', error)
      setErrorMessage('Network error. Please try again.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatOperatingHours = (hours: any) => {
    if (!hours) return 'Hours not available'
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const todayHours = hours[today]
    
    if (todayHours === 'closed') {
      return 'Closed today'
    }
    
    return `Today: ${todayHours || 'Hours not available'}`
  }

  if (submitStatus === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Request Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Your {requestType?.toLowerCase()} request has been submitted successfully. 
              You'll receive updates on the status via email and in your tracking page.
            </p>
            <Button onClick={onClose} className="bg-yellow-500 hover:bg-yellow-600">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Package Request</DialogTitle>
          <DialogDescription>
            Submit a request to modify your package delivery for {trackingNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Request Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['HOLD', 'REDIRECT', 'RESCHEDULE', 'RETURN', 'INTERCEPT'] as RequestType[]).map((type) => {
                const Icon = getRequestTypeIcon(type)
                const available = isRequestTypeAvailable(type)
                
                return (
                  <Card
                    key={type}
                    className={`p-4 cursor-pointer transition-all ${
                      !available 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                        : requestType === type
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => available && setRequestType(type)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${
                        requestType === type ? 'text-yellow-600' : 'text-gray-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          {getRequestTypeDescription(type)}
                        </p>
                        {!available && (
                          <p className="text-xs text-red-500 mt-1">
                            Not available for {currentStatus.toLowerCase()} packages
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Request-specific fields */}
          {requestType === 'HOLD' && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Pickup Location</Label>
              {loadingLocations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading pickup locations...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pickupLocations.map((location) => (
                    <Card
                      key={location.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedPickupLocation === location.id
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPickupLocation(location.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{location.name}</h4>
                          <p className="text-xs text-gray-600">
                            {location.street}, {location.city}, {location.state}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatOperatingHours(location.operating_hours)}
                          </p>
                        </div>
                        {location.distance && (
                          <span className="text-xs text-gray-500">
                            {location.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {requestType === 'REDIRECT' && (
            <div className="space-y-2">
              <Label htmlFor="newAddress">New Delivery Address</Label>
              <Textarea
                id="newAddress"
                placeholder="Enter the complete new delivery address..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {requestType === 'RESCHEDULE' && (
            <div className="space-y-2">
              <Label htmlFor="newDeliveryDate">Preferred Delivery Date</Label>
              <Input
                id="newDeliveryDate"
                type="date"
                value={newDeliveryDate}
                onChange={(e) => setNewDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Request *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="address_change">Address Change</SelectItem>
                <SelectItem value="schedule_conflict">Schedule Conflict</SelectItem>
                <SelectItem value="recipient_unavailable">Recipient Unavailable</SelectItem>
                <SelectItem value="security_concerns">Security Concerns</SelectItem>
                <SelectItem value="package_not_needed">Package Not Needed</SelectItem>
                <SelectItem value="delivery_issues">Delivery Issues</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="customerNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="customerNotes"
              placeholder="Any additional information or special instructions..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !requestType || !reason}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}