# Overview

This is a membership platform for ANETI (Associação Nacional dos Especialistas em TI) - a Brazilian IT professionals association. The platform provides member registration, payment processing, document management, and administrative approval workflows. Built as a full-stack web application with React frontend and Express backend, it features membership tier management, document upload capabilities, and admin dashboard functionality.

## Database Migration Status (August 5, 2025)
**MIGRATION COMPLETED SUCCESSFULLY**
- Successfully migrated 1,864 users from WordPress/BuddyPress legacy system
- Migrated user profiles with complete professional information including areas of expertise, locations, and membership levels
- Created 4 membership plans (Público, Júnior, Pleno, Sênior) based on legacy data
- All users set as active and pre-approved, with marcos.wesley designated as admin
- **PASSWORD MIGRATION COMPLETED**: Successfully restored 1,863 original WordPress password hashes from legacy system
- **LOGIN SYSTEM WORKING**: Implemented WordPress bcrypt hash compatibility and password reset system for migrated users
- **ORDERS MIGRATION 100% COMPLETED**: Successfully imported ALL 2,308 orders with complete payment history and metadata
- Auto-import system implemented - orders import automatically when admin accesses the system (no manual intervention required)
- Order management fully integrated into admin interface with filtering and search capabilities
- **COMPLETE ORDER HISTORY**: 2,132 free orders, 74 completed orders (R$ 9.532,60), 102 pending orders (R$ 17.620,60)
- **TOTAL ORDER VALUE**: R$ 27.153,20 in historical transactions

## Mobile App Status (August 5, 2025)
**SUSPENDED DUE TO EXPO INSTABILITY**
- React Native mobile app development attempted but abandoned due to persistent Expo tunnel connection issues
- Expo server requires constant restarts and QR code rescanning, making development impractical
- User decision: Focus on web platform stability instead of mobile development
- Mobile folder remains but is not actively maintained

# User Preferences

Preferred communication style: Simple, everyday language.
Mobile development: User frustrated with Expo instability - focus on web platform only.
Deployment preference: Prioritize stable web application over mobile features.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query for server state and React Hook Form for form management
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: Uppy library with dashboard interface for document management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **Password Security**: Built-in scrypt hashing with salt for secure password storage
- **API Design**: RESTful endpoints with JSON responses and comprehensive error handling

## Data Storage
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

## Object Storage
- **Provider**: Google Cloud Storage integration for document and file management
- **Access Control**: Custom ACL system with object-level permissions
- **Upload Strategy**: Direct-to-cloud uploads with presigned URLs
- **File Organization**: Structured object paths with access policy metadata

## Authentication & Authorization
- **Session Management**: Server-side sessions with PostgreSQL persistence
- **User Roles**: Role-based access control (member, admin)
- **Approval Workflow**: Manual admin approval required for new member applications
- **Protected Routes**: Client-side route protection with loading states

## Core Data Models
- **Users**: Complete profile information including location and professional area
- **Membership Plans**: Tiered membership system (Público, Pleno, Sênior, Honra, Diretivo)
- **Applications**: Member registration requests with payment and approval tracking
- **Documents**: File attachments linked to applications with cloud storage references

# External Dependencies

## Payment Processing
- Mercado Pago integration for membership fee collection and payment verification

## Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Cloud Storage**: Object storage for documents and file uploads
- **Replit Infrastructure**: Development environment with integrated cloud services

## Development Tools
- **Vite**: Fast development server with hot reload and optimized production builds
- **ESBuild**: High-performance bundling for server-side code
- **Drizzle Kit**: Database schema management and migration tooling