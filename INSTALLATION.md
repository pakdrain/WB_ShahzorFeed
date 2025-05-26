# 📦 Installation Guide

## Windows Installation (Recommended)

### Prerequisites
1. **Node.js** - Download from [nodejs.org](https://nodejs.org/)
   - Choose "LTS" version (18 or newer)
   - Run installer with default settings

### Quick Setup
1. **Download Project**
   - Extract all files to: `C:\CameraMonitor\`

2. **Install Dependencies**
   - Open Command Prompt in project folder
   - Run: `npm install`

3. **Start Camera Monitor**
   - Double-click `start-camera-monitor.bat`
   - OR run: `npx tsx server/index.ts`

4. **Access System**
   - Open browser to: `http://localhost:5000`

## Offline Mode Setup

If you're getting WebSocket connection errors:

1. **Use Offline URL**: `http://localhost:5000/offline`
2. **No WebSocket Required**: Direct video streaming only
3. **Same Camera Feed**: Works without connection errors

## Camera Network Setup

### Network Requirements
- Camera and computer must be on same network
- Camera IP: `10.10.10.146`
- Camera Port: `554`
- Camera Login: `admin` / `admin123`

### Test Camera Connection
Before running the app, test with VLC Media Player:
1. Open VLC
2. Media → Open Network Stream
3. Enter: `rtsp://admin:admin123@10.10.10.146:554/cam/realmonitor?channel=1&subtype=0`
4. If VLC shows video, the app will work

## Troubleshooting

### ❌ "NODE_ENV not recognized"
**Solution**: Use the provided batch file or run:
```cmd
npx tsx server/index.ts
```

### ❌ WebSocket Connection Errors
**Solution**: Use offline mode:
```
http://localhost:5000/offline
```

### ❌ Camera Not Found
**Solution**: 
1. Check camera IP (ping 10.10.10.146)
2. Verify camera credentials
3. Test in VLC first

### ❌ FFmpeg Errors
**Solution**: 
1. FFmpeg auto-installs with the project
2. Check camera RTSP stream works
3. Restart the application

## Project Structure

```
CameraMonitor/
├── start-camera-monitor.bat    # ← Double-click this to start
├── start-camera-monitor.ps1    # PowerShell alternative
├── package.json                # Dependencies
├── server/                     # Backend code
├── client/                     # Frontend code
└── README.md                   # Documentation
```

## Available Views

1. **Offline Mode** (Recommended): `http://localhost:5000/offline`
   - Clean 400x400px video feed
   - No WebSocket connections
   - Auto-starts streaming

2. **Simple View**: `http://localhost:5000/simple`
   - Basic video player
   - Minimal interface

3. **Full Dashboard**: `http://localhost:5000/monitor`
   - Complete monitoring interface
   - Statistics and controls

## Support

Need help? Check these first:
1. Camera works in VLC player
2. Node.js is installed (version 18+)
3. Running on same network as camera
4. Use offline mode for simple setup

The system is designed for weighbridge camera monitoring and works best on local networks.