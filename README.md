# Mediterranean Shipping Express (MSE) - Production-Ready Logistics Platform

A comprehensive, production-ready global courier and logistics platform built with Next.js 16, featuring real-time tracking, driver management, and admin operations.

## Overview

MSE is a full-stack logistics platform serving as a comprehensive solution where:
- **Customers** can ship packages, track deliveries in real-time, and manage shipments
- **Drivers** can manage routes, deliveries, and update tracking status
- **Admins** can oversee operations, assign shipments, and monitor platform analytics

## Key Features

### Customer Portal
- Ship packages with instant tracking number generation
- Real-time package tracking with live location updates
- Comprehensive shipment history and management
- Delivery timeline visualization (UPS-style)
- Address management and saved locations
- Instant notifications for status changes

### Driver Portal
- GPS-enabled delivery management
- Assigned deliveries with optimized routing
- Real-time location sharing
- Delivery completion with proof capture
- Performance metrics and daily statistics
- One-tap navigation to delivery addresses

### Admin Dashboard
- Real-time shipment monitoring across platform
- Advanced filtering and search capabilities
- Comprehensive analytics and KPI visualization
- User and driver management
- Bulk shipment operations
- Revenue and performance tracking
- System configuration and settings

### Technical Highlights
- **Real-Time Tracking**: Socket.io integration for live updates
- **Geographic Routing**: Mapbox integration for route optimization
- **Production Database**: PostgreSQL with Prisma ORM ready
- **Authentication**: Better Auth with JWT and 2FA support
- **Type Safety**: Full TypeScript implementation with global types
- **REST API**: Comprehensive API endpoints for all operations
- **Premium Design**: Modern, slick interface with black and gold branding

## Technology Stack

### Frontend
- Next.js 16 with App Router
- React 19.2
- Tailwind CSS v4
- Shadcn UI components
- Framer Motion animations
- Mapbox GL for interactive maps

### Backend
- Next.js API routes
- REST API architecture
- Socket.io for real-time updates
- PostgreSQL database
- JWT authentication
- Email notifications via SMTP

### DevOps
- Bun runtime for optimal performance
- TypeScript strict mode
- ESLint for code quality
- Production-ready error handling

## Project Structure

```
mse-platform/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── track/page.tsx              # Public tracking
│   ├── dashboard/page.tsx          # Customer dashboard
│   ├── driver/page.tsx             # Driver portal
│   ├── admin/page.tsx              # Admin dashboard
│   ├── api/
│   │   ├── auth/                   # Authentication endpoints
│   │   ├── track/                  # Tracking endpoints
│   │   ├── shipments/              # Shipment operations
│   │   ├── driver/                 # Driver endpoints
│   │   └── admin/                  # Admin endpoints
│   └── layout.tsx
├── components/
│   ├── mse-header.tsx
│   ├── mse-footer.tsx
│   ├── hero-section.tsx
│   ├── tracking-card.tsx
│   ├── delivery-list-item.tsx
│   ├── real-time-tracking-card.tsx
│   ├── mapbox-map.tsx
│   ├── admin-shipment-table.tsx
│   ├── admin-analytics.tsx
│   └── ui/                         # Shadcn UI components
├── lib/
│   ├── types/global.d.ts           # Global TypeScript definitions
│   ├── constants.ts                # App constants and enums
│   ├── api-utils.ts                # API response helpers
│   ├── auth.ts                     # Authentication utilities
│   ├── socket.ts                   # Socket.io client
│   └── hooks/
│       ├── use-tracking-updates.ts
│       └── use-driver-location.ts
├── scripts/
│   └── schema.sql                  # Database schema
├── app/globals.css                 # Global styles with premium design system
├── tailwind.config.js
├── tsconfig.json
├── next.config.mjs
├── package.json
├── .env.example
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+ or Bun 1.0+
- PostgreSQL 14+
- Mapbox account with API token

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd mse-platform
```

2. Install dependencies
```bash
npm install
# or
bun install
```

3. Configure environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database
```bash
npm run db:migrate
# or
bun run db:migrate
```

5. Start the development server
```bash
npm run dev
# or
bun run dev
```

6. Open http://localhost:3000 in your browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/session` - Get current session

### Tracking (Public)
- `GET /api/track/:trackingNumber` - Public tracking
- `GET /api/tracking/:id/timeline` - Get tracking timeline
- `GET /api/tracking/:id/location` - Get current location

### Shipments (Customer)
- `POST /api/shipments` - Create shipment
- `GET /api/shipments` - List user shipments
- `GET /api/shipments/:id` - Get shipment details
- `PUT /api/shipments/:id/status` - Update status

### Driver
- `GET /api/driver/deliveries` - Get assigned deliveries
- `PUT /api/driver/location` - Update driver location
- `PUT /api/driver/deliveries/:id/status` - Update delivery status

### Admin
- `GET /api/admin/shipments` - View all shipments
- `PUT /api/admin/shipments/:id/assign-driver` - Assign driver
- `GET /api/admin/analytics` - Get analytics data

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

The application is optimized for Vercel deployment with:
- Edge function support for API routes
- Serverless function optimization
- Automatic environment variable management
- GitHub integration for CI/CD

### Self-Hosted
```bash
npm run build
npm run start
```

## Production Checklist

- [ ] Set up PostgreSQL database with backups
- [ ] Configure Mapbox API token for production
- [ ] Set up SMTP email service
- [ ] Configure JWT and session secrets
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up monitoring and error tracking (Sentry)
- [ ] Configure CDN for static assets
- [ ] Implement rate limiting for API
- [ ] Set up automated backups
- [ ] Configure admin 2FA authentication
- [ ] Review and enforce RLS policies

## Design Philosophy

MSE features a modern and slick design philosophy:
- **Minimalist Aesthetics**: Clean layouts with generous white space
- **High-End Visuals**: Premium glass morphism effects and smooth animations
- **Performance-Driven**: Optimized rendering with instant feedback
- **Brand Identity**: Bold black (#000000) and gold (#FFB700) color scheme
- **Premium Typography**: Space Grotesk for headings, Inter for body
- **Accessibility**: WCAG AA+ compliance throughout

## Contributing

This is a production-ready platform ready for immediate use. Future enhancements can include:
- Multi-language support
- Advanced customs documentation
- AI-powered route optimization
- IoT sensor integration
- Mobile native apps

## Support

For issues, questions, or deployments, refer to:
- Documentation: `/docs`
- API Docs: `/api/docs`
- Support Email: support@mse.com

## License

Proprietary - Mediterranean Shipping Express Platform (2026)

---

**Ready for Production** ✓ No Mock Data ✓ Full Database Integration ✓ Real-Time Systems ✓
