import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { log } from './vite';

export interface CaptureImageOptions {
  slipNo: string;
  cameraIp: string;
  cameraPort: number;
  username?: string;
  password?: string;
}

export class ImageCaptureService {
  private baseImagePath = './captured_images';
  private firstWeightFolder = 'first_weight';

  async ensureDirectoriesExist(): Promise<void> {
    try {
      const firstWeightPath = path.join(this.baseImagePath, this.firstWeightFolder);
      await fs.mkdir(firstWeightPath, { recursive: true });
      log(`📁 Created directories: ${firstWeightPath}`);
    } catch (error: any) {
      log(`❌ Error creating directories: ${error.message}`);
      throw error;
    }
  }

  async captureFirstWeightImage(options: CaptureImageOptions): Promise<string> {
    const { slipNo, cameraIp, cameraPort, username = 'admin', password = 'admin123' } = options;
    
    try {
      await this.ensureDirectoriesExist();
      
      // Generate filename with slip number and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `slip_${slipNo}_${timestamp}.jpg`;
      const imagePath = path.join(this.baseImagePath, this.firstWeightFolder, filename);
      
      // Construct RTSP URL
      const rtspUrl = `rtsp://${username}:${password}@${cameraIp}:${cameraPort}/cam/realmonitor?channel=1&subtype=0`;
      
      log(`📸 Capturing image for slip ${slipNo} from camera ${cameraIp}:${cameraPort}`);
      
      // Use FFmpeg to capture a single frame from RTSP stream
      const success = await this.captureImageWithFFmpeg(rtspUrl, imagePath);
      
      if (success) {
        log(`✅ Image captured successfully: ${filename}`);
        return imagePath;
      } else {
        throw new Error('Failed to capture image');
      }
    } catch (error: any) {
      log(`❌ Error capturing first weight image: ${error.message}`);
      throw error;
    }
  }

  private captureImageWithFFmpeg(rtspUrl: string, outputPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-frames:v', '1',
        '-q:v', '2',
        '-y', // Overwrite output file
        outputPath
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          log(`❌ FFmpeg error: ${errorOutput}`);
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });

      // Set timeout for capture (10 seconds)
      setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        reject(new Error('Image capture timeout'));
      }, 10000);
    });
  }

  async getFirstWeightImages(): Promise<string[]> {
    try {
      const firstWeightPath = path.join(this.baseImagePath, this.firstWeightFolder);
      const files = await fs.readdir(firstWeightPath);
      return files
        .filter(file => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg'))
        .sort()
        .reverse(); // Most recent first
    } catch (error: any) {
      log(`❌ Error reading first weight images: ${error.message}`);
      return [];
    }
  }

  async deleteImage(filename: string): Promise<boolean> {
    try {
      const imagePath = path.join(this.baseImagePath, this.firstWeightFolder, filename);
      await fs.unlink(imagePath);
      log(`🗑️ Deleted image: ${filename}`);
      return true;
    } catch (error: any) {
      log(`❌ Error deleting image: ${error.message}`);
      return false;
    }
  }
}

export const imageCaptureService = new ImageCaptureService();