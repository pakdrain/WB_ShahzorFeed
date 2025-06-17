# Weighbridge Camera Monitoring System

## Overview

This is a comprehensive weighbridge monitoring system that combines CCTV camera streaming with weight measurement functionality. The application provides real-time camera feeds, weight data collection, and form-based data entry for purchase and sales transactions. It's designed specifically for industrial weighbridge operations with support for both local Windows deployment and cloud hosting.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with PostgreSQL session store
- **Video Streaming**: FFmpeg-based RTSP to MJPEG conversion
- **Serial Communication**: SerialPort library for weight scale integration

### Database Design
- **Primary Database**: PostgreSQL
- **Key Tables**:
  - `cameras` - Camera configuration and settings
  - `stream_sessions` - Active streaming sessions tracking
  - `stream_stats` - Performance metrics and statistics
  - `wb_weighbridge` - Main weighbridge transaction records
  - `wb_weighbridge_items_purchase` - Purchase transaction details
  - `deduction` - Weight deduction calculations

## Key Components

### Camera Management System
- **RTSP Stream Processing**: Converts RTSP camera feeds to browser-compatible MJPEG streams
- **WebSocket Integration**: Real-time stream control and status updates
- **Auto-Recovery**: Automatic stream restart when cameras are moved or disconnected
- **Fullscreen Support**: Enhanced viewing experience with fullscreen capabilities

### Weight Scale Integration
- **Serial Port Communication**: Direct connection to weight indicators via COM ports
- **Real-time Data**: Continuous weight monitoring with configurable update intervals
- **Multi-unit Support**: Supports kg, g, and lb weight units
- **Connection Management**: Automatic reconnection and error handling

### Transaction Management
- **Purchase Forms**: Complete purchase transaction entry with weight tracking
- **Sales Forms**: Sales order management with delivery tracking
- **Deduction Calculations**: Automated bag weight and percentage deductions
- **Image Capture**: Automatic photograph capture during weighing operations

### User Interface Features
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **Dark Theme**: Professional monitoring interface optimized for industrial environments
- **Real-time Updates**: Live weight displays and camera feeds
- **Form Validation**: Comprehensive input validation with user-friendly error messages

## Data Flow

### Camera Streaming Flow
1. RTSP camera connects to the system via network
2. FFmpeg process converts RTSP stream to MJPEG format
3. WebSocket connection manages stream control and status
4. Browser receives MJPEG stream via HTTP endpoint
5. Stream statistics are collected and stored in database

### Weight Data Flow
1. Weight scale connects via serial port (COM6 default)
2. Serial data is parsed and validated
3. Weight values are broadcast via WebSocket to connected clients
4. First and second weight measurements are captured for net weight calculation
5. Weight data is stored with transaction records

### Transaction Processing Flow
1. User initiates purchase/sale transaction
2. Vehicle and vendor information is entered
3. First weight is captured automatically
4. Camera image is taken and stored with slip number
5. Transaction details are saved to database
6. Second weight is captured for completion
7. Net weight and deductions are calculated
8. Final transaction record is generated

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework
- **serialport**: Serial communication with weight scales
- **ffmpeg**: Video stream processing (system dependency)

### UI Components
- **@radix-ui/***: Comprehensive UI component library
- **tailwindcss**: Utility-first CSS framework
- **react-hook-form**: Form state management
- **zod**: Schema validation

### Database & Authentication
- **pg**: PostgreSQL client
- **connect-pg-simple**: PostgreSQL session store
- **@neondatabase/serverless**: Cloud PostgreSQL support

## Deployment Strategy

### Local Windows Deployment
- **Installation**: npm install followed by batch file execution
- **Serial Port Access**: Direct COM port access for weight scales
- **Camera Network**: Local network RTSP camera connections
- **FFmpeg**: System-level FFmpeg installation required

### Cloud Deployment (Replit)
- **Platform**: Replit with Node.js 20 and PostgreSQL 16
- **Build Process**: Vite build for frontend, esbuild for backend
- **Port Configuration**: Port 5000 mapped to external port 80
- **Environment Variables**: Database and camera configuration via .env

### Configuration Management
- **Environment Files**: Separate .env configurations for different environments
- **Camera Settings**: IP-based camera configuration with RTSP parameters
- **Serial Settings**: COM port and baud rate configuration
- **Database URLs**: Flexible PostgreSQL connection string support

## Changelog
- June 14, 2025. Initial setup
- June 14, 2025. Fixed all 4 critical issues:
  - Fixed branch name display in edit mode (shows branch_name instead of branch_id)
  - Fixed offline/online entry filtering in reports (offline entries only show offline_entry='Yes')
  - Fixed deduction table insertion (removed total column from INSERT as it's auto-generated)
  - Enhanced database query accuracy for proper status filtering
- June 16, 2025. Completed second weight image capture functionality:
  - Added second weight folder creation and management in ImageCaptureService
  - Implemented captureSecondWeightImage method with duplicate detection
  - Added API endpoints for second weight image capture and retrieval
  - Enhanced captureSecondWeight function to automatically capture images
  - Added automatic second weight image capture during save operations
  - Implemented static file serving for both first and second weight images
  - Both First Weight Image and Second Weight Image columns now fully functional in reports
- June 16, 2025. Fixed offline entries filtering and image display system:
  - Corrected offline entries table to use dedicated `/api/purchases/offline` endpoint instead of client-side filtering
  - Fixed offline entries to show only records where offline_entry='Yes' (excludes online entries completely)
  - Implemented proper static file serving for captured images at `/captured_images/:folder/:filename`
  - Added error handling and fallback display for missing images
  - Verified image serving functionality works correctly (returns HTTP 200 for existing images)
- June 16, 2025. Completed print report image display functionality:
  - Updated print template to display actual First Weight and Second Weight images instead of placeholder text
  - Modified image placeholders in print reports to load from `/captured_images/first_weight/slip_${slip_no}.jpg` and `/captured_images/second_weight/slip_${slip_no}.jpg`
  - Added Image Upload page in sidebar navigation for transferring local images to Replit environment
  - Implemented image upload endpoint `/api/upload-image/:folder/:filename` for file transfer capability
  - Print reports now correctly display images for each slip number when images are available
- June 17, 2025. Fixed deduction table save functionality:
  - Corrected database schema to match actual table structure with `id` as primary key and `bag_id` as regular column
  - Fixed INSERT statement to include all required columns (wb_id, bag_id, bags, pb, percentage, weight, total)
  - Updated main Save button to properly integrate deduction data saving using correct `/api/deduction/save` endpoint
  - Deduction button displays data temporarily in frontend table, Save button saves to database
  - Fixed deduction save integration: master table saves first to generate wb_id, then deduction data saves using that wb_id
  - Verified complete deduction workflow: display → save → database storage working properly
  - Tested endpoint successfully saves deduction records to PostgreSQL database

## User Preferences

Preferred communication style: Simple, everyday language.