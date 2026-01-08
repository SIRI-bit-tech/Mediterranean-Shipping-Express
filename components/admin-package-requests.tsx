"use client"

import React, { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Package, 
  MapPin, 
  Calendar, 
  RotateCcw, 
  StopCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
  Loader2
} from "lucide-react"

interface PackageRequest {
  id: number
  shipment_id: number
  tracking_number: string
  request_type: string
  status: string
  reason: string
  customer_notes?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  user_name?: string
  user_email?: string
  approved_by_name?: string
  request_data: any
}

interface AdminPackageRequestsProps {
  className?: string
}

export function AdminPackageRequests({ className = "" }: AdminPackageRequestsProps) {
  const [requests, setRequests] = useState<PackageRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PackageRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/package-requests')
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data.data || [])
      }
    } catch (error) {
      console.error('Error loading package requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (requestId: number, action: 'APPROVE' | 'REJECT') => {
    try {
      setActionLoading(requestId)
      
      const response = await fetch(`/api/package-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminNotes: adminNotes.trim() || undefined
        })
      })

      if (response.ok) {
        await loadRequests() // Refresh the list
        setShowDetailModal(false)
        setAdminNotes('')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating package request:', error)
      alert('Network error. Please try again.')
    } finally {
      setActionLoading(null)
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
        return 'Hold at pickup location'
      case 'REDIRECT':
        return data.newAddress ? `New address: ${data.newAddress}` : 'Address change requested'
      case 'RESCHEDULE':
        return data.newDeliveryDate ? `New date: ${new Date(data.newDeliveryDate).toLocaleDateString()}` : 'Reschedule requested'
      case 'RETURN':
        return 'Return to sender'
      case 'INTERCEPT':
        return 'Stop delivery'
      default:
        return request.reason || 'Package request'
    }
  }

  const pendingRequests = requests.filter(r => r.status === 'PENDING')
  const otherRequests = requests.filter(r => r.status !== 'PENDING')

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading package requests...</span>
        </div>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Pending Requests - Priority Section */}
      {pendingRequests.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Pending Requests</h3>
            <Badge variant="destructive">
              {pendingRequests.length} awaiting review
            </Badge>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const TypeIcon = getRequestTypeIcon(request.request_type)
              
              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border">
                      <TypeIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">
                          {request.request_type.charAt(0) + request.request_type.slice(1).toLowerCase()} Request
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {request.tracking_number}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {getRequestDescription(request)}
                      </p>
                      <p className="text-xs text-gray-500">
                        By {request.user_name || request.user_email} • {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowDetailModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleAction(request.id, 'APPROVE')}
                      disabled={actionLoading === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAction(request.id, 'REJECT')}
                      disabled={actionLoading === request.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* All Requests Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">All Package Requests</h3>
          <Badge variant="outline">
            {requests.length} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const TypeIcon = getRequestTypeIcon(request.request_type)
              const StatusIcon = getStatusIcon(request.status)
              
              return (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {request.request_type.charAt(0) + request.request_type.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {request.tracking_number}
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.user_name || request.user_email}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(request.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request)
                        setShowDetailModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Package Request Details</DialogTitle>
            <DialogDescription>
              Review and manage package request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Request Type</label>
                  <p className="text-sm">
                    {selectedRequest.request_type.charAt(0) + selectedRequest.request_type.slice(1).toLowerCase()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={`text-xs ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                  <p className="text-sm font-mono">{selectedRequest.tracking_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-sm">{selectedRequest.user_name || selectedRequest.user_email}</p>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <label className="text-sm font-medium text-gray-500">Request Details</label>
                <p className="text-sm mt-1">{getRequestDescription(selectedRequest)}</p>
              </div>

              {/* Customer Notes */}
              {selectedRequest.customer_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Notes</label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedRequest.customer_notes}</p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.status === 'PENDING' && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Notes (Optional)</label>
                  <Textarea
                    placeholder="Add notes about this request..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Existing Admin Notes */}
              {selectedRequest.admin_notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                  <p className="text-sm mt-1 p-3 bg-blue-50 rounded">{selectedRequest.admin_notes}</p>
                </div>
              )}

              {/* Actions */}
              {selectedRequest.status === 'PENDING' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction(selectedRequest.id, 'REJECT')}
                    disabled={actionLoading === selectedRequest.id}
                  >
                    {actionLoading === selectedRequest.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleAction(selectedRequest.id, 'APPROVE')}
                    disabled={actionLoading === selectedRequest.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading === selectedRequest.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}