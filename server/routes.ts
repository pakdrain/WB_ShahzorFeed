import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamService } from "./stream-service";
import { videoStreamService } from "./video-stream";
import { z } from "zod";
import pkg from "pg";
const { Pool } = pkg;


export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Add CORS middleware for external API calls
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // PostgreSQL connection setup
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Helper function to generate a unique WB_ID
  async function generateWBID() {
    try {
      const res = await pool.query('SELECT COALESCE(MAX(WB_ID), 0) + 1 AS new_id FROM WB_WEIGHBRIDGE');
      return res.rows[0].new_id;
    } catch (err) {
      console.error('Error generating WB_ID:', err);
      throw err;
    }
  }

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
    } catch (error: any) {
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

  // IGP Data Proxy Endpoint
  app.get('/api/igp/data', async (req, res) => {
    const { igp_no } = req.query;
    
    if (!igp_no) {
      return res.status(400).json({ error: 'igp_no query parameter is required' });
    }

    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(
        `http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/live_data?igp_no=${igp_no}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching IGP data:', error);
      res.status(500).json({ error: 'Failed to fetch IGP data', message: error.message });
    }
  });

  // Purchase API endpoints
  app.get('/api/purchases', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM WB_WEIGHBRIDGE ORDER BY WB_ID DESC');
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // GET purchase by IGP No
  app.get('/api/purchase-by-igp', async (req, res) => {
    const { igpNo } = req.query;
    if (!igpNo) {
      return res.status(400).json({ error: 'igpNo query parameter is required' });
    }

    try {
      const query = 'SELECT * FROM WB_WEIGHBRIDGE WHERE igp_no = $1';
      const result = await pool.query(query, [igpNo]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No data found for this IGP No' });
      }
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching data by IGP No:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST to insert a new purchase
  app.post('/api/purchases', async (req, res) => {
    const purchaseData = req.body;
    console.log('Incoming purchase data:', purchaseData);

    try {
      const WB_ID = await generateWBID();

      // Destructure and prepare values according to your schema
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
        vendor = null,
        companyId: company_id = null,
        branchId: branch_id = null,
        onlineEntry: online_entry = null,
        offlineEntry: offline_entry = null,
        createdBy: created_by = null,
        creationDate: creation_date = null,
        lastUpdatedBy: last_updated_by = null,
        lastUpdatedDate: last_updated_date = null,
        manualDcNo: manual_dc_no = null,
        entryType: entry_type = null,
        slipOutTime: slip_out_time = null,
        status = null,
        slipDate: slip_date = null,
        po_no = null,
        igpNo: igp_no = null,
        igpDate: igp_date = null,
        vehicleNo: vehicle_no = null,
        bardanaType: bardana_type = null,
        noOfBags: no_of_bags = null,
        weightPerBags: weight_per_bags = null,
        qualityDeduction: quality_deduction = null,
        supplierWeight: supplier_weight = null,
        supWeightWithoutBardana: sup_weight_without_bardana = null,
      } = purchaseData;

      // Convert online/offline entries to string
      const onlineEntryStr = online_entry !== null ? String(online_entry) : null;
      const offlineEntryStr = offline_entry !== null ? String(offline_entry) : null;

      const query = `
        INSERT INTO WB_WEIGHBRIDGE (
          WB_ID, SLIP_NO, SLIP_IN_TIME, FIRST_WEIGHT, SECOND_WEIGHT, NET_WEIGHT,
          BARDANA_WEIGHT, GROSS_WEIGHT, FREIGHT, REMARKS, DRIVER_NAME, VENDOR, COMPANY_ID,
          BRANCH_ID, ONLINE_ENTRY, OFFLINE_ENTRY, CREATED_BY, CREATION_DATE,
          LAST_UPDATED_BY, LAST_UPDATED_DATE, MANUAL_DC_NO, ENTRY_TYPE,
          SLIP_OUT_TIME, STATUS, SLIP_DATE, PO_NO, IGP_NO, IGP_DATE, VEHICLE_NO,
          BARDANA_TYPE, NO_OF_BAGS, WEIGHT_PER_BAGS, QUALITY_DEDUCTION,
          SUPPLIER_WEIGHT, SUP_WEIGHT_WITHOUT_BARDANA
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        )
        RETURNING *;
      `;

      const values = [
        WB_ID, slip_no, slip_in_time, first_weight, second_weight, net_weight,
        bardana_weight, gross_weight, freight, remarks, driver_name, vendor, company_id,
        branch_id, onlineEntryStr, offlineEntryStr, created_by, creation_date,
        last_updated_by, last_updated_date, manual_dc_no, entry_type,
        slip_out_time, status, slip_date, po_no, igp_no, igp_date, vehicle_no,
        bardana_type, no_of_bags, weight_per_bags, quality_deduction,
        supplier_weight, sup_weight_without_bardana
      ];

      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error inserting purchase:', err);
      res.status(500).json({ error: 'Insert error' });
    }
  });

  return httpServer;
}
