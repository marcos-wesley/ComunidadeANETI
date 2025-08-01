# Overview

This is a membership platform for ANETI (Associação Nacional dos Especialistas em TI) - a Brazilian IT professionals association. The platform provides member registration, payment processing, document management, and administrative approval workflows. Built as a full-stack web application with React frontend and Express backend, it features membership tier management, document upload capabilities, and admin dashboard functionality.

# User Preferences

Preferred communication style: Simple, everyday language.

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