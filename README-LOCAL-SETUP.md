# Weighbridge Camera Monitor - Local Windows Setup

## Complete Setup Guide

### Prerequisites
1. **Node.js** (version 18 or higher)
2. **PostgreSQL** installed and running
3. **FFmpeg** for camera streaming
4. **Admin privileges** (required for COM port access)

### Step 1: Project Setup
1. Copy all project files to your desired location
2. Open Command Prompt or PowerShell in the project folder
3. Install dependencies:
```cmd
npm install
```

### Step 2: Database Configuration
Ensure PostgreSQL is running with these settings:
- Host: localhost
- Port: 5432
- Database: wb
- User: postgres
- Password: @1122

### Step 3: Start the Application

**Option 1: Using batch file**
```cmd
start.bat
```

**Option 2: Using PowerShell**
```powershell
npx tsx server/index.ts
```

**Option 3: Using Command Prompt with environment**
```cmd
set NODE_ENV=development && npx tsx server/index.ts
```

### Step 4: Access the Application
Open your browser and navigate to: **http://localhost:5000**

## System Features

### Camera Monitoring
- **RTSP Stream**: Connects to camera at 10.10.10.146:554
- **Automatic Recovery**: Stream restarts when camera moves
- **Real-time Display**: Live video feed with minimal latency

### Weight Scale Integration
- **Serial Communication**: Connects to COM3/COM4 weight scales
- **Real-time Weight Display**: Live weight readings
- **Multiple Port Support**: Automatically detects available ports

### Purchase Management
- **Complete Forms**: Weighbridge purchase entry system
- **Database Storage**: All data saved to PostgreSQL
- **IGP Integration**: Item goods receipt processing
- **Image Capture**: Camera snapshots with purchase records

## Database Connection Status

When the application starts successfully, you should see:
- **✅ Database connected - using PostgreSQL storage** (when connected to your database)
- **ℹ️ Using in-memory storage** (fallback mode when database unavailable)

## Troubleshooting

### Database Issues
**❌ Failed to connect to PostgreSQL: read ECONNRESET**
- Ensure PostgreSQL service is running in Windows Services
- Verify database "wb" exists
- Check password and connection settings

**Database Creation:**
```sql
-- Connect to PostgreSQL as postgres user
createdb -U postgres wb
```

### Camera Connection
**FFmpeg stderr: Connection timed out**
- Verify camera is powered on and connected to network
- Check that camera IP 10.10.10.146 is accessible
- Ensure camera credentials are correct (admin/admin123)

### Weight Scale
**❌ Serial port error: Opening COM3: File not found**
- Check which COM port your scale is connected to
- Try COM1, COM2, or COM4 in weighbridge settings
- Ensure application is run as Administrator

### Application Startup
**'NODE_ENV' is not recognized**
- Use PowerShell: `npx tsx server/index.ts`
- Or use batch file: `start.bat`

## Configuration

### Camera Settings
- IP: 10.10.10.146
- Port: 554
- Credentials: admin/admin123
- RTSP URL: rtsp://admin:admin123@10.10.10.146:554/cam/realmonitor?channel=1&subtype=0

### Weight Scale Ports
- Primary: COM3
- Alternative: COM1, COM2, COM4
- Configure in Weighbridge Settings page

### Network Requirements
- Camera must be on same network as your Windows machine
- Ensure no firewall blocking port 554 (RTSP) or 5000 (web app)

## Application Pages

1. **Purchase Form** - Main weighbridge entry system
2. **Camera Monitor** - Live RTSP stream monitoring
3. **Weighbridge Settings** - COM port configuration
4. **Camera Settings** - Camera connection parameters

## Data Storage

All purchase form data is automatically saved to your PostgreSQL database tables:
- `wb_weighbridge` - Main purchase records
- `wb_weighbridge_items_purchase` - Item details
- `wb_images` - Camera snapshots