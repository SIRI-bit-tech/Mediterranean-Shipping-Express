"use client"

import { AdminPackageRequests } from "@/components/admin-package-requests"

export default function AdminPackageRequestsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Package Request Management</h1>
        <p className="text-gray-600 mt-2">
          Review and manage customer package requests
        </p>
      </div>
      
      <AdminPackageRequests />
    </div>
  )
}