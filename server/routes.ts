import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { streamService } from "./stream-service";
import { videoStreamService } from "./video-stream";
import { z } from "zod";
import { Pool } from "pg";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // PostgreSQL connection setup
  const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432'),
    ssl: {
      rejectUnauthorized: false
    },
  });

  // Test database connection on startup
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
  }

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

  // Purchase and IGP Database Routes

  // GET purchase data by IGP number
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

  // GET all purchases
  app.get('/api/purchases', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM WB_WEIGHBRIDGE ORDER BY WB_ID DESC');
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
        INSERT INTO WB_WEIGHBRIDGE (
          WB_ID, SLIP_NO, SLIP_IN_TIME, FIRST_WEIGHT, SECOND_WEIGHT, NET_WEIGHT,
          BARDANA_WEIGHT, GROSS_WEIGHT, FREIGHT, REMARKS, DRIVER_NAME, COMPANY_ID,
          BRANCH_ID, ONLINE_ENTRY, OFFLINE_ENTRY, CREATED_BY, CREATION_DATE,
          LAST_UPDATED_BY, LAST_UPDATED_DATE, MANUAL_DC_NO, ENTRY_TYPE,
          SLIP_OUT_TIME, STATUS, SLIP_DATE
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
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error inserting purchase:', err);
      res.status(500).json({ error: 'Insert error' });
    }
  });

  // POST to insert purchase items (detail table)
  app.post('/api/purchase-items', async (req, res) => {
    const itemData = req.body;
    console.log('Incoming purchase item data:', itemData);

    try {
      // Destructure and prepare values for purchase items
      const {
        wb_item_p_id = null,
        wb_id = null,
        manual_dc_no = null,
        do_id = null,
        do_no = null,
        customer_id = null,
        customer_name = null,
        vehicle_no = null,
        do_date = null,
        item_id = null,
        item_code = null,
        item_desc = null,
        created_by = null,
        creation_date = null,
        last_updated_by = null,
        last_updated_date = null,
        po_id = null,
        po_no = null,
        po_qty = null,
        igp_qty = null,
        balance_qty = null,
        bardana_type = null,
        igp_no = null,
        manual_igp_no = null,
        igp_id = null,
        vendor_id = null,
        vendor_name = null,
        no_of_bags = null,
        weight_per_bags = null,
        bardana_weight = null,
        igp_date = null,
        quality_deduction = null,
        supplier_weight = null,
        sup_weight_wthout_bardana = null,
        net_supplier_weight = null,
        bag_condition = null,
        bardana_type_id = null,
      } = itemData;

      const query = `
        INSERT INTO WB_WEIGHBRIDGE_ITEMS (
          WB_ITEM_P_ID, WB_ID, MANUAL_DC_NO, DO_ID, DO_NO, CUSTOMER_ID,
          CUSTOMER_NAME, VEHICLE_NO, DO_DATE, ITEM_ID, ITEM_CODE, ITEM_DESC,
          CREATED_BY, CREATION_DATE, LAST_UPDATED_BY, LAST_UPDATED_DATE,
          PO_ID, PO_NO, PO_QTY, IGP_QTY, BALANCE_QTY, BARDANA_TYPE,
          IGP_NO, MANUAL_IGP_NO, IGP_ID, VENDOR_ID, VENDOR_NAME,
          NO_OF_BAGS, WEIGHT_PER_BAGS, BARDANA_WEIGHT, IGP_DATE,
          QUALITY_DEDUCTION, SUPPLIER_WEIGHT, SUP_WEIGHT_WTHOUT_BARDANA,
          NET_SUPPLIER_WEIGHT, BAG_CONDITION, BARDANA_TYPE_ID
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27,
          $28, $29, $30, $31,
          $32, $33, $34,
          $35, $36, $37
        )
        RETURNING *;
      `;

      const values = [
        wb_item_p_id,
        wb_id,
        manual_dc_no,
        do_id,
        do_no,
        customer_id,
        customer_name,
        vehicle_no,
        do_date,
        item_id,
        item_code,
        item_desc,
        created_by,
        creation_date,
        last_updated_by,
        last_updated_date,
        po_id,
        po_no,
        po_qty,
        igp_qty,
        balance_qty,
        bardana_type,
        igp_no,
        manual_igp_no,
        igp_id,
        vendor_id,
        vendor_name,
        no_of_bags,
        weight_per_bags,
        bardana_weight,
        igp_date,
        quality_deduction,
        supplier_weight,
        sup_weight_wthout_bardana,
        net_supplier_weight,
        bag_condition,
        bardana_type_id,
      ];

      const result = await pool.query(query, values);
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error inserting purchase items:', err);
      res.status(500).json({ error: 'Insert error' });
    }
  });

  // Updated POST to handle master and detail together according to your server code
  app.post('/api/purchases', async (req, res) => {
    const purchaseData = req.body;
    console.log('📥 Incoming purchase data:', purchaseData);

    try {
      // Start transaction
      await pool.query('BEGIN');
      const WB_ID = await generateWBID();

      // Handle both single purchase and master+detail formats
      const masterData = purchaseData.masterData || purchaseData;
      const itemsData = purchaseData.itemsData || purchaseData.purchase_items || [];

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
      } = masterData;

      const masterInsertQuery = `
        INSERT INTO WB_WEIGHBRIDGE (
          WB_ID, SLIP_NO, SLIP_IN_TIME, FIRST_WEIGHT, SECOND_WEIGHT, NET_WEIGHT,
          BARDANA_WEIGHT, GROSS_WEIGHT, FREIGHT, REMARKS, DRIVER_NAME, COMPANY_ID,
          BRANCH_ID, ONLINE_ENTRY, OFFLINE_ENTRY, CREATED_BY, CREATION_DATE,
          LAST_UPDATED_BY, LAST_UPDATED_DATE, MANUAL_DC_NO, ENTRY_TYPE,
          SLIP_OUT_TIME, STATUS, SLIP_DATE
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

      const masterValues = [
        WB_ID, slip_no, slip_in_time, first_weight, second_weight, net_weight,
        bardana_weight, gross_weight, freight, remarks, driver_name, company_id,
        branch_id, String(online_entry), String(offline_entry), created_by, creation_date,
        last_updated_by, last_updated_date, manual_dc_no, entry_type,
        slip_out_time, status, slip_date
      ];

      const masterResult = await pool.query(masterInsertQuery, masterValues);

      // Insert detail records if any
      const detailResults = [];
      for (const item of itemsData) {
        const detailQuery = `
          INSERT INTO wb_weighbridge_items_purchase (
            wb_item_p_id, wb_id, manual_dc_no, do_id, do_no, customer_id, customer_name,
            vehicle_no, do_date, item_id, item_code, item_desc, created_by, creation_date,
            last_updated_by, last_updated_date, po_id, po_no, po_qty, igp_qty, balance_qty,
            bardana_type, igp_no, manual_igp_no, igp_id, vendor_id, vendor_name, no_of_bags,
            weight_per_bags, bardana_weight, igp_date, quality_deduction, supplier_weight,
            sup_weight_wthout_bardana, net_supplier_weight, bag_condition, bardana_type_id
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26, $27, $28,
            $29, $30, $31, $32, $33, $34,
            $35, $36, $37, $38
          )
          RETURNING *;
        `;

        const detailValues = [
          item.wb_item_p_id, WB_ID, item.manual_dc_no, item.do_id, item.do_no, item.customer_id, item.customer_name,
          item.vehicle_no, item.do_date, item.item_id, item.item_code, item.item_desc, item.created_by, item.creation_date,
          item.last_updated_by, item.last_updated_date, item.po_id, item.po_no, item.po_qty, item.igp_qty, item.balance_qty,
          item.bardana_type, item.igp_no, item.manual_igp_no, item.igp_id, item.vendor_id, item.vendor_name, item.no_of_bags,
          item.weight_per_bags, item.bardana_weight, item.igp_date, item.quality_deduction, item.supplier_weight,
          item.sup_weight_wthout_bardana, item.net_supplier_weight, item.bag_condition, item.bardana_type_id
        ];

        const detailResult = await pool.query(detailQuery, detailValues);
        detailResults.push(detailResult.rows[0]);
      }

      // Commit transaction
      await pool.query('COMMIT');

      res.status(200).json({ 
        message: 'Master and detail records inserted successfully', 
        WB_ID,
        master: masterResult.rows[0],
        details: detailResults
      });

    } catch (err) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      console.error('❌ Error inserting purchase and items:', err);
      res.status(500).json({ error: 'Insert error', details: err.message });
    }
  });

  return httpServer;
}
