import { useState } from 'react';

export default function OfflineCamera() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Weighbridge Camera Monitor
        </h1>
        
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
                <div className="text-sm">Camera Connecting...</div>
                <div className="text-xs mt-2 text-gray-300">10.10.10.146:554</div>
              </div>
            </div>
          )}
          
          <img
            src="/api/stream/1/mjpeg"
            alt="Live Weighbridge Camera"
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
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Camera: 10.10.10.146 | Resolution: 640x480
        </div>
      </div>
    </div>
  );
}