# Complete Local Deployment Guide

## Step 1: Download Project Files

Copy these essential files to your local Windows machine:

### Required Files:
```
/server/
  - index.ts
  - db.ts
  - routes.ts  
  - storage.ts
  - stream-service.ts
  - video-stream.ts
  - vite.ts

/client/
  - (entire client folder)

/shared/
  - schema.ts

Root files:
  - package.json
  - drizzle.config.ts
  - vite.config.ts
  - tailwind.config.ts
  - tsconfig.json
  - postcss.config.js
  - components.json
  - start.bat
  - README-LOCAL-SETUP.md
```

## Step 2: Local Setup Commands

1. **Install dependencies:**
```cmd
npm install
```

2. **Start the application:**
```cmd
npx tsx server/index.ts
```

## Step 3: Expected Output (Local)

When running on your Windows machine, you should see:
```
Initialized camera with ID: 1 Total cameras: 1
5:20:58 AM [express] serving on port 5000
✅ Database connected - using PostgreSQL storage
Connected to database: wb
📡 Attempting to connect to COM3 weight indicator.
📋 Available serial ports: COM1, COM2
```

## Step 4: Access Your Application

Open browser: http://localhost:5000

## Features Available Locally:

✅ **PostgreSQL Integration** - All data saved permanently
✅ **Camera Monitoring** - RTSP stream from 10.10.10.146  
✅ **Weight Scale** - COM port serial communication
✅ **Purchase Forms** - Complete weighbridge system
✅ **Real-time Data** - Live weight readings and camera feed

## Database Tables Used:

Your existing PostgreSQL tables will be used:
- `wb_weighbridge` - Main purchase records
- `wb_weighbridge_items_purchase` - Purchase line items  
- `wb_images` - Camera snapshots

## Troubleshooting:

**If you see "in-memory storage":**
- Check PostgreSQL service is running
- Verify database "wb" exists
- Ensure password @1122 is correct

**If camera doesn't connect:**
- Verify camera is on same network
- Check IP 10.10.10.146 is accessible

**If COM port errors:**
- Run as Administrator
- Check which COM port your scale uses
- Update port in Weighbridge Settings