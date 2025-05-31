import { useEffect, useState } from 'react';

interface VideoStreamFullscreenProps {
  camera: {
    id: number;
    name: string;
    ip: string;
    port: number;
  };
  isConnected: boolean;
  isStreaming: boolean;
}

export default function VideoStreamFullscreen({
  camera,
  isConnected,
  isStreaming
}: VideoStreamFullscreenProps) {
  const [streamLoading, setStreamLoading] = useState(true);

  useEffect(() => {
    if (isStreaming) {
      const timer = setTimeout(() => setStreamLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isStreaming]);

  if (!isConnected || !isStreaming) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">📹</div>
          <div className="text-xl">Connecting to Camera...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {streamLoading && (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div>
      )}
      
      <img
        className="w-full h-full object-cover"
        src={`/api/stream/${camera.id}/mjpeg`}
        alt="Live Camera Feed"
        onLoad={() => {
          console.log('MJPEG stream loaded');
          setStreamLoading(false);
        }}
        onError={(e) => {
          console.error('MJPEG stream error:', e);
          setStreamLoading(false);
        }}
        style={{ 
          display: streamLoading ? 'none' : 'block'
        }}
      />
    </div>
  );
}