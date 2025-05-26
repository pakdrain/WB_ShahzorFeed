import { Camera as CameraType } from "@shared/schema";

interface VideoStreamProps {
  camera: CameraType;
  isConnected: boolean;
  isStreaming: boolean;
  currentTime: Date;
  streamStats: any;
  connectionError: string | null;
}

export default function VideoStream({
  camera,
  isConnected,
  isStreaming,
  currentTime,
  streamStats,
  connectionError,
}: VideoStreamProps) {
  const handleFullscreen = () => {
    const element = document.getElementById('video-container');
    if (element) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        element.requestFullscreen();
      }
    }
  };

  const renderStreamContent = () => {
    if (connectionError) {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl text-monitoring-red mb-4">⚠</div>
            <div className="text-lg font-medium text-monitoring-red mb-2">Connection Error</div>
            <div className="text-sm text-gray-500 font-mono max-w-md">
              {connectionError}
            </div>
          </div>
        </div>
      );
    }

    if (!isConnected || !isStreaming) {
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl text-gray-600 mb-4">📹</div>
            <div className="text-lg font-medium text-gray-400 mb-2">
              {!isConnected ? 'Connecting to Camera...' : 'Stream Paused'}
            </div>
            <div className="text-sm text-gray-500 font-mono">
              rtsp://admin:***@{camera.ip}:{camera.port}/cam/realmonitor
            </div>
            {!isConnected && (
              <div className="flex items-center justify-center mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-monitoring-blue"></div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Connected and streaming
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-monitoring-green mb-4">📹</div>
          <div className="text-lg font-medium text-monitoring-green mb-2">Camera Feed Active</div>
          <div className="text-sm text-gray-400 font-mono">
            Stream: {camera.ip}:{camera.port}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      id="video-container"
      className="relative bg-black rounded-xl overflow-hidden shadow-2xl border border-monitoring-gray"
    >
      <div className="relative aspect-video bg-black">
        {renderStreamContent()}
        
        {/* Video Overlay Elements */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
          <div className="text-sm font-mono text-white">
            {currentTime.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </div>
        </div>
        
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected && isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm font-medium text-white">
              {isConnected && isStreaming ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Stream Quality Indicator */}
        {isConnected && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-monitoring-green rounded-full" />
                <div className="w-1 h-3 bg-monitoring-green rounded-full" />
                <div className="w-1 h-3 bg-monitoring-green rounded-full" />
                <div className="w-1 h-2 bg-gray-600 rounded-full" />
                <div className="w-1 h-2 bg-gray-600 rounded-full" />
              </div>
              <span className="text-xs text-white">Signal</span>
            </div>
          </div>
        )}

        {/* Bandwidth Indicator */}
        {streamStats && (
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 px-3 py-2 rounded-lg">
            <div className="text-xs text-white font-mono">
              {streamStats.bandwidth}
            </div>
          </div>
        )}

        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreen}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 hover:bg-opacity-80 px-3 py-2 rounded-lg transition-all"
        >
          <span className="text-xs text-white">⛶</span>
        </button>
      </div>
    </div>
  );
}
