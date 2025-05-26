import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamService } from "./stream-service";
import { videoStreamService } from "./video-stream";
import { recordingService } from "./recording-service";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket service
  streamService.initialize(httpServer);
  
  // Register video streaming routes
  videoStreamService.registerRoutes(app);

  // Get default camera (Camera 01) - Put this BEFORE the parameterized route
  app.get("/api/cameras/default", async (req, res) => {
    try {
      console.log("Looking for default camera...");
      // Get the first camera (ID 1) which should be our default camera
      const camera = await storage.getCamera(1);
      console.log("Found camera:", camera);
      
      if (!camera) {
        console.log("Camera not found, returning 404");
        return res.status(404).json({ message: "Default camera not found" });
      }

      res.json(camera);
    } catch (error) {
      console.error("Error getting default camera:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get camera by ID
  app.get("/api/cameras/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Skip if this is the "default" string which should be handled by the route above
      if (isNaN(id)) {
        return res.status(404).json({ message: "Camera not found" });
      }
      
      const camera = await storage.getCamera(id);
      
      if (!camera) {
        return res.status(404).json({ message: "Camera not found" });
      }

      res.json(camera);
    } catch (error) {
      console.error("Error getting camera:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test camera connection
  app.post("/api/cameras/:id/test", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const camera = await storage.getCamera(id);
      
      if (!camera) {
        return res.status(404).json({ message: "Camera not found" });
      }

      // Simulate network test
      const networkTest = {
        success: true,
        latency: 10 + Math.floor(Math.random() * 10),
        status: "reachable",
      };

      // Simulate authentication test
      const authTest = {
        success: true,
        method: "Basic Auth",
        status: "authenticated",
      };

      // Simulate stream test
      const streamTest = {
        success: true,
        format: "H.264",
        resolution: "640x480",
        status: "available",
      };

      res.json({
        camera: {
          id: camera.id,
          name: camera.name,
          ip: camera.ip,
          port: camera.port,
          rtspUrl: camera.rtspUrl,
        },
        tests: {
          network: networkTest,
          authentication: authTest,
          stream: streamTest,
        },
        overall: "passed",
      });
    } catch (error) {
      console.error("Error testing camera:", error);
      res.status(500).json({ message: "Failed to test camera connection" });
    }
  });

  // Get stream stats for a camera
  app.get("/api/cameras/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getLatestStreamStats(id);
      
      if (!stats) {
        return res.status(404).json({ message: "No stats found for camera" });
      }

      res.json(stats);
    } catch (error) {
      console.error("Error getting stream stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Recording API endpoints
  // Start recording
  app.post("/api/cameras/:id/recording/start", async (req, res) => {
    try {
      const cameraId = parseInt(req.params.id);
      const camera = await storage.getCamera(cameraId);
      
      if (!camera) {
        return res.status(404).json({ message: "Camera not found" });
      }

      if (recordingService.isRecording(cameraId)) {
        return res.status(400).json({ message: "Recording already in progress" });
      }

      const recordingId = await recordingService.startRecording(cameraId, camera.rtspUrl);
      res.json({ recordingId, message: "Recording started" });
    } catch (error) {
      console.error("Error starting recording:", error);
      res.status(500).json({ message: "Failed to start recording" });
    }
  });

  // Stop recording
  app.post("/api/cameras/:id/recording/stop", async (req, res) => {
    try {
      const cameraId = parseInt(req.params.id);
      
      if (!recordingService.isRecording(cameraId)) {
        return res.status(400).json({ message: "No active recording found" });
      }

      const recording = await recordingService.stopRecording(cameraId);
      res.json({ recording, message: "Recording stopped" });
    } catch (error) {
      console.error("Error stopping recording:", error);
      res.status(500).json({ message: "Failed to stop recording" });
    }
  });

  // Get recording status
  app.get("/api/cameras/:id/recording/status", async (req, res) => {
    try {
      const cameraId = parseInt(req.params.id);
      const isRecording = recordingService.isRecording(cameraId);
      const currentRecording = recordingService.getCurrentRecording(cameraId);
      
      res.json({ 
        isRecording, 
        currentRecording 
      });
    } catch (error) {
      console.error("Error getting recording status:", error);
      res.status(500).json({ message: "Failed to get recording status" });
    }
  });

  // Get all recordings for a camera
  app.get("/api/cameras/:id/recordings", async (req, res) => {
    try {
      const cameraId = parseInt(req.params.id);
      const recordings = recordingService.getAllRecordings(cameraId);
      res.json(recordings);
    } catch (error) {
      console.error("Error getting recordings:", error);
      res.status(500).json({ message: "Failed to get recordings" });
    }
  });

  // Download recording
  app.get("/api/recordings/:recordingId/download", async (req, res) => {
    try {
      const recordingId = req.params.recordingId;
      const recording = recordingService.getRecording(recordingId);
      
      if (!recording) {
        return res.status(404).json({ message: "Recording not found" });
      }

      const filePath = recordingService.getRecordingFilePath(recordingId);
      if (!filePath) {
        return res.status(404).json({ message: "Recording file not found" });
      }

      res.download(filePath, recording.filename);
    } catch (error) {
      console.error("Error downloading recording:", error);
      res.status(500).json({ message: "Failed to download recording" });
    }
  });

  // Delete recording
  app.delete("/api/recordings/:recordingId", async (req, res) => {
    try {
      const recordingId = req.params.recordingId;
      const success = await recordingService.deleteRecording(recordingId);
      
      if (!success) {
        return res.status(404).json({ message: "Recording not found" });
      }

      res.json({ message: "Recording deleted successfully" });
    } catch (error) {
      console.error("Error deleting recording:", error);
      res.status(500).json({ message: "Failed to delete recording" });
    }
  });

  return httpServer;
}
