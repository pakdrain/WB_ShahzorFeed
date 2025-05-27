import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Video, Clock } from "lucide-react";
import ConnectionStatus from "@/components/connection-status";
import VideoStreamFullscreen from "@/components/video-stream-fullscreen";
import StreamControls from "@/components/stream-controls";
import StreamInfoPanels from "@/components/stream-info-panels";
import WeightIndicator from "@/components/weight-indicator";
import { useStream } from "@/hooks/use-stream";
import { Card } from "@/components/ui/card";

export default function CameraMonitor() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch default camera information
  const { data: camera, isLoading: cameraLoading } = useQuery({
    queryKey: ['/api/cameras/1'],
    refetchInterval: false,
  });

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

  // Auto-start stream immediately when camera is available
  useEffect(() => {
    if (camera?.id) {
      // Start stream immediately when camera is loaded
      const timer = setTimeout(() => {
        startStream();
      }, 500); // Small delay to ensure WebSocket is ready

      return () => clearTimeout(timer);
    }
  }, [camera?.id, startStream]);

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
    <div className="min-h-screen bg-monitoring-dark overflow-hidden">
      {/* Weight Region - Full screen with camera embedded inside */}
      <div className="h-full flex flex-col items-center justify-center p-8">
        
        {/* Embedded Camera View - Small size inside weight region */}
        <div className="w-40 h-30 mb-8 border border-monitoring-gray rounded overflow-hidden">
          <VideoStreamFullscreen
            camera={camera}
            isConnected={isConnected}
            isStreaming={isStreaming}
          />
        </div>
        
        {/* Weight Display - Main focus, clean interface */}
        <WeightIndicator comPort="COM3" />
        
      </div>
    </div>
  );
}
