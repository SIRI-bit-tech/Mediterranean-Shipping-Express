"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Package,
  MapPin,
  Calendar,
  RotateCcw,
  StopCircle,
  Eye,
  Loader2
} from "lucide-react"

interface PackageRequest {
  id: number
  request_type: string
  status: string
  reason: string
  customer_notes?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  approved_at?: string
  request_data: any
}

interface PackageRequestStatusProps {
  trackingNumber: string
  className?: string
}

export function PackageRequestStatus({ trackingNumber, className = "" }: PackageRequestStatusProps) {
  const [requests, setRequests] = useState<PackageRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRequests()
  }, [trackingNumber])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/package-requests?trackingNumber=${trackingNumber}`)
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.data || [])
      } else {
        setError('Failed to load package requests')
      }
    } catch (error) {
      console.error('Error loading package requests:', error)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'HOLD': return Package
      case 'REDIRECT': return MapPin
      case 'RESCHEDULE': return Calendar
      case 'RETURN': return RotateCcw
      case 'INTERCEPT': return StopCircle
      default: return Package
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'APPROVED': return CheckCircle
      case 'REJECTED': return XCircle
      case 'COMPLETED': return CheckCircle
      case 'CANCELLED': return AlertCircle
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-blue-100 text-blue-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRequestType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRequestDescription = (request: PackageRequest) => {
    const data = request.request_data || {}
    
    switch (request.request_type) {
      case 'HOLD':
        return data.pickupLocationId ? 'Hold at pickup location' : 'Hold package'
      case 'REDIRECT':
        return data.newAddress ? `Redirect to: ${data.newAddress.substring(0, 50)}...` : 'Address change'
      case 'RESCHEDULE':
        return data.newDeliveryDate ? `New date: ${new Date(data.newDeliveryDate).toLocaleDateString()}` : 'Reschedule delivery'
      case 'RETURN':
        return 'Return to sender'
      case 'INTERCEPT':
        return 'Stop delivery'
      default:
        return request.reason || 'Package request'
    }
  }

  if (loading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-gray-600">Loading requests...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-4 text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    )
  }

  if (requests.length === 0) {
    return null // Don't show anything if no requests
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Package Requests</h3>
          <Badge variant="outline" className="text-xs">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="space-y-3">
          {requests.map((request) => {
            const TypeIcon = getRequestTypeIcon(request.request_type)
            const StatusIcon = getStatusIcon(request.status)
            
            return (
              <div
                key={request.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                    <TypeIcon className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">
                      {formatRequestType(request.request_type)} Request
                    </h4>
                    <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {request.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-1">
                    {getRequestDescription(request)}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDate(request.created_at)}
                    </span>
                    
                    {request.admin_notes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          // Could open a detailed view modal
                          alert(request.admin_notes)
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Notes
                      </Button>
                    )}
                  </div>
                  
                  {request.status === 'REJECTED' && request.admin_notes && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                      <strong>Rejection reason:</strong> {request.admin_notes}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}