// Application constants and configuration

export const APP_NAME = "Mediterranean Shipping Express"
export const APP_ACRONYM = "MSE"

// Status configurations
export const SHIPMENT_STATUSES = {
  PROCESSING: { label: "Processing", color: "#3B82F6" },
  IN_TRANSIT: { label: "In Transit", color: "#F59E0B" },
  IN_CUSTOMS: { label: "In Customs", color: "#8B5CF6" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#F59E0B" },
  DELIVERED: { label: "Delivered", color: "#10B981" },
  ON_HOLD: { label: "On Hold", color: "#F59E0B" },
  EXCEPTION: { label: "Exception", color: "#EF4444" },
} as const

// Transport modes
export const TRANSPORT_MODES = {
  AIR: { label: "Air Freight", icon: "Plane" },
  LAND: { label: "Ground Transport", icon: "Truck" },
  WATER: { label: "Sea Freight", icon: "Ship" },
  MULTIMODAL: { label: "Multimodal", icon: "Globe" },
} as const

// User roles
export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  DRIVER: "DRIVER",
  ADMIN: "ADMIN",
} as const

// Pagination defaults
export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

// Tracking number prefix
export const TRACKING_NUMBER_PREFIX = "1Z"
export const TRACKING_NUMBER_LENGTH = 12

// Color scheme - MSE Brand
export const COLORS = {
  black: "#000000",
  gold: "#FFB700",
  white: "#FFFFFF",
  offWhite: "#FAFAFA",
  lightGray: "#E5E5E5",
  mediumGray: "#666666",
  darkGray: "#333333",
  successGreen: "#10B981",
  warningOrange: "#F59E0B",
  dangerRed: "#EF4444",
  processingBlue: "#3B82F6",
} as const

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: "/api/auth/register",
  AUTH_LOGIN: "/api/auth/login",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_SESSION: "/api/auth/session",

  // Tracking
  TRACK_PUBLIC: "/api/track",
  TRACKING_TIMELINE: "/api/tracking/:id/timeline",
  TRACKING_LOCATION: "/api/tracking/:id/location",

  // Shipments
  SHIPMENTS: "/api/shipments",
  SHIPMENT_DETAIL: "/api/shipments/:id",
  SHIPMENT_STATUS: "/api/shipments/:id/status",
  SHIPMENT_ASSIGN_DRIVER: "/api/shipments/:id/assign-driver",

  // Driver
  DRIVER_DELIVERIES: "/api/driver/deliveries",
  DRIVER_LOCATION: "/api/driver/location",

  // Admin
  ADMIN_SHIPMENTS: "/api/admin/shipments",
  ADMIN_USERS: "/api/admin/users",
  ADMIN_ANALYTICS: "/api/admin/analytics",
} as const

// Socket.io events
export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  TRACKING_UPDATE: "tracking:update",
  DRIVER_LOCATION: "driver:location",
  STATUS_CHANGED: "shipment:status-changed",
  DELIVERY_COMPLETED: "delivery:completed",
} as const

// Validation constants
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_PATTERN: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TRACKING_NUMBER_PATTERN: /^1Z[A-Z0-9]{10}$/,
} as const

// Feature flags
export const FEATURES = {
  REAL_TIME_TRACKING: true,
  DRIVER_GPS_TRACKING: true,
  MAPBOX_INTEGRATION: true,
  SOCKET_IO_ENABLED: true,
  TWO_FACTOR_AUTH: true,
  SOCIAL_LOGIN: false,
} as const
