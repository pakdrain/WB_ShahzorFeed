import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { log } from './vite';

// ✅ FFmpeg full path
const FFMPEG_PATH = 'C:\\Users\\Wajid Ali\\Downloads\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe';

export interface CaptureImageOptions {
  slipNo: string;
  cameraIp: string;
  cameraPort: number;
  username?: string;
  password?: string;
  entryType?: string;
}

export class ImageCaptureService {
  private baseImagePath = './captured_images';
  private firstWeightFolder = 'first_weight';
  private secondWeightFolder = 'second_weight';

  async ensureDirectoriesExist(): Promise<void> {
    const firstWeightPath = path.join(this.baseImagePath, this.firstWeightFolder);
    const secondWeightPath = path.join(this.baseImagePath, this.secondWeightFolder);
    await fs.mkdir(firstWeightPath, { recursive: true });
    await fs.mkdir(secondWeightPath, { recursive: true });
  }

  async captureFirstWeightImage(options: CaptureImageOptions): Promise<string> {
    const {
      slipNo,
      cameraIp,
      cameraPort,
      username = 'admin',
      password = 'Abc@12345',
      entryType = 'default'
    } = options;

    await this.ensureDirectoriesExist();

    const cleanSlipNo = String(slipNo).trim();
    const cleanEntryType = String(entryType).trim();

    const firstWeightPath = path.join(this.baseImagePath, this.firstWeightFolder);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    const fiscalYear = currentMonth >= 7 ? now.getFullYear() + 1 : now.getFullYear();

    const filename = `slip_${cleanSlipNo}_${cleanEntryType}_${fiscalYear}.jpg`;
    const imagePath = path.join(firstWeightPath, filename);

    const rtspUrl = `rtsp://${username}:${password}@${cameraIp}:${cameraPort}/cam/realmonitor?channel=1&subtype=0`;

    log(`📸 Capturing first weight image for slip ${cleanSlipNo}...`);

    const success = await this.captureImageWithFFmpeg(rtspUrl, imagePath);

    if (!success) {
      throw new Error('Failed to capture image');
    }

    log(`✅ First weight image captured: ${filename}`);
    return imagePath;
  }

  async captureSecondWeightImage(options: CaptureImageOptions): Promise<string> {
    const {
      slipNo,
      cameraIp,
      cameraPort,
      username = 'admin',
      password = 'Abc@12345',
      entryType = 'default'
    } = options;

    await this.ensureDirectoriesExist();

    const cleanSlipNo = String(slipNo).trim();
    const cleanEntryType = String(entryType).trim();

    const secondWeightPath = path.join(this.baseImagePath, this.secondWeightFolder);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    const fiscalYear = currentMonth >= 7 ? now.getFullYear() + 1 : now.getFullYear();

    const filename = `slip_${cleanSlipNo}_${cleanEntryType}_${fiscalYear}.jpg`;
    const imagePath = path.join(secondWeightPath, filename);

    const rtspUrl = `rtsp://${username}:${password}@${cameraIp}:${cameraPort}/cam/realmonitor?channel=1&subtype=0`;
    log(`📸 Capturing second weight image for slip ${cleanSlipNo}...`);

    const success = await this.captureImageWithFFmpeg(rtspUrl, imagePath);
    if (!success) throw new Error('Failed to capture second weight image');

    log(`✅ Second weight image captured: ${filename}`);
    return imagePath;
  }

  private captureImageWithFFmpeg(rtspUrl: string, outputPath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        '-rtsp_transport', 'tcp',
        '-i', rtspUrl,
        '-frames:v', '1',
        '-q:v', '2',
        '-y',
        outputPath
      ];

      // ✅ FFMPEG_PATH use ho raha hai
      const ffmpeg = spawn(FFMPEG_PATH, ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

      let errorOutput = '';
      ffmpeg.stderr.on('data', data => { errorOutput += data.toString(); });

      ffmpeg.on('close', code => {
        if (code === 0) resolve(true);
        else reject(new Error(`FFmpeg exited with code ${code}: ${errorOutput}`));
      });

      ffmpeg.on('error', reject);
      setTimeout(() => {
        ffmpeg.kill('SIGKILL');
        reject(new Error('Image capture timeout'));
      }, 10000);
    });
  }

  async getFirstWeightImages(entryType?: string, slipNo?: string, fiscalYear?: number): Promise<string[]> {
    const folderPath = path.join(this.baseImagePath, this.firstWeightFolder);

    try {
      const files = await fs.readdir(folderPath);

      return files
        .filter(file => /\.(jpg|jpeg)$/i.test(file))
        .filter(file => (!entryType || file.includes(`_${entryType}_`)))
        .filter(file => (!slipNo || file.includes(`slip_${slipNo}_`)))
        .filter(file => {
          if (!fiscalYear) return true;
          const parts = file.split('_');
          const yearPart = parts[parts.length - 1].replace('.jpg', '').replace('.jpeg', '');
          return yearPart === String(fiscalYear);
        })
        .sort()
        .reverse();

    } catch (error) {
      return [];
    }
  }

  async getSecondWeightImages(entryType?: string, slipNo?: string, fiscalYear?: number): Promise<string[]> {
    const folderPath = path.join(this.baseImagePath, this.secondWeightFolder);

    try {
      const files = await fs.readdir(folderPath);

      return files
        .filter(file => /\.(jpg|jpeg)$/i.test(file))
        .filter(file => (!entryType || file.includes(`_${entryType}_`)))
        .filter(file => (!slipNo || file.includes(`slip_${slipNo}_`)))
        .filter(file => {
          if (!fiscalYear) return true;
          const parts = file.split('_');
          const yearPart = parts[parts.length - 1].replace('.jpg', '').replace('.jpeg', '');
          return yearPart === String(fiscalYear);
        })
        .sort()
        .reverse();

    } catch (error) {
      return [];
    }
  }

  async getLatestFirstWeightImage(slipNo: string, entryType?: string, fiscalYear?: number): Promise<string | null> {
    const images = await this.getFirstWeightImages(entryType, slipNo, fiscalYear);
    return images.length > 0 ? images[0] : null;
  }

  async getLatestSecondWeightImage(slipNo: string, entryType?: string, fiscalYear?: number): Promise<string | null> {
    const images = await this.getSecondWeightImages(entryType, slipNo, fiscalYear);
    return images.length > 0 ? images[0] : null;
  }

  getCurrentFiscalYear(): number {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    return currentMonth >= 7 ? now.getFullYear() + 1 : now.getFullYear();
  }

  async deleteImage(filename: string, firstWeight = true): Promise<boolean> {
    const folder = firstWeight ? this.firstWeightFolder : this.secondWeightFolder;
    const imagePath = path.join(this.baseImagePath, folder, filename);
    try {
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