# Tiranga Pro - Color Trading Game

## Overview

Tiranga Pro is a full-stack web application built as a color trading game with an Indian theme. The application features a React frontend with a modern UI built using shadcn/ui components, and an Express.js backend with PostgreSQL database integration using Drizzle ORM. The project is structured as a monorepo with shared schema definitions and follows a clean separation between client, server, and shared code.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: React Router for client-side navigation
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage with planned database integration
- **API Structure**: RESTful API with `/api` prefix for all endpoints

### Development Environment
- **Package Manager**: npm with package-lock.json
- **TypeScript Configuration**: Shared tsconfig.json with path aliases
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend hot reload
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation

## Key Components

### Authentication System
- Login/Register functionality with form validation
- PostgreSQL database integration with Drizzle ORM
- User authentication and registration system
- Database storage for user accounts and data

### Game Engine
- Color trading game with 3-minute rounds
- Real-time countdown timer
- Betting system with balance management
- Game history tracking and result display
- Random outcome generation for color selection

### Wallet System
- Balance management with deposit/withdrawal functionality
- Transaction history tracking
- UPI integration placeholder for payments
- Minimum deposit limits and validation

### UI Components
- Comprehensive shadcn/ui component library
- Responsive design with mobile-first approach
- Toast notifications for user feedback
- Loading states and error handling
- Dark/light theme support (configured but not actively used)

## Data Flow

### Client-Side Data Flow
1. User authentication through AuthScreen component
2. Dashboard routing based on authentication state
3. Local storage for user data and game state persistence
4. React Query for future API integration
5. Component state management for real-time game updates

### Server-Side Data Flow
1. Express middleware for request logging and JSON parsing
2. Route registration through modular route system
3. Storage interface abstraction for database operations
4. Error handling middleware for consistent error responses
5. Planned database integration through Drizzle ORM

### Database Schema
- Users table with authentication fields (username, password)
- Drizzle schema definitions in shared directory
- PostgreSQL dialect with Neon database configuration
- Migration support through drizzle-kit

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **@radix-ui/react-***: Primitive UI components
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Backend bundling for production
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development plugins

### UI and Styling
- **class-variance-authority**: Component variant management
- **clsx**: Conditional class name utility
- **tailwind-merge**: Tailwind class merging utility
- **lucide-react**: Icon library

## Deployment Strategy

### Development Environment
- Vite development server on frontend with HMR
- Express server with tsx for TypeScript hot reload
- Environment variable configuration for database URL
- Replit-specific plugins for development experience

### Production Build
- Frontend: Vite build process outputting to `dist/public`
- Backend: esbuild compilation to `dist/index.js`
- Single deployment artifact with static file serving
- Environment variable configuration for production database

### Database Management
- Drizzle migrations in `migrations/` directory
- Schema definitions in `shared/schema.ts`
- Database push command for development
- PostgreSQL with Neon serverless configuration

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```