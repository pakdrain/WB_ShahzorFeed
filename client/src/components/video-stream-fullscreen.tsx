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

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {(!isConnected || !isStreaming) ? (
        <div className="text-white text-center">
          <div className="text-4xl mb-2">📹</div>
          <div className="text-sm">Connecting to Camera...</div>
        </div>
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          {streamLoading && (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          )}
          
          <img
            className="w-full h-full object-cover bg-black"
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
              width: '100%',
              height: '100%',
              backgroundColor: 'black'
            }}
          />
        </div>
      )}
    </div>
  );
}