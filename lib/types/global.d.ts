// Global type definitions for MSE (Mediterranean Shipping Express)

declare global {
  // User roles
  type UserRole = "CUSTOMER" | "DRIVER" | "ADMIN"

  // Shipment status types
  type ShipmentStatus =
    | "PROCESSING"
    | "IN_TRANSIT"
    | "IN_CUSTOMS"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "ON_HOLD"
    | "EXCEPTION"

  // Transport modes
  type TransportMode = "AIR" | "LAND" | "WATER" | "MULTIMODAL"

  // User entity
  interface User {
    id: string
    email: string
    name: string
    phone: string
    role: UserRole
    profileImage?: string
    isVerified: boolean
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }

  // Address entity
  interface Address {
    id: string
    userId: string
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    latitude: number
    longitude: number
    isDefault: boolean
    createdAt: Date
    updatedAt: Date
  }

  // Shipment entity
  interface Shipment {
    id: string
    trackingNumber: string
    userId: string
    originAddressId: string
    destinationAddressId: string
    driverId?: string
    status: ShipmentStatus
    transportMode: TransportMode
    currentLocation?: string
    currentCity?: string
    currentCountry?: string
    currentLatitude?: number
    currentLongitude?: number
    estimatedDeliveryDate: Date
    actualDeliveryDate?: Date
    weight: number
    dimensions?: string
    description: string
    packageValue?: number
    specialHandling?: string
    onHoldReason?: string
    isInternational: boolean
    customsStatus?: string
    createdAt: Date
    updatedAt: Date
  }

  // Tracking event/checkpoint
  interface TrackingCheckpoint {
    id: string
    shipmentId: string
    status: ShipmentStatus
    location: string
    city: string
    country: string
    latitude: number
    longitude: number
    timestamp: Date
    notes?: string
  }

  // Delivery proof
  interface DeliveryProof {
    id: string
    shipmentId: string
    signatureImage?: string
    photoProof?: string
    notes?: string
    driverId: string
    timestamp: Date
  }

  // Notification
  interface Notification {
    id: string
    userId: string
    shipmentId?: string
    title: string
    message: string
    type: "STATUS_UPDATE" | "DELIVERY" | "EXCEPTION" | "ADMIN_ALERT"
    isRead: boolean
    createdAt: Date
  }

  // API Response types
  interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    code?: string
  }

  interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }

  // Real-time socket events
  interface TrackingUpdate {
    shipmentId: string
    trackingNumber: string
    status: ShipmentStatus
    location: string
    city: string
    country: string
    latitude: number
    longitude: number
    timestamp: Date
    estimatedDelivery?: Date
  }

  interface DriverLocation {
    driverId: string
    latitude: number
    longitude: number
    timestamp: Date
    accuracy?: number
  }
}

export {}
