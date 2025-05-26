import { spawn, ChildProcess } from 'child_process';
import { Express } from 'express';
import { storage } from './storage';
import path from 'path';
import fs from 'fs';

class VideoStreamService {
  private ffmpegProcesses: Map<number, ChildProcess> = new Map();
  private streamPaths: Map<number, string> = new Map();

  constructor() {
    // Create streams directory if it doesn't exist
    const streamsDir = path.join(process.cwd(), 'streams');
    if (!fs.existsSync(streamsDir)) {
      fs.mkdirSync(streamsDir, { recursive: true });
    }
  }

  async startStream(cameraId: number): Promise<string | null> {
    try {
      const camera = await storage.getCamera(cameraId);
      if (!camera) {
        console.error(`Camera ${cameraId} not found`);
        return null;
      }

      // Stop existing stream if running
      this.stopStream(cameraId);

      const streamPath = path.join(process.cwd(), 'streams', `camera_${cameraId}`);
      const playlistPath = path.join(streamPath, 'playlist.m3u8');

      // Create stream directory
      if (!fs.existsSync(streamPath)) {
        fs.mkdirSync(streamPath, { recursive: true });
      }

      console.log(`Starting FFmpeg stream for camera ${cameraId}: ${camera.rtspUrl}`);

      // FFmpeg command to convert RTSP to HLS
      const ffmpeg = spawn('ffmpeg', [
        '-i', camera.rtspUrl,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-tune', 'zerolatency',
        '-c:a', 'aac',
        '-f', 'hls',
        '-hls_time', '2',
        '-hls_list_size', '3',
        '-hls_flags', 'delete_segments',
        '-y', // Overwrite output files
        playlistPath
      ]);

      ffmpeg.stdout.on('data', (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg stderr: ${data}`);
      });

      ffmpeg.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        this.ffmpegProcesses.delete(cameraId);
        this.streamPaths.delete(cameraId);
      });

      ffmpeg.on('error', (error) => {
        console.error(`FFmpeg error: ${error}`);
        this.ffmpegProcesses.delete(cameraId);
        this.streamPaths.delete(cameraId);
      });

      this.ffmpegProcesses.set(cameraId, ffmpeg);
      this.streamPaths.set(cameraId, streamPath);

      return `/api/stream/${cameraId}/playlist.m3u8`;
    } catch (error) {
      console.error(`Error starting stream for camera ${cameraId}:`, error);
      return null;
    }
  }

  stopStream(cameraId: number): void {
    const ffmpeg = this.ffmpegProcesses.get(cameraId);
    if (ffmpeg) {
      console.log(`Stopping stream for camera ${cameraId}`);
      ffmpeg.kill('SIGTERM');
      this.ffmpegProcesses.delete(cameraId);
    }

    const streamPath = this.streamPaths.get(cameraId);
    if (streamPath) {
      // Clean up stream files
      try {
        if (fs.existsSync(streamPath)) {
          fs.rmSync(streamPath, { recursive: true, force: true });
        }
      } catch (error) {
        console.error(`Error cleaning up stream files: ${error}`);
      }
      this.streamPaths.delete(cameraId);
    }
  }

  getStreamPath(cameraId: number): string | undefined {
    return this.streamPaths.get(cameraId);
  }

  isStreamActive(cameraId: number): boolean {
    const ffmpeg = this.ffmpegProcesses.get(cameraId);
    return ffmpeg !== undefined && !ffmpeg.killed;
  }

  registerRoutes(app: Express): void {
    // Serve HLS playlists
    app.get('/api/stream/:cameraId/playlist.m3u8', (req, res) => {
      const cameraId = parseInt(req.params.cameraId);
      const streamPath = this.streamPaths.get(cameraId);
      
      if (!streamPath) {
        return res.status(404).json({ error: 'Stream not found' });
      }

      const playlistPath = path.join(streamPath, 'playlist.m3u8');
      
      if (!fs.existsSync(playlistPath)) {
        return res.status(404).json({ error: 'Playlist not found' });
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(playlistPath);
    });

    // Serve HLS segments
    app.get('/api/stream/:cameraId/:segment', (req, res) => {
      const cameraId = parseInt(req.params.cameraId);
      const segment = req.params.segment;
      const streamPath = this.streamPaths.get(cameraId);
      
      if (!streamPath) {
        return res.status(404).json({ error: 'Stream not found' });
      }

      const segmentPath = path.join(streamPath, segment);
      
      if (!fs.existsSync(segmentPath)) {
        return res.status(404).json({ error: 'Segment not found' });
      }

      res.setHeader('Content-Type', 'video/MP2T');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(segmentPath);
    });

    // Start stream endpoint
    app.post('/api/stream/:cameraId/start', async (req, res) => {
      const cameraId = parseInt(req.params.cameraId);
      
      try {
        const streamUrl = await this.startStream(cameraId);
        if (streamUrl) {
          res.json({ success: true, streamUrl });
        } else {
          res.status(500).json({ error: 'Failed to start stream' });
        }
      } catch (error) {
        console.error('Error starting stream:', error);
        res.status(500).json({ error: 'Failed to start stream' });
      }
    });

    // Stop stream endpoint
    app.post('/api/stream/:cameraId/stop', (req, res) => {
      const cameraId = parseInt(req.params.cameraId);
      this.stopStream(cameraId);
      res.json({ success: true });
    });

    // Stream status endpoint
    app.get('/api/stream/:cameraId/status', (req, res) => {
      const cameraId = parseInt(req.params.cameraId);
      const isActive = this.isStreamActive(cameraId);
      res.json({ active: isActive });
    });
  }
}

export const videoStreamService = new VideoStreamService();