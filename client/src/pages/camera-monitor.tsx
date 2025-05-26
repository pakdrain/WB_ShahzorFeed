import { useEffect, useState } from "react";
import { Camera, Video, Clock } from "lucide-react";
import ConnectionStatus from "@/components/connection-status";
import VideoStream from "@/components/video-stream";
import StreamControls from "@/components/stream-controls";
import StreamInfoPanels from "@/components/stream-info-panels";
import CameraSettings, { CameraSettings as CameraSettingsType } from "@/components/camera-settings";
import { useStream } from "@/hooks/use-stream";
import { Card } from "@/components/ui/card";

export default function CameraMonitor() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraSettings, setCameraSettings] = useState<CameraSettingsType>({
    ip: '10.10.10.146',
    port: 554,
    username: 'admin',
    password: 'admin123',
    resolution: '640x480',
    fps: 10,
    quality: 4,
    streamPath: '/cam/realmonitor?channel=1&subtype=0',
  });

  const {
    isConnected,
    isStreaming,
    streamStats,
    connectionError,
    startStream,
    stopStream,
    reconnectStream,
  } = useStream(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize WebSocket stream connection
  const {
    isConnected,
    isStreaming,
    streamStats,
    connectionError,
    startStream,
    stopStream,
    reconnectStream,
  } = useStream(camera?.id);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-start stream when camera is loaded
  useEffect(() => {
    if (camera && !isStreaming) {
      startStream();
    }
  }, [camera, isStreaming, startStream]);

  if (cameraLoading) {
    return (
      <div className="min-h-screen bg-monitoring-dark flex items-center justify-center">
        <Card className="bg-monitoring-slate border-monitoring-gray p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-monitoring-blue"></div>
            <span className="text-gray-300">Loading camera configuration...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!camera) {
    return (
      <div className="min-h-screen bg-monitoring-dark flex items-center justify-center">
        <Card className="bg-monitoring-slate border-monitoring-red p-8">
          <div className="flex items-center space-x-3">
            <Video className="h-6 w-6 text-monitoring-red" />
            <span className="text-gray-300">Camera not found. Please check configuration.</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-monitoring-dark">
      {/* Header */}
      <header className="bg-monitoring-slate border-b border-monitoring-gray px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Video className="text-monitoring-blue text-xl" />
              <h1 className="text-xl font-semibold text-white">Live CCTV Monitor</h1>
            </div>
            <div className="text-sm text-gray-400 font-mono">localhost:5000</div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ConnectionStatus isConnected={isConnected} />
            <div className="text-sm text-gray-400 font-mono flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Camera Info Bar */}
          <div className="bg-monitoring-slate rounded-lg p-4 mb-6 border border-monitoring-gray">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Camera className="text-monitoring-blue" />
                  <span className="font-medium">Camera 01</span>
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  IP: <span className="text-white">{cameraSettings.ip}:{cameraSettings.port}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Resolution: <span className="text-white">{cameraSettings.resolution}</span>
                </div>
                <div className="text-sm text-gray-400">
                  FPS: <span className="text-white">{cameraSettings.fps}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <CameraSettings 
                  currentSettings={cameraSettings}
                  onSettingsUpdate={setCameraSettings}
                />
                <StreamControls
                  isStreaming={isStreaming}
                  onToggleStream={isStreaming ? stopStream : startStream}
                  onReconnect={reconnectStream}
                />
              </div>
            </div>
          </div>

          {/* Main Video Display */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              <Card className="bg-monitoring-slate border-monitoring-gray overflow-hidden">
                <div className="relative aspect-video bg-black">
                  <VideoStream
                    camera={{
                      id: 1,
                      name: "Camera 01",
                      ip: cameraSettings.ip,
                      port: cameraSettings.port,
                      username: cameraSettings.username,
                      password: cameraSettings.password,
                      rtspUrl: `rtsp://${cameraSettings.username}:${cameraSettings.password}@${cameraSettings.ip}:${cameraSettings.port}${cameraSettings.streamPath}`,
                      isActive: true,
                      createdAt: new Date()
                    }}
                    isConnected={isConnected}
                    isStreaming={isStreaming}
                    currentTime={currentTime}
                    streamStats={streamStats}
                    connectionError={connectionError}
                  />
                </div>
              </Card>
            </div>

            {/* Stream Information Panels */}
            <div className="xl:col-span-1">
              <StreamInfoPanels
                camera={{
                  id: 1,
                  name: "Camera 01", 
                  ip: cameraSettings.ip,
                  port: cameraSettings.port,
                  username: cameraSettings.username,
                  password: cameraSettings.password,
                  rtspUrl: `rtsp://${cameraSettings.username}:${cameraSettings.password}@${cameraSettings.ip}:${cameraSettings.port}${cameraSettings.streamPath}`,
                  isActive: true,
                  createdAt: new Date()
                }}
                isConnected={isConnected}
                streamStats={streamStats}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
              
              <StreamControls
                isStreaming={isStreaming}
                onToggleStream={isStreaming ? stopStream : startStream}
                onReconnect={reconnectStream}
              />
            </div>
          </div>

          {/* Video Container */}
          <VideoStream
            camera={camera}
            isConnected={isConnected}
            isStreaming={isStreaming}
            currentTime={currentTime}
            streamStats={streamStats}
            connectionError={connectionError}
          />

          {/* Stream Information Panels */}
          <StreamInfoPanels
            camera={camera}
            isConnected={isConnected}
            streamStats={streamStats}
          />
        </div>
      </main>
    </div>
  );
}
