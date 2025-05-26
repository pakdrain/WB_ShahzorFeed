import { useEffect, useState } from 'react';

interface SimpleVideoPlayerProps {
  cameraId: number;
}

export default function SimpleVideoPlayer({ cameraId }: SimpleVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Auto-start stream when component mounts
    const startStream = async () => {
      try {
        const response = await fetch(`/api/stream/${cameraId}/start`, {
          method: 'POST',
        });
        
        if (response.ok) {
          setIsLoading(false);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Error starting stream:', error);
        setHasError(true);
      }
    };

    startStream();
  }, [cameraId]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="relative w-96 h-96 bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-4xl mb-2">📹</div>
            <div className="text-sm">Camera Offline</div>
          </div>
        </div>
      )}
      
      <img
        src={`/api/stream/${cameraId}/mjpeg`}
        alt="Live Camera Feed"
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: hasError ? 'none' : 'block' }}
      />
      
      {/* Live indicator */}
      {!isLoading && !hasError && (
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
          LIVE
        </div>
      )}
    </div>
  );
}