"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit2, Trash2, Send } from "lucide-react"
import type { Shipment } from "@/lib/types/global"

interface AdminShipmentTableProps {
  shipments: Shipment[]
  onEdit: (shipment: Shipment) => void
  onDelete: (shipmentId: string) => void
  onStatusUpdate: (shipmentId: string, status: string) => void
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PROCESSING: "bg-blue-100 text-blue-800",
    IN_TRANSIT: "bg-orange-100 text-orange-800",
    IN_CUSTOMS: "bg-purple-100 text-purple-800",
    OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
    DELIVERED: "bg-green-100 text-green-800",
    ON_HOLD: "bg-yellow-100 text-yellow-800",
    EXCEPTION: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

export function AdminShipmentTable({ shipments, onEdit, onDelete, onStatusUpdate }: AdminShipmentTableProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50 border-b border-gray-200">
          <TableRow>
            <TableHead className="font-semibold text-black">Tracking #</TableHead>
            <TableHead className="font-semibold text-black">Customer</TableHead>
            <TableHead className="font-semibold text-black">Status</TableHead>
            <TableHead className="font-semibold text-black">Mode</TableHead>
            <TableHead className="font-semibold text-black">Location</TableHead>
            <TableHead className="font-semibold text-black">Est. Delivery</TableHead>
            <TableHead className="text-right font-semibold text-black">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id} className="border-b border-gray-100 hover:bg-gray-50">
              <TableCell className="font-mono font-semibold text-sm">{shipment.trackingNumber}</TableCell>
              <TableCell className="text-sm text-gray-600">{shipment.userId}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(shipment.status)}>{shipment.status.replace(/_/g, " ")}</Badge>
              </TableCell>
              <TableCell className="text-sm text-gray-600">{shipment.transportMode}</TableCell>
              <TableCell className="text-sm text-gray-600">{shipment.currentCity || "-"}</TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(shipment.estimatedDeliveryDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(shipment)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onStatusUpdate(shipment.id, "IN_TRANSIT")}
                      className="text-yellow-600"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send in Transit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(shipment.id)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
