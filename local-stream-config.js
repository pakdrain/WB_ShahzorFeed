// Local streaming configuration for Windows environment
// This file contains optimized settings for your local camera setup

const localStreamConfig = {
  // Camera settings
  camera: {
    ip: '10.10.10.146',
    port: 554,
    username: 'admin',
    password: 'admin123',
    channel: 1,
    subtype: 0
  },
  
  // FFmpeg settings optimized for local network
  ffmpeg: {
    transport: 'tcp',
    timeout: '10000000', // 10 second timeout
    analyzeDuration: '2000000',
    probeSize: '2000000',
    bufferSize: '1M',
    quality: 5,
    fps: 10,
    resolution: '640x480'
  },
  
  // Stream recovery settings
  recovery: {
    maxRetries: 5,
    retryDelay: 2000,
    autoRestart: true
  }
};

module.exports = localStreamConfig;