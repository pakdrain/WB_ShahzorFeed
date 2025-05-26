import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export interface Recording {
  id: string;
  filename: string;
  filepath: string;
  cameraId: number;
  startTime: Date;
  endTime?: Date;
  duration: number;
  size: string;
  status: 'recording' | 'completed' | 'failed';
}

export class RecordingService {
  private recordings: Map<string, Recording> = new Map();
  private activeRecordings: Map<number, { process: ChildProcess; recordingId: string }> = new Map();
  private recordingsDir: string;

  constructor() {
    this.recordingsDir = path.join(process.cwd(), 'recordings');
    this.ensureRecordingsDirectory();
  }

  private async ensureRecordingsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.recordingsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create recordings directory:', error);
    }
  }

  async startRecording(cameraId: number, rtspUrl: string): Promise<string> {
    // Stop any existing recording for this camera
    if (this.activeRecordings.has(cameraId)) {
      await this.stopRecording(cameraId);
    }

    const recordingId = nanoid();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `camera-${cameraId}-${timestamp}.mp4`;
    const filepath = path.join(this.recordingsDir, filename);

    const recording: Recording = {
      id: recordingId,
      filename,
      filepath,
      cameraId,
      startTime: new Date(),
      duration: 0,
      size: '0 MB',
      status: 'recording'
    };

    // Start FFmpeg recording process
    const ffmpegProcess = spawn('ffmpeg', [
      '-fflags', '+genpts',
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-f', 'mp4',
      '-movflags', '+faststart',
      filepath
    ]);

    ffmpegProcess.stdout.on('data', (data) => {
      console.log(`Recording stdout: ${data}`);
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.log(`Recording stderr: ${data}`);
    });

    ffmpegProcess.on('close', async (code) => {
      console.log(`Recording process closed with code ${code}`);
      await this.finalizeRecording(recordingId);
      this.activeRecordings.delete(cameraId);
    });

    ffmpegProcess.on('error', (error) => {
      console.error(`Recording process error:`, error);
      recording.status = 'failed';
      this.recordings.set(recordingId, recording);
      this.activeRecordings.delete(cameraId);
    });

    this.recordings.set(recordingId, recording);
    this.activeRecordings.set(cameraId, { process: ffmpegProcess, recordingId });

    console.log(`Started recording for camera ${cameraId}: ${filename}`);
    return recordingId;
  }

  async stopRecording(cameraId: number): Promise<Recording | null> {
    const activeRecording = this.activeRecordings.get(cameraId);
    if (!activeRecording) {
      return null;
    }

    const { process: ffmpegProcess, recordingId } = activeRecording;
    
    // Gracefully stop FFmpeg
    ffmpegProcess.stdin?.write('q');
    
    // Force kill after 5 seconds if not stopped gracefully
    setTimeout(() => {
      if (!ffmpegProcess.killed) {
        ffmpegProcess.kill('SIGKILL');
      }
    }, 5000);

    const recording = this.recordings.get(recordingId);
    if (recording) {
      recording.endTime = new Date();
      recording.duration = Math.floor((recording.endTime.getTime() - recording.startTime.getTime()) / 1000);
      this.recordings.set(recordingId, recording);
    }

    this.activeRecordings.delete(cameraId);
    console.log(`Stopped recording for camera ${cameraId}`);
    
    return recording || null;
  }

  private async finalizeRecording(recordingId: string): Promise<void> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return;

    try {
      // Get file size
      const stats = await fs.stat(recording.filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      recording.size = `${sizeInMB} MB`;
      recording.status = 'completed';
      
      if (!recording.endTime) {
        recording.endTime = new Date();
        recording.duration = Math.floor((recording.endTime.getTime() - recording.startTime.getTime()) / 1000);
      }

      this.recordings.set(recordingId, recording);
      console.log(`Finalized recording: ${recording.filename} (${recording.size})`);
    } catch (error) {
      console.error(`Failed to finalize recording ${recordingId}:`, error);
      recording.status = 'failed';
      this.recordings.set(recordingId, recording);
    }
  }

  isRecording(cameraId: number): boolean {
    return this.activeRecordings.has(cameraId);
  }

  getCurrentRecording(cameraId: number): Recording | null {
    const activeRecording = this.activeRecordings.get(cameraId);
    if (!activeRecording) return null;
    
    return this.recordings.get(activeRecording.recordingId) || null;
  }

  getRecording(recordingId: string): Recording | undefined {
    return this.recordings.get(recordingId);
  }

  getAllRecordings(cameraId?: number): Recording[] {
    const allRecordings = Array.from(this.recordings.values());
    
    if (cameraId !== undefined) {
      return allRecordings.filter(r => r.cameraId === cameraId);
    }
    
    return allRecordings.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  async deleteRecording(recordingId: string): Promise<boolean> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return false;

    try {
      // Stop recording if it's active
      if (recording.status === 'recording') {
        await this.stopRecording(recording.cameraId);
      }

      // Delete file
      await fs.unlink(recording.filepath);
      
      // Remove from memory
      this.recordings.delete(recordingId);
      
      console.log(`Deleted recording: ${recording.filename}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete recording ${recordingId}:`, error);
      return false;
    }
  }

  getRecordingFilePath(recordingId: string): string | null {
    const recording = this.recordings.get(recordingId);
    return recording?.filepath || null;
  }
}

export const recordingService = new RecordingService();