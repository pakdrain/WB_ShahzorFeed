import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Video, Clock } from "lucide-react";
import ConnectionStatus from "@/components/connection-status";
import VideoStream from "@/components/video-stream";
import StreamInfoPanels from "@/components/stream-info-panels";
import CameraSettings from "@/components/camera-settings";
import { useStream } from "@/hooks/use-stream";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CameraMonitor() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Mutation to update camera configuration
  const updateCameraMutation = useMutation({
    mutationFn: async (config: any) => {
      const response = await fetch(`/api/cameras/${camera?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error('Failed to update camera');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras/1'] });
      toast({
        title: "Camera Settings Updated",
        description: "Camera configuration has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to save camera configuration. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating camera:', error);
    },
  });

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Remove auto-start - user will control manually through settings

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
            <CameraSettings
              isStreaming={isStreaming}
              isConnected={isConnected}
              currentCamera={camera}
              onStartStream={startStream}
              onStopStream={stopStream}
              onReconnect={reconnectStream}
              onFullscreen={() => {
                const element = document.getElementById('video-container');
                if (element) {
                  element.requestFullscreen();
                }
              }}
              onUpdateCamera={(config) => {
                updateCameraMutation.mutate(config);
              }}
            />
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
                  <span className="font-medium">{camera.name}</span>
                </div>
                <div className="text-sm text-gray-400 font-mono">
                  IP: <span className="text-white">{camera.ip}:{camera.port}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Resolution: <span className="text-white">640x480</span>
                </div>
                <div className="text-sm text-gray-400">
                  Format: <span className="text-white">H.264</span>
                </div>
              </div>
              
              {/* Stream controls now handled by settings icon in header */}
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
