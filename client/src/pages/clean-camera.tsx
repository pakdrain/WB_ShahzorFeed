import { useState } from 'react';

export default function CleanCamera() {
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
    <html>
      <head>
        <title>Weighbridge Camera</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            background: #f5f5f5; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 24px;
            text-align: center;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
          }
          .video-container {
            position: relative;
            width: 400px;
            height: 400px;
            background: black;
            border-radius: 8px;
            overflow: hidden;
            margin: 0 auto;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            text-align: center;
          }
          .video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .live-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #dc2626;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .info {
            margin-top: 16px;
            color: #666;
            font-size: 14px;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1 className="title">Weighbridge Camera Monitor</h1>
          
          <div className="video-container">
            {isLoading && (
              <div className="loading">
                <div className="spinner"></div>
                <div>Loading...</div>
              </div>
            )}
            
            {hasError && (
              <div className="error">
                <div style={{fontSize: '32px', marginBottom: '8px'}}>📹</div>
                <div>Camera Connecting...</div>
                <div style={{fontSize: '12px', marginTop: '8px', color: '#ccc'}}>10.10.10.146:554</div>
              </div>
            )}
            
            <img
              src="/api/stream/1/mjpeg"
              alt="Live Weighbridge Camera"
              className="video"
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: hasError ? 'none' : 'block' }}
            />
            
            {!isLoading && !hasError && (
              <div className="live-badge">LIVE</div>
            )}
          </div>
          
          <div className="info">
            Camera: 10.10.10.146 | Resolution: 640x480
          </div>
        </div>
      </body>
    </html>
  );
}