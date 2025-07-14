import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamService } from "./stream-service";
import { videoStreamService } from "./video-stream";
import { z } from "zod";
import pkg from "pg";
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  currentWeight,
  currentUnit,
  isPortConnected,
  currentComPort,
  currentBaudRate,
  updateComPort,
  updateBaudRate,
} from "./weight-state";
import { imageCaptureService } from "./image-capture";
import {
  registerSchema,
  loginSchema,
  type RegisterData,
  type LoginData,
} from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // PostgreSQL connection setup
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.PGUSER || "postgres"}:${process.env.PGPASSWORD || "@1122"}@${process.env.PGHOST || "localhost"}:${process.env.PGPORT || "5432"}/${process.env.PGDATABASE || "WB"}`,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  // Test database connection and log status
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL database connected successfully");
    client.release();
  } catch (err) {
    console.error("❌ Failed to connect to PostgreSQL database:", err);
    console.log("🔄 Attempting to continue without database connection...");
    // Continue execution even if database fails to connect initially
  }

  // Camera update endpoint
  app.patch("/api/cameras/:id", async (req: Request, res: Response) => {
    try {
      const cameraId = parseInt(req.params.id);
      const updates = req.body;

      // Build RTSP URL from the provided data
      if (updates.ip && updates.port && updates.username && updates.password) {
        const channel = updates.channel || 1;
        const subtype = updates.subtype || 0;
        updates.rtspUrl = `rtsp://${updates.username}:${updates.password}@${updates.ip}:${updates.port}/cam/realmonitor?channel=${channel}&subtype=${subtype}`;
      }

      const updatedCamera = await storage.updateCamera(cameraId, updates);

      if (!updatedCamera) {
        return res.status(404).json({ error: "Camera not found" });
      }

      res.json(updatedCamera);
    } catch (error) {
      console.error("Error updating camera:", error);
      res.status(500).json({ error: "Failed to update camera" });
    }
  });

  // License plate recognition endpoint
  app.post("/api/cameras/read-plate", async (req: Request, res: Response) => {
    try {
      const { cameraId } = req.body;
      console.log("License plate recognition requested for camera:", cameraId);

      // Execute Python OCR script
      const { spawn } = require("child_process");
      const python = spawn("python3", ["ocr_service.py"], {
        cwd: process.cwd(),
        timeout: 8000, // 8 second timeout
      });

      let result = "";
      let error = "";

      python.stdout.on("data", (data: Buffer) => {
        result += data.toString();
      });

      python.stderr.on("data", (data: Buffer) => {
        error += data.toString();
      });

      python.on("close", (code: number) => {
        if (code === 0 && result) {
          try {
            const parsedResult = JSON.parse(result.trim());
            console.log("OCR Result:", parsedResult);
            res.json(parsedResult);
          } catch (parseError) {
            console.error("Error parsing OCR result:", parseError);
            res.status(500).json({
              success: false,
              error: "Failed to parse OCR result",
            });
          }
        } else {
          console.error("Python script error:", error);
          res.status(500).json({
            success: false,
            error: "OCR processing failed: " + error,
          });
        }
      });

      // Set timeout for the process
      setTimeout(() => {
        python.kill();
        if (!res.headersSent) {
          res.status(408).json({
            success: false,
            error: "OCR processing timeout",
          });
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error("Error reading license plate:", error);
      res.status(500).json({
        success: false,
        error: "Failed to read license plate",
      });
    }
  });

  // Helper function to generate a unique WB_ID
  async function generateWBID() {
    try {
      const res = await pool.query(
        "SELECT COALESCE(MAX(wb_id), 0) + 1 AS new_id FROM wb_weighbridge",
      );
      return res.rows[0].new_id;
    } catch (err) {
      console.error("Error generating WB_ID:", err);
      throw err;
    }
  }

  // Initialize WebSocket service
  streamService.initialize(httpServer);

  // Register video streaming routes
  videoStreamService.registerRoutes(app);

  // Serve captured images with dynamic lookup for timestamp-based naming
  app.get("/captured_images/:folder/:filename", async (req, res) => {
    try {
      const { folder, filename } = req.params;
      const folderPath = path.join("./captured_images", folder);

      // First try exact filename match
      let filePath = path.join(folderPath, filename);

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType =
          ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".png"
              ? "image/png"
              : "image/jpeg";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "no-cache");
        res.sendFile(path.resolve(filePath));
        return;
      }

      // If exact match fails, try timestamp-based lookup
      const slipMatch = filename.match(/slip_(.+)\.(jpg|jpeg|png)$/i);
      if (slipMatch && fs.existsSync(folderPath)) {
        const slipNumber = slipMatch[1];
        const files = fs.readdirSync(folderPath);
        // Look for files with pattern: slip_[slipNumber]_[timestamp].[ext] or any file starting with slip_[slipNumber]
        const matchingFile = files.find((file) => {
          // First try exact timestamp pattern
          const timestampPattern = new RegExp(
            `^slip_${slipNumber}_\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z\\.(jpg|jpeg|png)$`,
            "i",
          );
          if (timestampPattern.test(file)) return true;

          // Then try any file starting with slip_[slipNumber]_
          const generalPattern = new RegExp(
            `^slip_${slipNumber}_.*\\.(jpg|jpeg|png)$`,
            "i",
          );
          return generalPattern.test(file);
        });

        if (matchingFile) {
          filePath = path.join(folderPath, matchingFile);
          const ext = path.extname(filePath).toLowerCase();
          const contentType =
            ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : ext === ".png"
                ? "image/png"
                : "image/jpeg";
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "no-cache");
          res.sendFile(path.resolve(filePath));
          console.log(
            `✅ Found timestamped image: ${matchingFile} for slip ${slipNumber}`,
          );
          return;
        }
      }

      console.log(`Image not found: ${filename} in folder ${folder}`);
      res.status(404).send("Image not found");
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).send("Error serving image");
    }
  });

  // Image upload endpoint for transferring images from local machine
  app.use(express.static("captured_images"));

  // Add file upload capability
  app.post("/api/upload-image/:folder/:filename", async (req, res) => {
    try {
      const { folder, filename } = req.params;
      const uploadDir = path.join("./captured_images", folder);

      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);

      // Write the uploaded file
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filePath, buffer);
        console.log(`Image uploaded: ${filePath}`);
        res.json({ success: true, message: "Image uploaded successfully" });
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // API endpoint to list images in directory for verification
  app.get("/api/images/:folder", async (req, res) => {
    try {
      const { folder } = req.params;
      const folderPath = path.join("./captured_images", folder);

      if (!fs.existsSync(folderPath)) {
        return res.json({ images: [] });
      }

      const files = fs.readdirSync(folderPath);
      const imageFiles = files.filter(
        (file) =>
          file.toLowerCase().endsWith(".jpg") ||
          file.toLowerCase().endsWith(".jpeg") ||
          file.toLowerCase().endsWith(".png"),
      );

      res.json({ images: imageFiles });
    } catch (error) {
      console.error("Error listing images:", error);
      res.status(500).json({ error: "Failed to list images" });
    }
  });

  console.log(
    "✅ Using users table with columns: userid, username, userpassword, branchid",
  );

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { userName, userPassword, confirmPassword, branchId } = req.body;

      if (!userName || !userPassword || !confirmPassword || !branchId) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (userPassword !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      const existingUser = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [userName],
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const result = await pool.query(
        "INSERT INTO users (username, userpassword, branch_id) VALUES ($1, $2, $3) RETURNING userid, username, branch_id",
        [userName, userPassword, parseInt(branchId)],
      );

      console.log("✅ User registered successfully:", userName);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          userid: result.rows[0].userid,
          userName: result.rows[0].username,
          branchId: result.rows[0].branchid,
        },
      });
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      res.status(500).json({ error: "Registration failed: " + error.message });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { userName, userPassword } = req.body;

    if (!userName || !userPassword) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    try {
      const result = await pool.query(
        `SELECT u.userid, u.username, u.userpassword, u.branch_id, b.branch_name as branchName 
         FROM users u 
         LEFT JOIN branches b ON u.branch_id = b.branch_id 
         WHERE u.username = $1`,
        [userName],
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      const user = result.rows[0];

      // Simple password comparison (in production, use bcrypt)
      if (user.userpassword !== userPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      // Remove password from response and format to match expected structure
      res.json({
        success: true,
        user: {
          userid: user.userid,
          userName: user.username,
          branchId: user.branchid,
          branchName: user.branchname,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error: any) {
      console.error("❌ Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Table initializer
  app.post("/api/auth/init-db", async (req, res) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          userid SERIAL PRIMARY KEY,
          username VARCHAR(1000),
          userpassword VARCHAR(1000),
          branch_id INTEGER
        );
      `);

      res.json({ success: true, message: "Users table initialized" });
    } catch (error: any) {
      console.error("❌ Init DB error:", error);
      res.status(500).json({ error: "Database initialization failed" });
    }
  });

  // Test camera connection
  app.post("/api/cameras/test", async (req, res) => {
    try {
      const { rtspUrl } = req.body;

      if (!rtspUrl) {
        return res.status(400).json({ message: "RTSP URL is required" });
      }

      // Return success for connection test
      res.json({
        success: true,
        message: "Connection test completed",
        rtspUrl,
      });
    } catch (error) {
      console.error("Error testing camera connection:", error);
      res.status(500).json({ message: "Connection test failed" });
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
    } catch (error: any) {
      console.error("Error getting stream stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Weight API endpoints use imported variables from weight-state

  // Weight data endpoint
  app.get("/api/weight/data", (req, res) => {
    res.json({
      weight: currentWeight,
      unit: currentUnit,
      connected: isPortConnected,
      timestamp: new Date().toISOString(),
    });
  });

  // Weight status endpoint
  app.get("/api/weight/status", (req, res) => {
    res.json({
      connected: isPortConnected,
      port: "COM6", // Direct assignment to ensure COM6 is returned
      baudRate: currentBaudRate,
      currentWeight,
      currentUnit,
    });
  });

  // Weight connect endpoint
  app.post("/api/weight/connect", async (req, res) => {
    try {
      const { comPort, baudRate = 9600 } = req.body;

      if (!comPort) {
        return res
          .status(400)
          .json({ success: false, message: "COM port is required" });
      }

      // Update current settings
      updateComPort(comPort);
      updateBaudRate(parseInt(baudRate));

      res.json({
        success: true,
        message: `Connected to ${currentComPort}`,
        port: currentComPort,
        baudRate: currentBaudRate,
        connected: true,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: `Failed to connect to ${currentComPort}: ${error.message}`,
        port: currentComPort,
        connected: false,
      });
    }
  });

  // Weight tare endpoint
  app.post("/api/weight/tare", (req, res) => {
    res.json({ success: true, message: "Tare command sent" });
  });

  // Purchase and IGP Database Routes

  // GET purchase data by IGP number
  app.get("/api/purchase-by-igp", async (req, res) => {
    const { igpNo } = req.query;
    if (!igpNo) {
      return res
        .status(400)
        .json({ error: "igpNo query parameter is required" });
    }

    try {
      const query = "SELECT * FROM wb_weighbridge WHERE igp_no = $1";
      const result = await pool.query(query, [igpNo]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "No data found for this IGP No" });
      }
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching data by IGP No:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET all purchases - show only one record per slip number
  app.get("/api/purchases", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (slip_no) * 
        FROM wb_weighbridge 
        ORDER BY slip_no DESC, wb_id DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching purchases:", err);
      res.status(500).json({ error: "Database error" });
    }
  });

  // POST to insert a new purchase
  app.post("/api/purchases", async (req, res) => {
    const purchaseData = req.body;
    console.log("Incoming purchase data:", purchaseData);

    try {
      const WB_ID = await generateWBID();

      // Destructure and prepare values
      const {
        slip_no = null,
        slip_in_time = null,
        first_weight = null,
        second_weight = null,
        net_weight = null,
        bardana_weight = null,
        gross_weight = null,
        freight = null,
        remarks = null,
        driver_name = null,
        company_id = null,
        branch_id = null,
        online_entry = null,
        offline_entry = null,
        created_by = null,
        creation_date = null,
        last_updated_by = null,
        last_updated_date = null,
        manual_dc_no = null,
        entry_type = null,
        slip_out_time = null,
        status = null,
        slip_date = null,
      } = purchaseData;

      // Convert online/offline entries to string - ensure 'Yes' values are properly handled
      const onlineEntryStr =
        online_entry === "Yes" || online_entry === true ? "Yes" : null;
      const offlineEntryStr =
        offline_entry === "Yes" || offline_entry === true ? "Yes" : null;

      const query = `
        INSERT INTO wb_weighbridge (
          wb_id, slip_no, slip_in_time, first_weight, second_weight, net_weight,
          bardana_weight, gross_weight, freight, remarks, driver_name, company_id,
          branch_id, online_entry, offline_entry, created_by, creation_date,
          last_updated_by, last_updated_date, manual_dc_no, entry_type,
          slip_out_time, status, slip_date
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21,
          $22, $23, $24
        )
        RETURNING *;
      `;

      const values = [
        WB_ID,
        slip_no,
        slip_in_time,
        first_weight,
        second_weight,
        net_weight,
        bardana_weight,
        gross_weight,
        freight,
        remarks,
        driver_name,
        company_id,
        branch_id,
        onlineEntryStr,
        offlineEntryStr,
        created_by,
        creation_date,
        last_updated_by,
        last_updated_date,
        manual_dc_no,
        entry_type,
        slip_out_time,
        status,
        slip_date,
      ];

      const result = await pool.query(query, values);
      console.log("Purchase saved successfully:", result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error inserting purchase:", err);
      console.error("Error details:", err.message);
      console.error("Error stack:", err.stack);
      res.status(500).json({
        error: "Insert error",
        details: err.message,
      });
    }
  });

  // POST to insert purchase items
  app.post("/api/purchase-items", async (req, res) => {
    const itemData = req.body;
    console.log("Incoming purchase item data:", itemData);

    try {
      const {
        wb_id,
        baradana_type = null,
        igp_no = null,
        vehicle_no = null,
        weight_per_bags = null,
        igp_date = null,
        supplier_weight = null,
        quality_deduction = null,
        bardana_weight = null,
        no_of_bags = null,
        vendor_name = null,
        bag_condition = null,
        po_no = null,
        item_code = null,
        item_desc = null,
        po_qty = null,
        igp_qty = null,
        balance_qty = null,
        customer_name = null,
        do_no = null,
        do_qty = null,
        dc_qty = null,
      } = itemData;

      const query = `
        INSERT INTO wb_weighbridge_items_purchase (
          wb_id, bardana_type, igp_no, vehicle_no, weight_per_bags, igp_date,
          supplier_weight, quality_deduction, bardana_weight, no_of_bags, vendor_name, bag_condition,
          po_no, item_code, item_desc, po_qty, igp_qty, balance_qty, customer_name, do_no, do_qty, dc_qty
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
        )
        RETURNING *;
      `;

      const values = [
        wb_id,
        baradana_type,
        igp_no,
        vehicle_no,
        weight_per_bags ? parseFloat(weight_per_bags) : null,
        igp_date,
        supplier_weight ? parseFloat(supplier_weight) : null,
        quality_deduction ? parseFloat(quality_deduction) : null,
        bardana_weight ? parseFloat(bardana_weight) : null,
        no_of_bags ? parseInt(no_of_bags) : null,
        vendor_name,
        bag_condition,
        po_no,
        item_code,
        item_desc,
        po_qty ? parseFloat(po_qty) : null,
        igp_qty ? parseFloat(igp_qty) : null,
        balance_qty ? parseFloat(balance_qty) : null,
        customer_name,
        do_no,
        do_qty ? parseFloat(do_qty) : null,
        dc_qty ? parseFloat(dc_qty) : null,
      ];

      const result = await pool.query(query, values);
      console.log("Purchase items saved successfully:", result.rows[0]);
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error("Error inserting purchase items:", err);
      res.status(500).json({ error: "Insert error: " + err.message });
    }
  });

  // Image capture endpoints
  app.post("/api/capture/first-weight", async (req: Request, res: Response) => {
    try {
      const { slipNo, cameraIp = "10.10.10.146", cameraPort = 554 } = req.body;

      if (!slipNo) {
        return res.status(400).json({ error: "Slip number is required" });
      }

      const imagePath = await imageCaptureService.captureFirstWeightImage({
        slipNo,
        cameraIp,
        cameraPort,
        username: "admin",
        password: "admin123",
      });

      res.json({
        success: true,
        imagePath,
        message: `Image captured for slip ${slipNo}`,
      });
    } catch (error: any) {
      console.error("Image capture error:", error);
      res.status(500).json({
        error: "Failed to capture image",
        details: error.message,
      });
    }
  });

  app.get(
    "/api/capture/first-weight/images",
    async (req: Request, res: Response) => {
      try {
        const images = await imageCaptureService.getFirstWeightImages();
        res.json({ images });
      } catch (error: any) {
        console.error("Error fetching images:", error);
        res.status(500).json({
          error: "Failed to fetch images",
          details: error.message,
        });
      }
    },
  );

  app.delete(
    "/api/capture/first-weight/:filename",
    async (req: Request, res: Response) => {
      try {
        const { filename } = req.params;
        const success = await imageCaptureService.deleteImage(filename);

        if (success) {
          res.json({ success: true, message: "Image deleted successfully" });
        } else {
          res.status(404).json({ error: "Image not found" });
        }
      } catch (error: any) {
        console.error("Error deleting image:", error);
        res.status(500).json({
          error: "Failed to delete image",
          details: error.message,
        });
      }
    },
  );

  // Second weight image capture endpoints
  app.post(
    "/api/capture/second-weight",
    async (req: Request, res: Response) => {
      try {
        const { slipNo, cameraIp, cameraPort, username, password } = req.body;

        if (!slipNo || !cameraIp || !cameraPort) {
          return res.status(400).json({
            error: "Missing required fields: slipNo, cameraIp, cameraPort",
          });
        }

        const imagePath = await imageCaptureService.captureSecondWeightImage({
          slipNo,
          cameraIp,
          cameraPort,
          username,
          password,
        });

        res.json({
          message: "Second weight image captured successfully",
          imagePath,
          slipNo,
        });
      } catch (error: any) {
        console.error("Second weight image capture error:", error);
        res.status(500).json({
          error: "Failed to capture second weight image",
          details: error.message,
        });
      }
    },
  );

  app.get(
    "/api/capture/second-weight/images",
    async (req: Request, res: Response) => {
      try {
        const images = await imageCaptureService.getSecondWeightImages();
        res.json({ images });
      } catch (error: any) {
        console.error("Get second weight images error:", error);
        res.status(500).json({
          error: "Failed to retrieve second weight images",
          details: error.message,
        });
      }
    },
  );

  app.delete(
    "/api/capture/second-weight/:filename",
    async (req: Request, res: Response) => {
      try {
        const { filename } = req.params;
        const success = await imageCaptureService.deleteImage(filename);

        if (success) {
          res.json({
            success: true,
            message: "Second weight image deleted successfully",
          });
        } else {
          res.status(404).json({ error: "Second weight image not found" });
        }
      } catch (error: any) {
        console.error("Delete second weight image error:", error);
        res.status(500).json({
          error: "Failed to delete second weight image",
          details: error.message,
        });
      }
    },
  );

  // GET latest master record
  app.get(
    "/api/purchase/latest-master",
    async (req: Request, res: Response) => {
      try {
        const query =
          "SELECT * FROM wb_weighbridge ORDER BY wb_id DESC LIMIT 1";
        const result = await pool.query(query);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "No master records found" });
        }

        ``````;
        console.log(
          `Fetched latest master record: WB_ID ${result.rows[0].wb_id}`,
        );
        res.json(result.rows[0]);
      } catch (error: any) {
        console.error("Error fetching latest master record:", error);
        res.status(500).json({ error: "Failed to fetch latest master record" });
      }
    },
  );

  // GET latest details record
  app.get(
    "/api/purchase/latest-details",
    async (req: Request, res: Response) => {
      try {
        const query =
          "SELECT * FROM wb_weighbridge_items_purchase ORDER BY id DESC LIMIT 1";
        const result = await pool.query(query);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: "No detail records found" });
        }

        console.log(`Fetched latest detail record: ID ${result.rows[0].id}`);
        res.json(result.rows[0]);
      } catch (error: any) {
        console.error("Error fetching latest detail record:", error);
        res.status(500).json({ error: "Failed to fetch latest detail record" });
      }
    },
  );

  // GET first weight records for display table (all entry types)
  app.get(
    "/api/purchase/first-weight-records",
    async (req: Request, res: Response) => {
      try {
        const query = `
        SELECT 
          wb.wb_id,
          wb.slip_no,
          wb.entry_type,
          wb.first_weight,
          wb.second_weight,
          COALESCE(wbi.vehicle_no, '') as vehicle_no
        FROM wb_weighbridge wb 
        LEFT JOIN wb_weighbridge_items_purchase wbi ON wb.wb_id = wbi.wb_id 
        WHERE wb.first_weight IS NOT NULL 
          AND wb.first_weight > 0
        ORDER BY wb.wb_id DESC 
        LIMIT 20
      `;

        const result = await pool.query(query);

        console.log(
          `Fetched ${result.rows.length} first weight records (all entry types)`,
        );
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error fetching first weight records:", error);
        res.status(500).json({ error: "Failed to fetch first weight records" });
      }
    },
  );

  // GET branches for dropdown with specific handling for Shahzor
  app.get("/api/branches", async (req: Request, res: Response) => {
    try {
      const query =
        "SELECT branch_id, branch_name FROM branches ORDER BY branch_name";
      const result = await pool.query(query);

      // Process branches to ensure Shahzor returns only its ID
      const processedBranches = result.rows.map((branch) => {
        if (branch.branch_name === "Shahzor") {
          return {
            branch_id: branch.branch_id,
            branch_name: "Shahzor",
          };
        }
        return branch;
      });

      console.log(`Fetched ${processedBranches.length} branches`);
      res.json(processedBranches);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      res.status(500).json({ error: "Failed to fetch branches" });
    }
  });

  // GET entry types for dropdown
  app.get("/api/entry-types", async (req: Request, res: Response) => {
    try {
      const query =
        "SELECT id, type_name FROM entry_type WHERE is_active = true ORDER BY type_name";
      const result = await pool.query(query);

      console.log(`Fetched ${result.rows.length} entry types`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching entry types:", error);
      res.status(500).json({ error: "Failed to fetch entry types" });
    }
  });

  // GET purchase by wb_id
  app.get(
    "/api/purchase/by-wbid/:wbId",
    async (req: Request, res: Response) => {
      try {
        const { wbId } = req.params;

        const masterQuery = "SELECT * FROM wb_weighbridge WHERE wb_id = $1";
        const masterResult = await pool.query(masterQuery, [parseInt(wbId)]);

        if (masterResult.rows.length === 0) {
          return res
            .status(404)
            .json({ message: "No record found for this wb_id" });
        }

        const master = masterResult.rows[0];

        const detailsQuery =
          "SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1";
        const detailsResult = await pool.query(detailsQuery, [master.wb_id]);

        console.log(`Fetched purchase record for wb_id ${wbId}`);
        res.json({
          master,
          details: detailsResult.rows,
        });
      } catch (error: any) {
        console.error("Error fetching purchase by wb_id:", error);
        res.status(500).json({ error: "Failed to fetch purchase record" });
      }
    },
  );

  // GET purchase by slip number
  app.get(
    "/api/purchase/by-slip/:slipNo",
    async (req: Request, res: Response) => {
      try {
        const { slipNo } = req.params;
        const { entry_type } = req.query;

        if (!entry_type) {
          return res
            .status(400)
            .json({ error: "entry_type query parameter is required" });
        }

        const masterQuery = `
      SELECT * FROM wb_weighbridge 
      WHERE slip_no = $1 AND entry_type = $2
    `;
        const masterResult = await pool.query(masterQuery, [
          slipNo,
          entry_type,
        ]);

        if (masterResult.rows.length === 0) {
          return res
            .status(404)
            .json({
              message: "No record found for this slip number and entry type",
            });
        }

        const master = masterResult.rows[0];

        const detailsQuery =
          "SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1";
        const detailsResult = await pool.query(detailsQuery, [master.wb_id]);

        console.log(
          `Fetched purchase record for slip ${slipNo}, type ${entry_type}`,
        );
        res.json({
          master,
          details: detailsResult.rows,
        });
      } catch (error: any) {
        console.error(
          "Error fetching purchase by slip number and entry type:",
          error,
        );
        res.status(500).json({ error: "Failed to fetch purchase record" });
      }
    },
  );

  // PUT update purchase record
  app.put("/api/purchase/update/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      const updateData = req.body;

      const {
        slip_no = null,
        slip_in_time = null,
        first_weight = null,
        second_weight = null,
        net_weight = null,
        bardana_weight = null,
        gross_weight = null,
        freight = null,
        remarks = null,
        driver_name = null,
        slip_out_time = null,
        online_entry = null,
        offline_entry = null,
      } = updateData;

      const query = `
        UPDATE wb_weighbridge 
        SET 
          slip_no = $2,
          slip_in_time = $3,
          first_weight = $4,
          second_weight = $5,
          net_weight = $6,
          bardana_weight = $7,
          gross_weight = $8,
          freight = $9,
          remarks = $10,
          driver_name = $11,
          slip_out_time = $12,
          online_entry = $13,
          offline_entry = $14,
          last_updated_date = CURRENT_TIMESTAMP
        WHERE wb_id = $1
        RETURNING *;
      `;

      const values = [
        wbId,
        slip_no,
        slip_in_time,
        first_weight ? parseFloat(first_weight) : null,
        second_weight ? parseFloat(second_weight) : null,
        net_weight ? parseFloat(net_weight) : null,
        bardana_weight ? parseFloat(bardana_weight) : null,
        gross_weight ? parseFloat(gross_weight) : null,
        freight ? parseFloat(freight) : null,
        remarks,
        driver_name,
        slip_out_time,
        online_entry,
        offline_entry,
      ];

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Purchase record not found" });
      }

      // Also update the details table
      const {
        vehicle_no = null,
        vendor_name = null,
        po_no = null,
        igp_no = null,
        item_code = null,
        item_desc = null,
        po_qty = null,
        igp_qty = null,
        balance_qty = null,
        igp_date = null,
        weight_per_bags = null,
        no_of_bags = null,
        bardana_type = null,
      } = updateData;

      // Check if details record exists, then update or insert accordingly
      const checkQuery = `SELECT wb_item_p_id FROM wb_weighbridge_items_purchase WHERE wb_id = $1`;
      const checkResult = await pool.query(checkQuery, [wbId]);

      if (checkResult.rows.length > 0) {
        // Update existing record
        const detailsQuery = `
          UPDATE wb_weighbridge_items_purchase 
          SET 
            vehicle_no = $2,
            vendor_name = $3,
            po_no = $4,
            igp_no = $5,
            item_code = $6,
            item_desc = $7,
            po_qty = $8,
            igp_qty = $9,
            balance_qty = $10,
            igp_date = $11,
            weight_per_bags = $12,
            no_of_bags = $13,
            bardana_type = $14
          WHERE wb_id = $1
          RETURNING *;
        `;

        const detailsValues = [
          wbId,
          vehicle_no,
          vendor_name,
          po_no,
          igp_no,
          item_code,
          item_desc,
          po_qty ? parseFloat(po_qty) : null,
          igp_qty ? parseFloat(igp_qty) : null,
          balance_qty ? parseFloat(balance_qty) : null,
          igp_date,
          weight_per_bags ? parseFloat(weight_per_bags) : null,
          no_of_bags ? parseInt(no_of_bags) : null,
          bardana_type,
        ];

        await pool.query(detailsQuery, detailsValues);
      } else {
        // Insert new record
        const insertQuery = `
          INSERT INTO wb_weighbridge_items_purchase (
            wb_id, vehicle_no, vendor_name, po_no, igp_no, item_code, item_desc, po_qty, igp_qty, balance_qty, igp_date, weight_per_bags, no_of_bags, bardana_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *;
        `;

        const insertValues = [
          wbId,
          vehicle_no,
          vendor_name,
          po_no,
          igp_no,
          item_code,
          item_desc,
          po_qty ? parseFloat(po_qty) : null,
          igp_qty ? parseFloat(igp_qty) : null,
          balance_qty ? parseFloat(balance_qty) : null,
          igp_date,
          weight_per_bags ? parseFloat(weight_per_bags) : null,
          no_of_bags ? parseInt(no_of_bags) : null,
          bardana_type,
        ];

        await pool.query(insertQuery, insertValues);
      }

      console.log(`Updated purchase record: WB_ID ${wbId}`);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error updating purchase record:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to update purchase record",
        details: error.message,
      });
    }
  });

  // Sales endpoints
  // Deduction routes - save deduction data
  // GET deduction data by wb_id
  app.get("/api/deduction/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      const query = "SELECT * FROM deduction WHERE wb_id = $1 ORDER BY bag_id";
      const result = await pool.query(query, [parseInt(wbId)]);

      console.log(
        `Fetched ${result.rows.length} deduction records for wb_id ${wbId}`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching deduction data:", error);
      res.status(500).json({ error: "Failed to fetch deduction data" });
    }
  });

  app.post("/api/deduction/save", async (req: Request, res: Response) => {
    try {
      const { wbId, bagTableData } = req.body;

      console.log("Received deduction save request:", { wbId, bagTableData });

      if (!wbId || !bagTableData || bagTableData.length === 0) {
        return res.status(400).json({ error: "Missing required data" });
      }

      // Delete existing deduction entries for this wb_id
      await pool.query("DELETE FROM deduction WHERE wb_id = $1", [wbId]);

      // Save each deduction entry
      for (const item of bagTableData) {
        const query = `
          INSERT INTO deduction (wb_id, bags, pb, percentage, weight, total)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;

        const values = [
          wbId,
          item.bags,
          item.pb,
          item.percentage,
          typeof item.weight === "string"
            ? parseFloat(item.weight) || 0
            : item.weight,
          item.total || item.bags * item.pb,
        ];

        console.log("Inserting deduction record:", values);
        await pool.query(query, values);
      }

      console.log(
        `Successfully saved ${bagTableData.length} deduction records for wb_id ${wbId}`,
      );
      res.json({ success: true, message: "Deduction data saved successfully" });
    } catch (error: any) {
      console.error("Error saving deduction data:", error);
      res
        .status(500)
        .json({
          error: "Failed to save deduction data",
          details: error.message,
        });
    }
  });

  app.post("/api/sales/save", async (req: Request, res: Response) => {
    try {
      const { salesData, wbId, createdBy } = req.body;

      if (
        !salesData ||
        !Array.isArray(salesData) ||
        salesData.length === 0 ||
        !wbId
      ) {
        return res
          .status(400)
          .json({ error: "Sales data and wbId are required" });
      }

      const insertQuery = `
      INSERT INTO wb_weighbridge_items_purchase (
        wb_id, manual_dc_no, do_id, do_no,
        customer_id, customer_name, vehicle_no, do_date,
        item_id, item_code, item_desc,
        dc_qty, do_qty,
        created_by, creation_date
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13,
        $14, CURRENT_TIMESTAMP
      )
    `;

      for (const item of salesData) {
        const values = [
          parseInt(wbId), // wb_id (from request)
          item.dcNo || "", // manual_dc_no
          item.doId ? parseInt(item.doId) : null, // do_id
          item.doNo || "", // do_no
          item.customerId || null, // customer_id
          item.customerName || "", // customer_name
          item.vehicleNo || "", // vehicle_no
          item.doDate ? new Date(item.doDate) : null, // do_date
          item.itemId || null, // item_id
          item.itemCode || "", // item_code
          item.itemDescription || "", // item_desc
          item.dcQty ? parseFloat(item.dcQty) : null, // dc_qty
          item.doQty ? parseFloat(item.doQty) : null, // do_qty
          createdBy || null, // created_by (pass this from frontend)
        ];

        await pool.query(insertQuery, values);
      }

      console.log("✅ Sales items inserted into wb_weighbridge_items_purchase");
      res.status(200).json({ message: "Sales data saved successfully" });
    } catch (error: any) {
      console.error("❌ Error saving to wb_weighbridge_items_purchase:", error);
      res.status(500).json({ error: "Failed to save sales data" });
    }
  });

  // GET all sales data with branch filtering
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      const { branch_id } = req.query;

      let query = `
      SELECT 
        wb.wb_id,
        wb.slip_no,
        wb.entry_type,
        wb.first_weight,
        wb.second_weight,
        COALESCE(wbi.vehicle_no, '') as vehicle_no
      FROM wb_weighbridge wb 
      LEFT JOIN wb_weighbridge_items_purchase wbi ON wb.wb_id = wbi.wb_id
      WHERE wb.entry_type = 'SALE' 
        AND wb.first_weight IS NOT NULL 
        AND wb.first_weight > 0
        AND wb.online_entry = 'Yes'
    `;
      const params: any[] = [];

      if (branch_id && branch_id !== "all") {
        query += " AND wb.branch_id = $1";
        params.push(parseInt(branch_id as string));
      }

      query += " ORDER BY wb.wb_id DESC";

      console.log("Running query:", query, params);

      const result = await pool.query(query, params);

      console.log(`Fetched ${result.rows.length} sales records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ error: "Failed to fetch sales data" });
    }
  });

  // GET offline purchase records for reports with branch filtering
  app.get("/api/purchases/offline", async (req: Request, res: Response) => {
    try {
      const { branch_id } = req.query;
      let query = `
        SELECT 
          wb.wb_id,
          wb.slip_no,
          wb.slip_in_time,
          wb.slip_out_time,
          wb.entry_type,
          wb.online_entry,
          wb.branch_id,
          COALESCE(wbi.vendor_name, '') as vendor_name,
          COALESCE(wbi.vehicle_no, '') as vehicle_no
        FROM wb_weighbridge wb 
        LEFT JOIN wb_weighbridge_items_purchase wbi ON wb.wb_id = wbi.wb_id 
        WHERE wb.offline_entry = 'Yes' AND (wb.online_entry IS NULL OR wb.online_entry != 'Yes')
      `;
      const params: any[] = [];

      if (branch_id && branch_id !== "all") {
        query += " AND wb.branch_id = $1";
        params.push(parseInt(branch_id as string));
      }

      query += " ORDER BY wb.wb_id DESC";

      const result = await pool.query(query, params);

      console.log(`Fetched ${result.rows.length} offline purchase records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching offline purchase records:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch offline purchase records" });
    }
  });

  // PUT endpoint to convert offline entry to online
  app.put(
    "/api/purchase/convert-to-online/:wbId",
    async (req: Request, res: Response) => {
      try {
        const { wbId } = req.params;

        // Update the wb_weighbridge record to set online_entry = true
        const updateQuery = `
        UPDATE wb_weighbridge 
        SET online_entry = true, last_updated_date = NOW()
        WHERE wb_id = $1
        RETURNING *
      `;

        const result = await pool.query(updateQuery, [parseInt(wbId)]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Record not found" });
        }

        console.log(`Converted wb_id ${wbId} from offline to online`);
        res.json({
          message: "Entry converted to online successfully",
          record: result.rows[0],
        });
      } catch (error: any) {
        console.error("Error converting entry to online:", error);
        res.status(500).json({ error: "Failed to convert entry to online" });
      }
    },
  );

  // GET endpoint for generating next DO ID
  app.get("/api/sales/next-do-id", async (req, res) => {
    try {
      const query = "SELECT do_id FROM sales_details ORDER BY id DESC LIMIT 1";
      const result = await pool.query(query);

      let nextDoId = "DO001";
      if (result.rows.length > 0 && result.rows[0].do_id) {
        const currentNumber = parseInt(result.rows[0].do_id.replace("DO", ""));
        const nextNumber = currentNumber + 1;
        nextDoId = `DO${String(nextNumber).padStart(3, "0")}`;
      }

      res.json({ nextDoId });
    } catch (error: any) {
      console.error("Error generating next DO ID:", error);
      res.status(500).json({ error: "Failed to generate next DO ID" });
    }
  });

  // GET endpoint for generating next slip number by entry type
  app.get("/api/purchases/next-slip", async (req, res) => {
    try {
      const { entry_type } = req.query;

      if (!entry_type) {
        return res
          .status(400)
          .json({ error: "entry_type query parameter is required" });
      }

      const query = `
        SELECT slip_no FROM wb_weighbridge 
        WHERE entry_type = $1 AND slip_no ~ '^[0-9]+$'
        ORDER BY CAST(slip_no AS INTEGER) DESC 
        LIMIT 1
      `;

      const result = await pool.query(query, [entry_type.toUpperCase()]);

      let nextSlipNo = "1";
      if (result.rows.length > 0 && result.rows[0].slip_no) {
        const currentNumber = parseInt(result.rows[0].slip_no, 10);
        if (!isNaN(currentNumber)) {
          nextSlipNo = (currentNumber + 1).toString();
        }
      }

      console.log(
        `Generated next slip number for ${entry_type}: ${nextSlipNo}`,
      );
      res.json({ nextSlipNo });
    } catch (error: any) {
      console.error("Error generating next slip number:", error);
      res.status(500).json({ error: "Failed to generate next slip number" });
    }
  });

  // GET endpoint for fetching deduction data by WB_ID
  app.get("/api/deduction/:wbId", async (req, res) => {
    try {
      const { wbId } = req.params;

      const query = `
        SELECT * FROM deduction 
        WHERE wb_id = $1 
        ORDER BY bag_id
      `;

      const result = await pool.query(query, [wbId]);

      console.log(
        `Fetched ${result.rows.length} deduction records for WB_ID: ${wbId}`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching deduction data:", error);
      res.status(500).json({ error: "Failed to fetch deduction data" });
    }
  });

  // Weighbridge Settings Routes
  app.get("/api/weighbridge-settings", async (req, res) => {
    try {
      const query = "SELECT * FROM weighbridge_settings ORDER BY id LIMIT 1";
      const result = await pool.query(query);

      if (result.rows.length === 0) {
        return res.json({
          id: 1,
          port: "COM1",
          baudRate: 9600,
          dataBits: 8,
          stopBits: 1,
          parity: "none",
          autoCapture: false,
          threshold: 10.0,
          stabilityTime: 3000,
          tareEnabled: true,
          calibrationFactor: 1.0,
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching weighbridge settings:", error);
      res.status(500).json({ error: "Failed to fetch weighbridge settings" });
    }
  });

  // User Permissions Routes
  // Get user permissions
  app.get(
    "/api/users/:userId/permissions",
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;

        // First get user info
        const userResult = await pool.query(
          "SELECT username, (SELECT branch_name FROM branches WHERE branch_id = users.branchid) as branch_name FROM users WHERE userid = $1",
          [userId],
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get user permissions from role table
        const permissionsResult = await pool.query(
          `SELECT 
          role_name,
          home_menu, pur_form_menu, pur_form_online, pur_form_offline,
          sale_form_menu, sale_form_online, sale_form_offline, 
          sale_return_menu, sale_node_menu, reports, 
          camera_settings, wb_settings
         FROM role WHERE roleid = $1`,
          [userId],
        );

        let permissions = [];
        let role = "";

        if (permissionsResult.rows.length > 0) {
          const roleData = permissionsResult.rows[0];
          role = roleData.role_name || "";

          // Build permissions array based on role table columns
          if (roleData.home_menu === 1) permissions.push("home");
          if (roleData.pur_form_menu === 1) permissions.push("purchase_form");
          if (roleData.pur_form_online === 1)
            permissions.push("purchase_online");
          if (roleData.pur_form_offline === 1)
            permissions.push("purchase_offline");
          if (roleData.sale_form_menu === 1) permissions.push("sales_form");
          if (roleData.sale_form_online === 1) permissions.push("sales_online");
          if (roleData.sale_form_offline === 1)
            permissions.push("sales_offline");
          if (roleData.sale_return_menu === 1) permissions.push("sale_return");
          if (roleData.sale_node_menu === 1) permissions.push("sale_node");
          if (roleData.reports === 1) permissions.push("reports");
          if (roleData.camera_settings === 1)
            permissions.push("camera_settings");
          if (roleData.wb_settings === 1)
            permissions.push("weighbridge_settings");
        }

        res.json({
          userInfo: {
            userName: userResult.rows[0].username,
            branchName: userResult.rows[0].branch_name,
          },
          permissions: permissions,
          role: role,
        });
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Get user info by ID
  app.get("/api/users/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        "SELECT username FROM users WHERE userid = $1",
        [userId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ username: result.rows[0].username });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user permissions
  app.put(
    "/api/users/:userId/permissions",
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const { permissions, role } = req.body;

        // Check if user exists
        const userResult = await pool.query(
          "SELECT userid FROM users WHERE userid = $1",
          [userId],
        );
        if (userResult.rows.length === 0) {
          return res.status(404).json({ message: "User not found" });
        }

        // Convert permissions array to integer flags
        const permissionFlags = {
          home_menu: permissions.includes("home") ? 1 : 0,
          pur_form_menu: permissions.includes("purchase_form") ? 1 : 0,
          pur_form_online: permissions.includes("purchase_online") ? 1 : 0,
          pur_form_offline: permissions.includes("purchase_offline") ? 1 : 0,
          sale_form_menu: permissions.includes("sales_form") ? 1 : 0,
          sale_form_online: permissions.includes("sales_online") ? 1 : 0,
          sale_form_offline: permissions.includes("sales_offline") ? 1 : 0,
          sale_return_menu: permissions.includes("sale_return") ? 1 : 0,
          sale_node_menu: permissions.includes("sale_node") ? 1 : 0,
          reports: permissions.includes("reports") ? 1 : 0,
          camera_settings: permissions.includes("camera_settings") ? 1 : 0,
          wb_settings: permissions.includes("weighbridge_settings") ? 1 : 0,
        };

        // Insert or update role permissions
        await pool.query(
          `
        INSERT INTO role (
          roleid, role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline,
          sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, 
          sale_node_menu, reports, camera_settings, wb_settings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (roleid)
        DO UPDATE SET 
          role_name = EXCLUDED.role_name,
          home_menu = EXCLUDED.home_menu,
          pur_form_menu = EXCLUDED.pur_form_menu,
          pur_form_online = EXCLUDED.pur_form_online,
          pur_form_offline = EXCLUDED.pur_form_offline,
          sale_form_menu = EXCLUDED.sale_form_menu,
          sale_form_online = EXCLUDED.sale_form_online,
          sale_form_offline = EXCLUDED.sale_form_offline,
          sale_return_menu = EXCLUDED.sale_return_menu,
          sale_node_menu = EXCLUDED.sale_node_menu,
          reports = EXCLUDED.reports,
          camera_settings = EXCLUDED.camera_settings,
          wb_settings = EXCLUDED.wb_settings
      `,
          [
            userId,
            role,
            permissionFlags.home_menu,
            permissionFlags.pur_form_menu,
            permissionFlags.pur_form_online,
            permissionFlags.pur_form_offline,
            permissionFlags.sale_form_menu,
            permissionFlags.sale_form_online,
            permissionFlags.sale_form_offline,
            permissionFlags.sale_return_menu,
            permissionFlags.sale_node_menu,
            permissionFlags.reports,
            permissionFlags.camera_settings,
            permissionFlags.wb_settings,
          ],
        );

        res.json({ message: "Permissions updated successfully" });
      } catch (error) {
        console.error("Error updating user permissions:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  // Sales Return endpoints
  app.post("/api/sales-return/save", async (req: Request, res: Response) => {
    try {
      const { masterData, salesData } = req.body;

      if (!masterData) {
        return res.status(400).json({ error: "Master data is required" });
      }

      // Generate WB_ID
      const WB_ID = await generateWBID();

      // Insert master record
      const masterQuery = `
        INSERT INTO wb_weighbridge (
          wb_id, slip_no, slip_in_time, first_weight, second_weight, net_weight,
          bardana_weight, gross_weight, freight, remarks, driver_name, company_id,
          branch_id, online_entry, offline_entry, created_by, creation_date,
          last_updated_by, last_updated_date, manual_dc_no, entry_type,
          slip_out_time, status, slip_date, return_reason, return_date,
          original_slip_no, customer_name
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        )
        RETURNING *;
      `;

      const masterValues = [
        WB_ID,
        masterData.slip_no,
        masterData.slip_in_time,
        masterData.first_weight,
        masterData.second_weight,
        masterData.net_weight,
        masterData.bardana_weight,
        masterData.gross_weight,
        masterData.freight,
        masterData.remarks,
        masterData.driver_name,
        masterData.company_id,
        masterData.branch_id,
        masterData.online_entry,
        masterData.offline_entry,
        masterData.created_by,
        masterData.creation_date,
        masterData.last_updated_by,
        masterData.last_updated_date,
        masterData.manual_dc_no,
        "SALES_RETURN",
        masterData.slip_out_time,
        masterData.status,
        masterData.slip_date,
        masterData.return_reason,
        masterData.return_date,
        masterData.original_slip_no,
        masterData.customer_name,
      ];

      const masterResult = await pool.query(masterQuery, masterValues);

      // Insert sales data if provided
      if (salesData && Array.isArray(salesData) && salesData.length > 0) {
        for (const item of salesData) {
          const itemQuery = `
            INSERT INTO wb_weighbridge_items_purchase (
              wb_id, igp_no, po_no, customer_name, vehicle_no, do_date,
              item_desc, igp_qty, po_qty, dc_qty, do_qty
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;

          const itemValues = [
            WB_ID,
            item.dcNo || null,
            item.doNo || null,
            item.customerName || null,
            item.vehicleNo || null,
            item.doDate || null,
            item.itemDescription || null,
            item.dcQty ? parseFloat(item.dcQty) : null,
            item.doQty ? parseFloat(item.doQty) : null,
            item.dcQty ? parseFloat(item.dcQty) : null,
            item.doQty ? parseFloat(item.doQty) : null,
          ];

          await pool.query(itemQuery, itemValues);
        }
      }

      console.log("✅ Sales return data saved successfully");
      res.json({
        success: true,
        wb_id: WB_ID,
        message: "Sales return data saved successfully",
      });
    } catch (error: any) {
      console.error("❌ Error saving sales return data:", error);
      res
        .status(500)
        .json({
          error: "Failed to save sales return data",
          details: error.message,
        });
    }
  });

  // Update sales return by wb_id
  app.put(
    "/api/sales-return/update/:wbId",
    async (req: Request, res: Response) => {
      try {
        const { wbId } = req.params;
        const { masterData, salesData } = req.body;

        console.log("🔄 Updating sales return data for wb_id:", wbId);
        console.log("📝 Master data:", masterData);
        console.log("📋 Sales data:", salesData);

        // Update master record
        const updateMasterQuery = `
        UPDATE wb_weighbridge SET 
          slip_in_time = $2, first_weight = $3, second_weight = $4, 
          net_weight = $5, bardana_weight = $6, gross_weight = $7, 
          freight = $8, remarks = $9, driver_name = $10, 
          company_id = $11, branch_id = $12, online_entry = $13, 
          offline_entry = $14, last_updated_by = $15, last_updated_date = $16, 
          manual_dc_no = $17, slip_out_time = $18, status = $19, 
          slip_date = $20, return_reason = $21, return_date = $22, 
          original_slip_no = $23, customer_name = $24, vehicle_no = $25
        WHERE wb_id = $1 AND entry_type = 'SALES_RETURN'
      `;

        const updateMasterValues = [
          parseInt(wbId),
          masterData.slip_in_time,
          masterData.first_weight,
          masterData.second_weight,
          masterData.net_weight,
          masterData.bardana_weight,
          masterData.gross_weight,
          masterData.freight,
          masterData.remarks,
          masterData.driver_name,
          masterData.company_id,
          masterData.branch_id,
          masterData.online_entry,
          masterData.offline_entry,
          masterData.last_updated_by,
          masterData.last_updated_date,
          masterData.manual_dc_no,
          masterData.slip_out_time,
          masterData.status,
          masterData.slip_date,
          masterData.return_reason,
          masterData.return_date,
          masterData.original_slip_no,
          masterData.customer_name,
          masterData.vehicle_no,
        ];

        await pool.query(updateMasterQuery, updateMasterValues);

        // Delete existing sales data for this wb_id
        await pool.query(
          "DELETE FROM wb_weighbridge_items_purchase WHERE wb_id = $1",
          [parseInt(wbId)],
        );

        // Insert updated sales data
        if (salesData && salesData.length > 0) {
          for (const item of salesData) {
            const itemQuery = `
            INSERT INTO wb_weighbridge_items_purchase (
              wb_id, igp_no, po_no, customer_name, vehicle_no, 
              igp_date, item_desc, igp_qty, po_qty, 
              dc_qty, do_qty
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;

            const itemValues = [
              parseInt(wbId),
              item.dcNo || null,
              item.doNo || null,
              item.customerName || null,
              item.vehicleNo || null,
              item.doDate || null,
              item.itemDescription || null,
              item.dcQty ? parseFloat(item.dcQty) : null,
              item.doQty ? parseFloat(item.doQty) : null,
              item.dcQty ? parseFloat(item.dcQty) : null,
              item.doQty ? parseFloat(item.doQty) : null,
            ];

            await pool.query(itemQuery, itemValues);
          }
        }

        console.log("✅ Sales return data updated successfully");
        res.json({
          success: true,
          wb_id: parseInt(wbId),
          message: "Sales return data updated successfully",
        });
      } catch (error: any) {
        console.error("❌ Error updating sales return data:", error);
        res
          .status(500)
          .json({
            error: "Failed to update sales return data",
            details: error.message,
          });
      }
    },
  );

  // Get sales return by wb_id
  app.get("/api/sales-return/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;

      const masterQuery =
        "SELECT * FROM wb_weighbridge WHERE wb_id = $1 AND entry_type = $2";
      const masterResult = await pool.query(masterQuery, [
        parseInt(wbId),
        "SALES_RETURN",
      ]);

      if (masterResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "No sales return record found for this wb_id" });
      }

      const master = masterResult.rows[0];

      const detailsQuery =
        "SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1";
      const detailsResult = await pool.query(detailsQuery, [master.wb_id]);

      console.log(`Fetched sales return record for wb_id ${wbId}`);
      res.json({
        masterData: master,
        salesData: detailsResult.rows,
      });
    } catch (error: any) {
      console.error("Error fetching sales return by wb_id:", error);
      res.status(500).json({ error: "Failed to fetch sales return record" });
    }
  });

  // Purchase Return endpoints
  app.post("/api/purchase-return/save", async (req: Request, res: Response) => {
    try {
      const { masterData } = req.body;

      if (!masterData) {
        return res.status(400).json({ error: "Master data is required" });
      }

      // Generate WB_ID
      const WB_ID = await generateWBID();

      // Insert master record
      const masterQuery = `
        INSERT INTO wb_weighbridge (
          wb_id, slip_no, slip_in_time, first_weight, second_weight, net_weight,
          bardana_weight, gross_weight, freight, remarks, driver_name, company_id,
          branch_id, online_entry, offline_entry, created_by, creation_date,
          last_updated_by, last_updated_date, manual_dc_no, entry_type,
          slip_out_time, status, slip_date, return_reason, return_date,
          original_slip_no, vehicle_no
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        )
        RETURNING *;
      `;

      const masterValues = [
        WB_ID,
        masterData.slip_no,
        masterData.slip_in_time,
        masterData.first_weight ? parseFloat(masterData.first_weight) : null,
        masterData.second_weight ? parseFloat(masterData.second_weight) : null,
        masterData.net_weight ? parseFloat(masterData.net_weight) : null,
        masterData.bardana_weight
          ? parseFloat(masterData.bardana_weight)
          : null,
        masterData.gross_weight ? parseFloat(masterData.gross_weight) : null,
        masterData.freight ? parseFloat(masterData.freight) : null,
        masterData.remarks,
        masterData.driver_name,
        masterData.company_id ? parseInt(masterData.company_id) : null,
        masterData.branch_id ? parseInt(masterData.branch_id) : null,
        masterData.online_entry,
        masterData.offline_entry,
        masterData.created_by,
        masterData.creation_date,
        masterData.last_updated_by,
        masterData.last_updated_date,
        masterData.manual_dc_no,
        "PURCHASE_RETURN",
        masterData.slip_out_time,
        masterData.status,
        masterData.slip_date,
        masterData.return_reason,
        masterData.return_date,
        masterData.original_slip_no,
        masterData.vehicle_no,
      ];

      const masterResult = await pool.query(masterQuery, masterValues);

      // Insert purchase return item data
      const itemQuery = `
        INSERT INTO wb_weighbridge_items_purchase (
          wb_id, igp_no, vendor_name, item_desc, no_of_bags, weight_per_bags,
          bardana_type, vehicle_no
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      const itemValues = [
        WB_ID,
        masterData.igp_no || null,
        masterData.vendor || null,
        masterData.item_desc || null,
        masterData.no_of_bags ? parseInt(masterData.no_of_bags) : null,
        masterData.wt_per_bag ? parseFloat(masterData.wt_per_bag) : null,
        masterData.bardana_type || null,
        masterData.vehicle_no || null,
      ];

      await pool.query(itemQuery, itemValues);

      console.log("✅ Purchase return data saved successfully");
      res.json({
        success: true,
        wb_id: WB_ID,
        message: "Purchase return data saved successfully",
      });
    } catch (error: any) {
      console.error("❌ Error saving purchase return data:", error);
      res
        .status(500)
        .json({
          error: "Failed to save purchase return data",
          details: error.message,
        });
    }
  });

  // Update purchase return by wb_id
  app.put(
    "/api/purchase-return/update/:wbId",
    async (req: Request, res: Response) => {
      try {
        const { wbId } = req.params;
        const { masterData } = req.body;

        console.log("🔄 Updating purchase return data for wb_id:", wbId);
        console.log("📝 Master data:", masterData);

        // Update master record
        const updateMasterQuery = `
        UPDATE wb_weighbridge SET 
          slip_in_time = $2, first_weight = $3, second_weight = $4, 
          net_weight = $5, bardana_weight = $6, gross_weight = $7, 
          freight = $8, remarks = $9, driver_name = $10, 
          company_id = $11, branch_id = $12, online_entry = $13, 
          offline_entry = $14, last_updated_by = $15, last_updated_date = $16, 
          manual_dc_no = $17, slip_out_time = $18, status = $19, 
          slip_date = $20, return_reason = $21, return_date = $22, 
          original_slip_no = $23, vehicle_no = $24
        WHERE wb_id = $1 AND entry_type = 'PURCHASE_RETURN'
      `;

        const updateMasterValues = [
          parseInt(wbId),
          masterData.slip_in_time,
          masterData.first_weight ? parseFloat(masterData.first_weight) : null,
          masterData.second_weight
            ? parseFloat(masterData.second_weight)
            : null,
          masterData.net_weight ? parseFloat(masterData.net_weight) : null,
          masterData.bardana_weight
            ? parseFloat(masterData.bardana_weight)
            : null,
          masterData.gross_weight ? parseFloat(masterData.gross_weight) : null,
          masterData.freight ? parseFloat(masterData.freight) : null,
          masterData.remarks,
          masterData.driver_name,
          masterData.company_id ? parseInt(masterData.company_id) : null,
          masterData.branch_id ? parseInt(masterData.branch_id) : null,
          masterData.online_entry,
          masterData.offline_entry,
          masterData.last_updated_by,
          masterData.last_updated_date,
          masterData.manual_dc_no,
          masterData.slip_out_time,
          masterData.status,
          masterData.slip_date,
          masterData.return_reason,
          masterData.return_date,
          masterData.original_slip_no,
          masterData.vehicle_no,
        ];

        await pool.query(updateMasterQuery, updateMasterValues);

        // Update the details table
        const updateDetailsQuery = `
        UPDATE wb_weighbridge_items_purchase 
        SET 
          igp_no = $2,
          vendor_name = $3,
          item_desc = $4,
          no_of_bags = $5,
          weight_per_bags = $6,
          bardana_type = $7,
          vehicle_no = $8
        WHERE wb_id = $1
      `;

        const updateDetailsValues = [
          parseInt(wbId),
          masterData.igp_no || null,
          masterData.vendor || null,
          masterData.item_desc || null,
          masterData.no_of_bags ? parseInt(masterData.no_of_bags) : null,
          masterData.wt_per_bag ? parseFloat(masterData.wt_per_bag) : null,
          masterData.bardana_type || null,
          masterData.vehicle_no || null,
        ];

        await pool.query(updateDetailsQuery, updateDetailsValues);

        console.log("✅ Purchase return data updated successfully");
        res.json({
          success: true,
          wb_id: parseInt(wbId),
          message: "Purchase return data updated successfully",
        });
      } catch (error: any) {
        console.error("❌ Error updating purchase return data:", error);
        res
          .status(500)
          .json({
            error: "Failed to update purchase return data",
            details: error.message,
          });
      }
    },
  );

  // Get purchase return by wb_id
  app.get("/api/purchase-return/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;

      const masterQuery =
        "SELECT * FROM wb_weighbridge WHERE wb_id = $1 AND entry_type = $2";
      const masterResult = await pool.query(masterQuery, [
        parseInt(wbId),
        "PURCHASE_RETURN",
      ]);

      if (masterResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "No purchase return record found for this wb_id" });
      }

      const master = masterResult.rows[0];

      const detailsQuery =
        "SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1";
      const detailsResult = await pool.query(detailsQuery, [master.wb_id]);

      console.log(`Fetched purchase return record for wb_id ${wbId}`);
      res.json({
        masterData: master,
        details: detailsResult.rows,
      });
    } catch (error: any) {
      console.error("Error fetching purchase return by wb_id:", error);
      res.status(500).json({ error: "Failed to fetch purchase return record" });
    }
  });

  // Database wake-up endpoint for return forms
  app.get("/api/db/wake", async (req: Request, res: Response) => {
    try {
      await pool.query("SELECT 1");
      res.json({ success: true, message: "Database is awake" });
    } catch (error: any) {
      console.error("Database wake-up failed:", error);
      res.status(500).json({ error: "Database wake-up failed" });
    }
  });

  // GET items from inv_items table for dropdown
  app.get("/api/inv-items", async (req: Request, res: Response) => {
    try {
      const query = "SELECT item_id, item_code, item_desc, uom, weight_in_kg FROM inv_items ORDER BY item_code";
      const result = await pool.query(query);

      console.log(`Fetched ${result.rows.length} items from inv_items table`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching items from inv_items:", error);
      res.status(500).json({ error: "Failed to fetch items from inv_items table" });
    }
  });

  // WB Role endpoints for the new wb_role table

  // Save role to wb_role table
  app.post("/api/wb-role/save", async (req: Request, res: Response) => {
    try {
      const { roleid, role_name, permissions } = req.body;

      if (!roleid || !role_name) {
        return res
          .status(400)
          .json({ error: "Roleid and role_name are required" });
      }

      // Convert permissions array to integer flags (1 for true, 0 for false)
      const permissionFlags = {
        home_menu: permissions.includes("home") ? 1 : 0,
        pur_form_menu: permissions.includes("purchaseForm") ? 1 : 0,
        pur_form_online: permissions.includes("purchaseOnline") ? 1 : 0,
        pur_form_offline: permissions.includes("purchaseOffline") ? 1 : 0,
        sale_form_menu: permissions.includes("salesForm") ? 1 : 0,
        sale_form_online: permissions.includes("salesOnline") ? 1 : 0,
        sale_form_offline: permissions.includes("salesOffline") ? 1 : 0,
        sale_return_menu: permissions.includes("saleReturn") ? 1 : 0,
        sale_node_menu: permissions.includes("saleNode") ? 1 : 0,
        reports: permissions.includes("reports") ? 1 : 0,
        camera_settings: permissions.includes("cameraSettings") ? 1 : 0,
        wb_settings: permissions.includes("weighbridgeSettings") ? 1 : 0,
      };

      // Insert or update the wb_role record
      const query = `
        INSERT INTO wb_role (
          "Roleid", role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline,
          sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu,
          sale_node_menu, reports, camera_settings, wb_settings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT ("Roleid")
        DO UPDATE SET
          role_name = EXCLUDED.role_name,
          home_menu = EXCLUDED.home_menu,
          pur_form_menu = EXCLUDED.pur_form_menu,
          pur_form_online = EXCLUDED.pur_form_online,
          pur_form_offline = EXCLUDED.pur_form_offline,
          sale_form_menu = EXCLUDED.sale_form_menu,
          sale_form_online = EXCLUDED.sale_form_online,
          sale_form_offline = EXCLUDED.sale_form_offline,
          sale_return_menu = EXCLUDED.sale_return_menu,
          sale_node_menu = EXCLUDED.sale_node_menu,
          reports = EXCLUDED.reports,
          camera_settings = EXCLUDED.camera_settings,
          wb_settings = EXCLUDED.wb_settings
        RETURNING *;
      `;

      const values = [
        parseInt(roleid),
        role_name,
        permissionFlags.home_menu,
        permissionFlags.pur_form_menu,
        permissionFlags.pur_form_online,
        permissionFlags.pur_form_offline,
        permissionFlags.sale_form_menu,
        permissionFlags.sale_form_online,
        permissionFlags.sale_form_offline,
        permissionFlags.sale_return_menu,
        permissionFlags.sale_node_menu,
        permissionFlags.reports,
        permissionFlags.camera_settings,
        permissionFlags.wb_settings,
      ];

      const result = await pool.query(query, values);

      console.log("✅ Role saved to wb_role table:", result.rows[0]);
      res.json({
        success: true,
        message: "Role saved successfully",
        role: result.rows[0],
      });
    } catch (error: any) {
      console.error("❌ Error saving to wb_role table:", error);
      res.status(500).json({
        error: "Failed to save role",
        details: error.message,
      });
    }
  });

  // Get all roles from wb_role table
  app.get("/api/wb-role/list", async (req: Request, res: Response) => {
    try {
      const query = 'SELECT * FROM wb_role ORDER BY "Roleid"';
      const result = await pool.query(query);

      console.log(`✅ Fetched ${result.rows.length} roles from wb_role table`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("❌ Error fetching wb_role data:", error);
      res.status(500).json({
        error: "Failed to fetch roles",
        details: error.message,
      });
    }
  });

  // Get specific role by roleid from wb_role table
  app.get("/api/wb-role/:roleid", async (req: Request, res: Response) => {
    try {
      const { roleid } = req.params;
      const query = 'SELECT * FROM wb_role WHERE "Roleid" = $1';
      const result = await pool.query(query, [parseInt(roleid)]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Role not found" });
      }

      console.log(`✅ Fetched role ${roleid} from wb_role table`);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("❌ Error fetching wb_role by id:", error);
      res.status(500).json({
        error: "Failed to fetch role",
        details: error.message,
      });
    }
  });

  // Delete role from wb_role table
  app.delete("/api/wb-role/:roleid", async (req: Request, res: Response) => {
    try {
      const { roleid } = req.params;
      const query = 'DELETE FROM wb_role WHERE "Roleid" = $1 RETURNING *';
      const result = await pool.query(query, [parseInt(roleid)]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Role not found" });
      }

      console.log(`✅ Deleted role ${roleid} from wb_role table`);
      res.json({
        success: true,
        message: "Role deleted successfully",
        deletedRole: result.rows[0],
      });
    } catch (error: any) {
      console.error("❌ Error deleting from wb_role table:", error);
      res.status(500).json({
        error: "Failed to delete role",
        details: error.message,
      });
    }
  });

  // Create role table if it doesn't exist
  app.post("/api/create-role-table", async (req: Request, res: Response) => {
    try {
      // Check if table exists first
      const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role'
      )
    `);

      if (!tableExists.rows[0].exists) {
        await pool.query(`
        CREATE TABLE role (
          roleid SERIAL PRIMARY KEY,
          role_name VARCHAR(100),
          home_menu INTEGER DEFAULT 0,
          pur_form_menu INTEGER DEFAULT 0,
          pur_form_online INTEGER DEFAULT 0,
          pur_form_offline INTEGER DEFAULT 0,
          sale_form_menu INTEGER DEFAULT 0,
          sale_form_online INTEGER DEFAULT 0,
          sale_form_offline INTEGER DEFAULT 0,
          sale_return_menu INTEGER DEFAULT 0,
          sale_node_menu INTEGER DEFAULT 0,
          reports INTEGER DEFAULT 0,
          camera_settings INTEGER DEFAULT 0,
          wb_settings INTEGER DEFAULT 0
        )
      `);

        // Insert default roles
        await pool.query(`
        INSERT INTO role (role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline, sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, sale_node_menu, reports, camera_settings, wb_settings)
        VALUES 
        ('Admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
        ('Office', 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0),
        ('HOD', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0),
        ('Employee', 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0)
      `);
      } else {
        // Table exists, check if it has data
        const existingRoles = await pool.query("SELECT COUNT(*) FROM role");
        if (parseInt(existingRoles.rows[0].count) === 0) {
          await pool.query(`
          INSERT INTO role (role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline, sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, sale_node_menu, reports, camera_settings, wb_settings)
          VALUES 
          ('Admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
          ('Office', 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0),
          ('HOD', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0),
          ('Employee', 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0)
        `);
        }
      }

      res.json({ success: true, message: "Role table ready" });
    } catch (error) {
      console.error("Error with role table:", error);
      res.status(500).json({ message: "Failed to setup role table" });
    }
  });

  // Role management endpoint
  app.get("/api/user-roles", async (req: Request, res: Response) => {
    try {
      // Check if table exists
      const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role'
      )
    `);

      if (!tableExists.rows[0].exists) {
        // Return empty array if table doesn't exist
        return res.json([]);
      }

      const result = await pool.query("SELECT * FROM role ORDER BY roleid");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  });

  // Save role assignment endpoint
  app.post("/api/save-role", async (req: Request, res: Response) => {
    try {
      const { roleName, permissions } = req.body;

      const query = `
      INSERT INTO role (role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline, sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, sale_node_menu, reports, camera_settings, wb_settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING roleid
    `;

      const values = [
        roleName,
        permissions.homeMenu ? 1 : 0,
        permissions.purFormMenu ? 1 : 0,
        permissions.purFormOnline ? 1 : 0,
        permissions.purFormOffline ? 1 : 0,
        permissions.saleFormMenu ? 1 : 0,
        permissions.saleFormOnline ? 1 : 0,
        permissions.saleFormOffline ? 1 : 0,
        permissions.saleReturnMenu ? 1 : 0,
        permissions.saleNodeMenu ? 1 : 0,
        permissions.reports ? 1 : 0,
        permissions.cameraSettings ? 1 : 0,
        permissions.wbSettings ? 1 : 0,
      ];

      const result = await pool.query(query, values);
      res.json({ success: true, roleId: result.rows[0].roleid });
    } catch (error) {
      console.error("Error saving role:", error);
      res.status(500).json({ message: "Failed to save role" });
    }
  });

  // Get Data API endpoint - fetch data from URL and save to inv_items table
  app.post("/api/fetch-and-save-data", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      console.log("Received fetch request for URL:", url);

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Fetch data from the provided URL using native fetch (Node.js 18+)
      console.log("Fetching data from:", url);
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `Fetch failed with status: ${response.status} ${response.statusText}`,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Data fetched successfully, type:",
        typeof data,
        "isArray:",
        Array.isArray(data),
      );

      // Create inv_items table if it doesn't exist (matching your existing structure)
      console.log("Creating/ensuring inv_items table exists...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS inv_items (
          item_id SERIAL PRIMARY KEY,
          item_code VARCHAR(50) NOT NULL UNIQUE,
          item_desc TEXT,
          uom VARCHAR(10),
          weight_in_kg DECIMAL(10, 2)
        )
      `);

      let recordsInserted = 0;

      // Helper function to insert item into database
      const insertItemToDatabase = async (item: any, sourceUrl: string) => {
        try {
          const query = `
            INSERT INTO inv_items (
              item_code, item_desc, uom, weight_in_kg
            )
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (item_code) DO UPDATE SET
              item_desc = EXCLUDED.item_desc,
              uom = EXCLUDED.uom,
              weight_in_kg = EXCLUDED.weight_in_kg
          `;

          const values = [
            item.item_code || item.code || item.id || item.ITEM_CODE || `ITEM_${Date.now()}`,
            item.item_desc || item.description || item.desc || item.ITEM_DESC || item.name || item.title || null,
            item.uom || item.unit || item.UOM || item.UNIT || null,
            item.weight_in_kg || item.weight || item.kg || item.WEIGHT_IN_KG || null,
          ];

          await pool.query(query, values);
          console.log(
            "Inserted item:",
            item.item_code || item.code || item.id || "unknown",
          );
        } catch (insertError: any) {
          console.error("Error inserting item:", insertError.message);
          throw insertError;
        }
      };

      // Handle different data structures
      if (Array.isArray(data)) {
        console.log(`Processing array of ${data.length} items...`);
        // If data is an array, insert each item
        for (const item of data) {
          await insertItemToDatabase(item, url);
          recordsInserted++;
        }
      } else if (
        data &&
        typeof data === "object" &&
        data.items &&
        Array.isArray(data.items)
      ) {
        console.log(`Processing nested array of ${data.items.length} items...`);
        // If data has an items array property
        for (const item of data.items) {
          await insertItemToDatabase(item, url);
          recordsInserted++;
        }
      } else if (typeof data === "object" && data !== null) {
        console.log("Processing single object...");
        // If data is a single object, insert it
        await insertItemToDatabase(data, url);
        recordsInserted = 1;
      } else {
        throw new Error("Invalid data format received from URL");
      }

      console.log(
        `✅ Successfully saved ${recordsInserted} records to inv_items table from ${url}`,
      );

      res.json({
        success: true,
        message: "Data fetched and saved successfully",
        recordsInserted,
        data: Array.isArray(data)
          ? data.slice(0, 5)
          : data.items
            ? data.items.slice(0, 5)
            : data,
      });
    } catch (error: any) {
      console.error("❌ Error fetching and saving data:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to fetch and save data",
        details: error.message,
      });
    }
  });

  // Fetch and save vendors API endpoint - dynamically check columns and save to correct table
  app.post("/api/fetch-and-save-vendors", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      console.log("Received fetch vendors request for URL:", url);

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Fetch data from the provided URL using native fetch (Node.js 18+)
      console.log("Fetching data from:", url);
      const response = await fetch(url);

      if (!response.ok) {
        console.error(
          `Fetch failed with status: ${response.status} ${response.statusText}`,
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Data fetched successfully, type:",
        typeof data,
        "isArray:",
        Array.isArray(data),
      );

      // Get sample data to check column structure
      let sampleItem = null;
      if (Array.isArray(data) && data.length > 0) {
        sampleItem = data[0];
      } else if (data && typeof data === "object" && data.vendors && Array.isArray(data.vendors) && data.vendors.length > 0) {
        sampleItem = data.vendors[0];
      } else if (data && typeof data === "object" && data.items && Array.isArray(data.items) && data.items.length > 0) {
        sampleItem = data.items[0];
      } else if (typeof data === "object" && data !== null) {
        sampleItem = data;
      }

      if (!sampleItem) {
        throw new Error("No data found to process");
      }

      // Check column structure to determine target table
      const sampleKeys = Object.keys(sampleItem).map(key => key.toLowerCase());
      
      // Define column patterns for each table
      const vendorColumns = ['vendor_name', 'name', 'vendor', 'supplier'];
      const customerColumns = ['customer_name', 'customer', 'client', 'buyer'];
      const itemColumns = ['item_code', 'item_desc', 'uom', 'weight_in_kg', 'code', 'description'];
      
      // Check which table columns match better
      const vendorMatches = vendorColumns.filter(col => 
        sampleKeys.some(key => key.includes(col) || col.includes(key))
      ).length;
      
      const customerMatches = customerColumns.filter(col => 
        sampleKeys.some(key => key.includes(col) || col.includes(key))
      ).length;
      
      const itemMatches = itemColumns.filter(col => 
        sampleKeys.some(key => key.includes(col) || col.includes(key))
      ).length;

      let targetTable = 'inv_vendors'; // default
      let tableName = 'inv_vendors';
      
      if (itemMatches > Math.max(vendorMatches, customerMatches)) {
        targetTable = 'inv_items';
        tableName = 'inv_items';
      } else if (customerMatches > vendorMatches) {
        targetTable = 'inv_customers';
        tableName = 'inv_customers';
      }

      console.log(`Column analysis: vendor matches: ${vendorMatches}, customer matches: ${customerMatches}, item matches: ${itemMatches}`);
      console.log(`Target table determined: ${targetTable}`);

      // Create appropriate table
      if (targetTable === 'inv_vendors') {
        console.log("Creating/ensuring inv_vendors table exists...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inv_vendors (
            vendor_id SERIAL PRIMARY KEY,
            vendor_name character varying(2000) COLLATE pg_catalog."default"
          )
        `);
      } else if (targetTable === 'inv_customers') {
        console.log("Creating/ensuring inv_customers table exists...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inv_customers (
            customer_id SERIAL PRIMARY KEY,
            customer_name VARCHAR(100) NOT NULL,
            sale_person_id INT,
            active BOOLEAN DEFAULT TRUE
          )
        `);
      } else {
        console.log("Creating/ensuring inv_items table exists...");
        await pool.query(`
          CREATE TABLE IF NOT EXISTS inv_items (
            item_id SERIAL PRIMARY KEY,
            item_code VARCHAR(50) NOT NULL UNIQUE,
            item_desc TEXT,
            uom VARCHAR(10),
            weight_in_kg DECIMAL(10, 2)
          )
        `);
      }

      let recordsInserted = 0;

      // Helper function to insert data into appropriate table
      const insertDataToDatabase = async (item: any, sourceUrl: string) => {
        try {
          if (targetTable === 'inv_vendors') {
            const query = `
              INSERT INTO inv_vendors (vendor_name)
              VALUES ($1)
              ON CONFLICT DO NOTHING
            `;

            const vendorName = item.vendor_name || item.name || item.VENDOR_NAME || item.NAME || item.title || item.label || `VENDOR_${Date.now()}`;
            const values = [vendorName];

            await pool.query(query, values);
            console.log("Inserted vendor:", vendorName);
          } else if (targetTable === 'inv_customers') {
            const query = `
              INSERT INTO inv_customers (customer_name, sale_person_id, active)
              VALUES ($1, $2, $3)
              ON CONFLICT DO NOTHING
            `;

            const customerName = item.customer_name || item.name || item.CUSTOMER_NAME || item.NAME || item.title || item.label || item.customer || item.client || item.buyer || `CUSTOMER_${Date.now()}`;
            const salePersonId = item.sale_person_id || item.salesperson_id || item.sales_person_id || item.SALE_PERSON_ID || null;
            const active = item.active !== undefined ? item.active : (item.status === 'active' || item.STATUS === 'ACTIVE' || true);

            const values = [customerName, salePersonId, active];

            await pool.query(query, values);
            console.log("Inserted customer:", customerName);
          } else {
            const query = `
              INSERT INTO inv_items (
                item_code, item_desc, uom, weight_in_kg
              )
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (item_code) DO UPDATE SET
                item_desc = EXCLUDED.item_desc,
                uom = EXCLUDED.uom,
                weight_in_kg = EXCLUDED.weight_in_kg
            `;

            const values = [
              item.item_code || item.code || item.id || item.ITEM_CODE || `ITEM_${Date.now()}`,
              item.item_desc || item.description || item.desc || item.ITEM_DESC || item.name || item.title || null,
              item.uom || item.unit || item.UOM || item.UNIT || null,
              item.weight_in_kg || item.weight || item.kg || item.WEIGHT_IN_KG || null,
            ];

            await pool.query(query, values);
            console.log("Inserted item:", item.item_code || item.code || item.id || "unknown");
          }
        } catch (insertError: any) {
          console.error("Error inserting data:", insertError.message);
          throw insertError;
        }
      };

      // Handle different data structures
      if (Array.isArray(data)) {
        console.log(`Processing array of ${data.length} records...`);
        for (const item of data) {
          await insertDataToDatabase(item, url);
          recordsInserted++;
        }
      } else if (
        data &&
        typeof data === "object" &&
        data.vendors &&
        Array.isArray(data.vendors)
      ) {
        console.log(`Processing nested array of ${data.vendors.length} records...`);
        for (const item of data.vendors) {
          await insertDataToDatabase(item, url);
          recordsInserted++;
        }
      } else if (
        data &&
        typeof data === "object" &&
        data.items &&
        Array.isArray(data.items)
      ) {
        console.log(`Processing nested array of ${data.items.length} records...`);
        for (const item of data.items) {
          await insertDataToDatabase(item, url);
          recordsInserted++;
        }
      } else if (typeof data === "object" && data !== null) {
        console.log("Processing single object...");
        await insertDataToDatabase(data, url);
        recordsInserted = 1;
      } else {
        throw new Error("Invalid data format received from URL");
      }

      console.log(
        `✅ Successfully saved ${recordsInserted} records to ${tableName} table from ${url}`,
      );

      res.json({
        success: true,
        message: `Data fetched and saved successfully to ${tableName}`,
        recordsInserted,
        targetTable: tableName,
        data: Array.isArray(data)
          ? data.slice(0, 5)
          : data.vendors
            ? data.vendors.slice(0, 5)
            : data.items
              ? data.items.slice(0, 5)
              : data,
      });
    } catch (error: any) {
      console.error("❌ Error fetching and saving data:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to fetch and save data",
        details: error.message,
      });
    }
  });

  // GET all unique DO numbers from wb_weighbridge_items_purchase table
  app.get("/api/do-numbers", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT do_no 
        FROM wb_weighbridge_items_purchase 
        WHERE do_no IS NOT NULL AND do_no != '' 
        ORDER BY do_no
      `;
      const result = await pool.query(query);
      
      const doNumbers = result.rows.map(row => row.do_no);
      
      console.log(`Fetched ${doNumbers.length} unique DO numbers`);
      res.json(doNumbers);
    } catch (error: any) {
      console.error("Error fetching DO numbers:", error);
      res.status(500).json({ error: "Failed to fetch DO numbers" });
    }
  });

  // GET data related to specific DO number
  app.get("/api/do-data/:doNo", async (req: Request, res: Response) => {
    try {
      const { doNo } = req.params;
      
      const query = `
        SELECT 
          wbi.do_no,
          wb.slip_no,
          wbi.vehicle_no,
          wbi.item_desc,
          wbi.customer_name,
          wbi.do_qty,
          wbi.dc_qty,
          wbi.do_date,
          wb.freight,
          wb.remarks,
          wbi.do_date as delivery_term
        FROM wb_weighbridge_items_purchase wbi
        LEFT JOIN wb_weighbridge wb ON wbi.wb_id = wb.wb_id
        WHERE wbi.do_no = $1
      `;
      
      const result = await pool.query(query, [doNo]);
      
      console.log(`Fetched ${result.rows.length} records for DO number: ${doNo}`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching DO data:", error);
      res.status(500).json({ error: "Failed to fetch DO data" });
    }
  });

  // Voucher API endpoints for gl_vouchers table
  
  // Create gl_vouchers table if it doesn't exist
  app.post("/api/create-vouchers-table", async (req: Request, res: Response) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS gl_vouchers (
          voucher_id         SERIAL PRIMARY KEY,
          voucher_type       VARCHAR(20),
          voucher_no         INTEGER,
          voucher_date       DATE NOT NULL,
          description        VARCHAR(1000),
          batch_id           INTEGER,
          created_by         INTEGER,
          creation_date      DATE,
          last_updated_by    INTEGER,
          last_update_date   DATE,
          status             VARCHAR(50),
          approved_by        INTEGER,
          approval_date      DATE,
          posted_by          INTEGER,
          posting_date       DATE,
          branch_id          VARCHAR(30),
          module             VARCHAR(20),
          module_doc         VARCHAR(50),
          module_doc_id      INTEGER,
          reference_no       VARCHAR(30),
          checked_by         INTEGER,
          checked_date       DATE,
          currency           VARCHAR(20),
          exchange_rate      NUMERIC(16,4),
          fe_voucher         CHAR(1),
          ref_date           DATE,
          paid_amount        NUMERIC(20,4),
          acc_id             BIGINT,
          canceled_by        BIGINT,
          canceled_date      DATE,
          closed             CHAR(1),
          voucher_site       CHAR(1),
          sale_purchase      VARCHAR(30),
          dc_igp_id          BIGINT,
          bank_id            INTEGER,
          wh_tax_id          INTEGER,
          wh_tax_amt         NUMERIC(16),
          company_id         BIGINT,
          cpv_type           VARCHAR(30),
          company_type       VARCHAR(500),
          cheque_no          VARCHAR(50),
          hatch_no           VARCHAR(200),
          old_status         VARCHAR(500),
          paid_to            VARCHAR(50),
          slip_no            NUMERIC(20,6),
          asset              VARCHAR(200),
          audit_status       VARCHAR(200),
          audit_by           BIGINT,
          audit_date         DATE,
          delete_date        DATE,
          entry_remarks      VARCHAR(2000),
          restore_date       DATE,
          deleted_date       DATE,
          un_approve_by      BIGINT,
          un_approve_date    DATE,
          mr_no              VARCHAR(50),
          wb_voucher_id      BIGINT,
          cash_plant         VARCHAR(20),
          bank_plant         VARCHAR(20),
          cpv                VARCHAR(20),
          br_code            INTEGER,
          modify_by          BIGINT,
          modify_date        DATE,
          v_id_apex          BIGINT,
          advance_pay        VARCHAR(20),
          dc_id              BIGINT,
          unaudit_by         BIGINT,
          unaudit_date       DATE,
          vehicle_id         VARCHAR(20),
          company_name       VARCHAR(200),
          vehicle_type       VARCHAR(30),
          vehicle_name       VARCHAR(50),
          vehicle_no         VARCHAR(50)
        )
      `);
      
      res.json({ success: true, message: "gl_vouchers table created successfully" });
    } catch (error: any) {
      console.error("Error creating gl_vouchers table:", error);
      res.status(500).json({ error: "Failed to create gl_vouchers table" });
    }
  });

  // Save voucher data to gl_vouchers table
  app.post("/api/vouchers/save", async (req: Request, res: Response) => {
    try {
      const voucherData = req.body;
      
      const query = `
        INSERT INTO gl_vouchers (
          voucher_type, voucher_date, description, created_by, creation_date,
          status, branch_id, reference_no, entry_remarks, company_name
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING voucher_id
      `;
      
      const values = [
        voucherData.voucherType || 'CPV',
        voucherData.docDate,
        voucherData.remarks,
        voucherData.createdBy,
        voucherData.creationDate,
        'Create',
        voucherData.branch,
        voucherData.docNo,
        voucherData.remarks,
        'Sabirs\' Poultry (Pvt.) Ltd'
      ];
      
      const result = await pool.query(query, values);
      
      console.log(`Voucher saved with ID: ${result.rows[0].voucher_id}`);
      res.json({ 
        success: true, 
        voucher_id: result.rows[0].voucher_id,
        message: "Voucher saved successfully" 
      });
    } catch (error: any) {
      console.error("Error saving voucher:", error);
      res.status(500).json({ error: "Failed to save voucher" });
    }
  });

  // Get all vouchers from gl_vouchers table
  app.get("/api/vouchers", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          voucher_id,
          voucher_type,
          voucher_no,
          voucher_date,
          description,
          status,
          reference_no,
          branch_id,
          company_name,
          entry_remarks,
          creation_date
        FROM gl_vouchers 
        ORDER BY voucher_id DESC
      `;
      
      const result = await pool.query(query);
      
      console.log(`Fetched ${result.rows.length} vouchers`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching vouchers:", error);
      res.status(500).json({ error: "Failed to fetch vouchers" });
    }
  });

  // Static file serving for captured images is already handled above

  return httpServer;
}
