# Weighbridge Camera Monitor

A live CCTV camera monitoring system that displays real-time RTSP streams from weighbridge cameras.

## 🎯 Features

- **Live Video Streaming**: Real-time MJPEG conversion from RTSP streams
- **Multiple Views**: Simple view (400x400px) and full dashboard
- **Offline Capable**: Works on local networks without internet
- **Auto-Start**: Begins streaming immediately when opened
- **Professional Dashboard**: Complete monitoring interface with statistics

## 🚀 Quick Start (Windows)

### Option 1: Easy Setup (Recommended)
1. Download and extract the project
2. Double-click `start-camera-monitor.bat`
3. Open browser to `http://localhost:5000`

### Option 2: Manual Setup
1. Install Node.js (18 or newer)
2. Open PowerShell in project folder
3. Run: `npm install`
4. Run: `npx tsx server/index.ts`
5. Open `http://localhost:5000`

## 🌐 Available Pages

- **Simple View**: `http://localhost:5000/` - Clean 400x400px video feed
- **Full Dashboard**: `http://localhost:5000/monitor` - Complete monitoring interface
- **Offline Mode**: `http://localhost:5000/offline` - No WebSocket dependencies

## ⚙️ Camera Configuration

The system is pre-configured for:
- **Camera IP**: 10.10.10.146
- **Port**: 554
- **Credentials**: admin/admin123
- **Stream URL**: rtsp://admin:admin123@10.10.10.146:554/cam/realmonitor?channel=1&subtype=0

To change camera settings, edit `server/storage.ts`.

## 🔧 Requirements

- **Node.js**: 18+ 
- **FFmpeg**: Automatically handled
- **Network**: Must be on same network as camera (10.10.10.146)
- **OS**: Windows (batch files provided)

## 📁 Project Structure

```
├── start-camera-monitor.bat     # Windows startup script
├── start-camera-monitor.ps1     # PowerShell startup script
├── server/                      # Backend Express server
├── client/                      # React frontend
└── README.md                    # This file
```

## 🐛 Troubleshooting

**Camera not connecting?**
- Ensure camera is at 10.10.10.146:554
- Check network connectivity
- Verify camera credentials (admin/admin123)

**WebSocket errors?**
- Use offline mode: `http://localhost:5000/offline`
- WebSocket not required for basic video streaming

**FFmpeg issues?**
- FFmpeg is automatically installed
- Check camera RTSP stream works in VLC first

## 📞 Support

If you encounter issues:
1. Check camera connection in VLC player first
2. Ensure you're on the same network as the camera
3. Use the offline mode if WebSocket errors occur

Built for professional weighbridge monitoring systems.