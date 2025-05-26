# Live CCTV Camera Monitor - Installation Guide

## 🎯 What This System Does
- Displays live video feed from your RTSP camera (10.10.10.146:554)
- Professional monitoring dashboard with real-time statistics
- Stream controls (play/pause/reconnect/fullscreen)
- Connection status monitoring
- Works with weighbridge cameras and security systems

## 📋 Prerequisites
Before running this project, make sure you have:
1. **Node.js** (version 18 or higher) - Download from https://nodejs.org/
2. **NPM** (comes with Node.js)
3. **FFmpeg** (for video streaming) - Download from https://ffmpeg.org/download.html

## 🚀 Quick Start (Windows)

### Step 1: Install Dependencies
Open Command Prompt or PowerShell in the project folder and run:
```cmd
npm install
```

### Step 2: Start the System
**Easy Method:** Double-click the file `start-camera-monitor.bat`

**Manual Method:** Run in Command Prompt:
```cmd
npx tsx server/index.ts
```

### Step 3: Access Your Camera Monitor
Open your web browser and go to: **http://localhost:5000**

## 📁 Project Structure
```
CameraStreamMonitor/
├── start-camera-monitor.bat    ← Double-click to start (Windows)
├── start-camera-monitor.ps1    ← PowerShell alternative
├── server/                     ← Backend code
├── client/                     ← Frontend dashboard
├── package.json               ← Dependencies list
└── README-INSTALLATION.md     ← This file
```

## 🔧 Troubleshooting

### Camera Not Connecting?
1. Make sure your camera IP (10.10.10.146) is accessible from your computer
2. Test the RTSP URL in VLC player first
3. Check if your firewall is blocking the connection

### Port Already in Use?
If port 5000 is busy, the system will automatically try port 5001, 5002, etc.

### FFmpeg Not Found?
Download and install FFmpeg from: https://ffmpeg.org/download.html
Make sure it's added to your system PATH.

## 🎮 How to Use
1. Start the system using the batch file
2. Open http://localhost:5000 in your browser
3. Click "Start Stream" to begin live monitoring
4. Use the controls to pause, reconnect, or go fullscreen
5. Monitor connection status and stream statistics in real-time

## 📞 Support
Your camera monitoring system is configured for:
- Camera IP: 10.10.10.146:554
- Username: admin
- Password: admin123
- Stream: /cam/realmonitor?channel=1&subtype=0

The system converts RTSP to web-compatible format automatically!