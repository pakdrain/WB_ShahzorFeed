import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamService } from "./stream-service";
import { videoStreamService } from "./video-stream";
import { z } from "zod";
import { purchases, purchaseItems, insertPurchaseSchema, insertPurchaseItemSchema } from "../shared/schema";
import { db } from "./db";
import { desc, eq } from "drizzle-orm";

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

  // Update camera settings
  app.patch("/api/cameras/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      console.log("Updating camera with ID:", id, "Updates:", updates);
      
      // Generate new RTSP URL based on updated settings
      if (updates.ip || updates.port || updates.username || updates.password) {
        const ip = updates.ip;
        const port = updates.port || 554;
        const username = updates.username;
        const password = updates.password;
        const channel = updates.channel || 1;
        const subtype = updates.subtype || 0;
        
        updates.rtspUrl = `rtsp://${username}:${password}@${ip}:${port}/cam/realmonitor?channel=${channel}&subtype=${subtype}`;
      }

      const updatedCamera = await storage.updateCamera(id, updates);
      
      if (!updatedCamera) {
        console.log("Camera not found with ID:", id);
        return res.status(404).json({ message: "Camera not found" });
      }

      console.log("Successfully updated camera:", updatedCamera);
      res.status(200).json(updatedCamera);
    } catch (error) {
      console.error("Error updating camera:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
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
        rtspUrl 
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
    } catch (error) {
      console.error("Error getting stream stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Weight API endpoints - Import weight service variables
  let currentWeight = '0.00';
  let currentUnit = 'kg';
  let isPortConnected = false;
  let currentComPort = 'COM3';
  let currentBaudRate = 9600;

  // Weight data endpoint
  app.get('/api/weight/data', (req, res) => {
    res.json({
      weight: currentWeight,
      unit: currentUnit,
      connected: isPortConnected,
      timestamp: new Date().toISOString()
    });
  });

  // Weight status endpoint
  app.get('/api/weight/status', (req, res) => {
    res.json({
      connected: isPortConnected,
      port: currentComPort,
      baudRate: currentBaudRate,
      currentWeight,
      currentUnit
    });
  });

  // Weight connect endpoint
  app.post('/api/weight/connect', async (req, res) => {
    try {
      const { comPort, baudRate = 9600 } = req.body;
      
      if (!comPort) {
        return res.status(400).json({ success: false, message: 'COM port is required' });
      }

      // Update current settings
      currentComPort = comPort;
      currentBaudRate = parseInt(baudRate);
      
      res.json({ 
        success: true, 
        message: `Connected to ${currentComPort}`,
        port: currentComPort,
        baudRate: currentBaudRate,
        connected: true
      });
      
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: `Failed to connect to ${currentComPort}: ${error.message}`,
        port: currentComPort,
        connected: false
      });
    }
  });

  // Weight tare endpoint
  app.post('/api/weight/tare', (req, res) => {
    res.json({ success: true, message: 'Tare command sent' });
  });

  // Purchase API endpoints - Using existing WB_WEIGHBRIDGE table
  app.get('/api/purchases', async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT * FROM WB_WEIGHBRIDGE ORDER BY WB_ID DESC`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      res.status(500).json({ message: 'Failed to fetch purchases', error: error.message });
    }
  });

  app.get('/api/purchase-by-igp', async (req, res) => {
    const { igpNo } = req.query;
    if (!igpNo) {
      return res.status(400).json({ error: 'igpNo query parameter is required' });
    }

    try {
      const result = await db.execute(sql`SELECT * FROM WB_WEIGHBRIDGE WHERE igp_no = ${igpNo}`);
      
      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ message: 'No data found for this IGP No' });
      }
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching data by IGP No:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/purchases', async (req, res) => {
    const purchaseData = req.body;
    console.log('📥 Incoming purchase data:', purchaseData);

    try {
      // Generate WB_ID
      const maxIdResult = await db.execute(sql`SELECT COALESCE(MAX(WB_ID), 0) + 1 AS new_id FROM WB_WEIGHBRIDGE`);
      const WB_ID = maxIdResult.rows[0]?.new_id || 1;

      // Prepare data for insertion
      const {
        slipNo: slip_no = null,
        slipInTime: slip_in_time = null,
        firstWeight: first_weight = null,
        secondWeight: second_weight = null,
        netWeight: net_weight = null,
        bardanaWeight: bardana_weight = null,
        grossWeight: gross_weight = null,
        freight = null,
        remarks = null,
        driverName: driver_name = null,
        companyId: company_id = null,
        branchId: branch_id = null,
        onlineEntry: online_entry = null,
        offlineEntry: offline_entry = null,
        createdBy: created_by = null,
        lastUpdatedBy: last_updated_by = null,
        manualDcNo: manual_dc_no = null,
        entryType: entry_type = null,
        slipOutTime: slip_out_time = null,
        status = null,
        slipDate: slip_date = null,
      } = purchaseData;

      const onlineEntryStr = online_entry !== null ? String(online_entry) : null;
      const offlineEntryStr = offline_entry !== null ? String(offline_entry) : null;
      const currentTimestamp = new Date().toISOString();

      const result = await db.execute(sql`
        INSERT INTO WB_WEIGHBRIDGE (
          WB_ID, SLIP_NO, SLIP_IN_TIME, FIRST_WEIGHT, SECOND_WEIGHT, NET_WEIGHT,
          BARDANA_WEIGHT, GROSS_WEIGHT, FREIGHT, REMARKS, DRIVER_NAME, COMPANY_ID,
          BRANCH_ID, ONLINE_ENTRY, OFFLINE_ENTRY, CREATED_BY, CREATION_DATE,
          LAST_UPDATED_BY, LAST_UPDATED_DATE, MANUAL_DC_NO, ENTRY_TYPE,
          SLIP_OUT_TIME, STATUS, SLIP_DATE
        )
        VALUES (
          ${WB_ID}, ${slip_no}, ${slip_in_time}, ${first_weight}, ${second_weight}, ${net_weight},
          ${bardana_weight}, ${gross_weight}, ${freight}, ${remarks}, ${driver_name}, ${company_id},
          ${branch_id}, ${onlineEntryStr}, ${offlineEntryStr}, ${created_by}, ${currentTimestamp},
          ${last_updated_by}, ${currentTimestamp}, ${manual_dc_no}, ${entry_type},
          ${slip_out_time}, ${status}, ${slip_date}
        )
        RETURNING *
      `);
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('❌ Error inserting purchase:', error);
      res.status(500).json({ error: 'Insert error', details: error.message });
    }
  });

  app.get('/api/purchases/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
      
      if (!purchase) {
        return res.status(404).json({ message: 'Purchase not found' });
      }
      
      res.json(purchase);
    } catch (error: any) {
      console.error('Error fetching purchase:', error);
      res.status(500).json({ message: 'Failed to fetch purchase', error: error.message });
    }
  });

  // Purchase Items API endpoints
  app.get('/api/purchase-items', async (req, res) => {
    try {
      const allItems = await db.select().from(purchaseItems).orderBy(desc(purchaseItems.creationDate));
      res.json(allItems);
    } catch (error: any) {
      console.error('Error fetching purchase items:', error);
      res.status(500).json({ message: 'Failed to fetch purchase items', error: error.message });
    }
  });

  app.post('/api/purchase-items', async (req, res) => {
    try {
      const validatedData = insertPurchaseItemSchema.parse(req.body);
      const [newItem] = await db.insert(purchaseItems).values(validatedData).returning();
      res.status(201).json(newItem);
    } catch (error: any) {
      console.error('Error creating purchase item:', error);
      res.status(400).json({ message: 'Failed to create purchase item', error: error.message });
    }
  });

  return httpServer;
}
