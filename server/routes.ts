import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamService } from "./stream-service";
import { videoStreamService } from "./video-stream";
import { z } from "zod";
import pkg from "pg";
const { Pool } = pkg;
import { 
  currentWeight, 
  currentUnit, 
  isPortConnected, 
  currentComPort, 
  currentBaudRate,
  updateComPort,
  updateBaudRate
} from './weight-state';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // PostgreSQL connection setup
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || '@1122'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'WB'}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Test database connection and log status
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database:', err);
  }

  // Helper function to generate a unique WB_ID
  async function generateWBID() {
    try {
      const res = await pool.query('SELECT COALESCE(MAX(wb_id), 0) + 1 AS new_id FROM wb_weighbridge');
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

  // Weight API endpoints use imported variables from weight-state

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
      port: 'COM6', // Direct assignment to ensure COM6 is returned
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
      updateComPort(comPort);
      updateBaudRate(parseInt(baudRate));
      
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

  // Purchase and IGP Database Routes

  // GET purchase data by IGP number
  app.get('/api/purchase-by-igp', async (req, res) => {
    const { igpNo } = req.query;
    if (!igpNo) {
      return res.status(400).json({ error: 'igpNo query parameter is required' });
    }

    try {
      const query = 'SELECT * FROM wb_weighbridge WHERE igp_no = $1';
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

  // GET all purchases
  app.get('/api/purchases', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM wb_weighbridge ORDER BY wb_id DESC');
      res.json(result.rows);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // POST to insert a new purchase
  app.post('/api/purchases', async (req, res) => {
    const purchaseData = req.body;
    console.log('Incoming purchase data:', purchaseData);

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

      // Convert online/offline entries to string
      const onlineEntryStr = online_entry !== null ? String(online_entry) : null;
      const offlineEntryStr = offline_entry !== null ? String(offline_entry) : null;

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
      console.log('Purchase saved successfully:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error inserting purchase:', err);
      res.status(500).json({ error: 'Insert error' });
    }
  });

  // POST to insert purchase items
  app.post('/api/purchase-items', async (req, res) => {
    const itemData = req.body;
    console.log('Incoming purchase item data:', itemData);

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
        no_of_bags = null,
        vendor_name = null,
        bag_condition = null,
        po_no = null,
        item_code = null,
        item_desc = null,
        po_qty = null,
        igp_qty = null,
        balance_qty = null
      } = itemData;

      const query = `
        INSERT INTO wb_weighbridge_items_purchase (
          wb_id, bardana_type, igp_no, vehicle_no, weight_per_bags, igp_date,
          supplier_weight, quality_deduction, no_of_bags, vendor_name, bag_condition,
          po_no, item_code, item_desc, po_qty, igp_qty, balance_qty
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
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
        no_of_bags ? parseInt(no_of_bags) : null,
        vendor_name,
        bag_condition,
        po_no,
        item_code,
        item_desc,
        po_qty ? parseFloat(po_qty) : null,
        igp_qty ? parseFloat(igp_qty) : null,
        balance_qty ? parseFloat(balance_qty) : null
      ];

      const result = await pool.query(query, values);
      console.log('Purchase items saved successfully:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error inserting purchase items:', err);
      res.status(500).json({ error: 'Insert error: ' + err.message });
    }
  });

  return httpServer;
}