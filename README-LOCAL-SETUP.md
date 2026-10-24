# Local Camera Monitoring Setup for Windows

## Quick Start Guide

### Step 1: Download Project Files
Copy all project files to your Windows machine at: `C:\Users\Admin\Desktop\CameraStreamMonitor\`

### Step 2: Install Dependencies
Open Command Prompt in the project folder and run:
```cmd
npm install
```

### Step 3: Start the Application
Double-click: `start-camera-monitor-improved.bat`

Or run manually:
```cmd
npx tsx server/index.ts
```

### Step 4: Access Your Camera
Open browser: http://localhost:5000

## Camera Movement Solution

The application includes enhanced features specifically for camera movement:

✅ **Automatic Stream Recovery**: When you move the camera and the connection briefly drops, the stream automatically restarts within 2-3 seconds

✅ **No Manual Intervention**: You don't need to press play again after moving the camera

✅ **Persistent Streaming**: The system remembers you want the stream active and maintains it through interruptionsnpm install -g kill-port