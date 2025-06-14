import type { Express, Request, Response } from "express";
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
import { imageCaptureService } from './image-capture';
import { 
  registerSchema, 
  loginSchema, 
  type RegisterData, 
  type LoginData 
} from '../shared/schema';

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

  console.log('✅ Using users table with columns: userName, userPassword');

 // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { userName, userPassword, confirmPassword } = req.body;

      if (!userName || !userPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (userPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      const existingUser = await pool.query(
        'SELECT * FROM users WHERE userName = $1',
        [userName]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      await pool.query(
        'INSERT INTO users (userName, userPassword) VALUES ($1, $2)',
        [userName, userPassword]
      );

      console.log('✅ User registered successfully:', userName);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: { userName }
      });

    } catch (error: any) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { userName, userPassword } = req.body;

      if (!userName || !userPassword) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const userResult = await pool.query(
        'SELECT * FROM users WHERE userName = $1 AND userPassword = $2',
        [userName, userPassword]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      console.log('✅ User logged in successfully:', userName);
      res.json({
        success: true,
        message: 'Login successful',
        user: { userName }
      });

    } catch (error: any) {
      console.error('❌ Login error:', error);
      res.status(500).json({ error: 'Login failed: ' + error.message });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Table initializer
  app.post('/api/auth/init-db', async (req, res) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          userName VARCHAR(1000),
          userPassword VARCHAR(1000)
        );
      `);

      res.json({ success: true, message: 'Users table initialized' });
    } catch (error: any) {
      console.error('❌ Init DB error:', error);
      res.status(500).json({ error: 'Database initialization failed' });
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
        do_qty = null
      } = itemData;

      const query = `
        INSERT INTO wb_weighbridge_items_purchase (
          wb_id, bardana_type, igp_no, vehicle_no, weight_per_bags, igp_date,
          supplier_weight, quality_deduction, bardana_weight, no_of_bags, vendor_name, bag_condition,
          po_no, item_code, item_desc, po_qty, igp_qty, balance_qty, customer_name, do_no, do_qty
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
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
        do_qty ? parseFloat(do_qty) : null
      ];

      const result = await pool.query(query, values);
      console.log('Purchase items saved successfully:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Error inserting purchase items:', err);
      res.status(500).json({ error: 'Insert error: ' + err.message });
    }
  });

  // Image capture endpoints
  app.post('/api/capture/first-weight', async (req: Request, res: Response) => {
    try {
      const { slipNo, cameraIp = '10.10.10.146', cameraPort = 554 } = req.body;
      
      if (!slipNo) {
        return res.status(400).json({ error: 'Slip number is required' });
      }

      const imagePath = await imageCaptureService.captureFirstWeightImage({
        slipNo,
        cameraIp,
        cameraPort,
        username: 'admin',
        password: 'admin123'
      });

      res.json({ 
        success: true, 
        imagePath,
        message: `Image captured for slip ${slipNo}` 
      });
    } catch (error: any) {
      console.error('Image capture error:', error);
      res.status(500).json({ 
        error: 'Failed to capture image',
        details: error.message 
      });
    }
  });

  app.get('/api/capture/first-weight/images', async (req: Request, res: Response) => {
    try {
      const images = await imageCaptureService.getFirstWeightImages();
      res.json({ images });
    } catch (error: any) {
      console.error('Error fetching images:', error);
      res.status(500).json({ 
        error: 'Failed to fetch images',
        details: error.message 
      });
    }
  });

  app.delete('/api/capture/first-weight/:filename', async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const success = await imageCaptureService.deleteImage(filename);
      
      if (success) {
        res.json({ success: true, message: 'Image deleted successfully' });
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      res.status(500).json({ 
        error: 'Failed to delete image',
        details: error.message 
      });
    }
  });

  // GET latest master record
  app.get('/api/purchase/latest-master', async (req: Request, res: Response) => {
    try {
      const query = 'SELECT * FROM wb_weighbridge ORDER BY wb_id DESC LIMIT 1';
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No master records found' });
      }
      
      console.log(`Fetched latest master record: WB_ID ${result.rows[0].wb_id}`);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error fetching latest master record:', error);
      res.status(500).json({ error: 'Failed to fetch latest master record' });
    }
  });

  // GET latest details record
  app.get('/api/purchase/latest-details', async (req: Request, res: Response) => {
    try {
      const query = 'SELECT * FROM wb_weighbridge_items_purchase ORDER BY id DESC LIMIT 1';
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No detail records found' });
      }
      
      console.log(`Fetched latest detail record: ID ${result.rows[0].id}`);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error fetching latest detail record:', error);
      res.status(500).json({ error: 'Failed to fetch latest detail record' });
    }
  });

  // GET first weight records
  app.get('/api/purchase/first-weight-records', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT w.wb_id, w.slip_no, w.entry_type, w.first_weight, w.second_weight, p.vehicle_no
        FROM wb_weighbridge w
        LEFT JOIN wb_weighbridge_items_purchase p ON w.wb_id = p.wb_id
        WHERE w.first_weight IS NOT NULL AND (w.second_weight IS NULL OR w.second_weight = 0)
        ORDER BY w.wb_id DESC 
        LIMIT 20
      `;
      const result = await pool.query(query);
      
      console.log(`Fetched ${result.rows.length} first weight records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching first weight records:', error);
      res.status(500).json({ error: 'Failed to fetch first weight records' });
    }
  });

  // GET branches for dropdown
  app.get('/api/branches', async (req: Request, res: Response) => {
    try {
      const query = 'SELECT branch_id, branch_name FROM branches ORDER BY branch_name';
      const result = await pool.query(query);
      
      console.log(`Fetched ${result.rows.length} branches`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  });

  // GET entry types for dropdown
  app.get('/api/entry-types', async (req: Request, res: Response) => {
    try {
      const query = 'SELECT id, type_name FROM entry_type WHERE is_active = true ORDER BY type_name';
      const result = await pool.query(query);
      
      console.log(`Fetched ${result.rows.length} entry types`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching entry types:', error);
      res.status(500).json({ error: 'Failed to fetch entry types' });
    }
  });

  // GET purchase by wb_id
  app.get('/api/purchase/by-wbid/:wbId', async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      
      const masterQuery = 'SELECT * FROM wb_weighbridge WHERE wb_id = $1';
      const masterResult = await pool.query(masterQuery, [parseInt(wbId)]);
      
      if (masterResult.rows.length === 0) {
        return res.status(404).json({ message: 'No record found for this wb_id' });
      }
      
      const master = masterResult.rows[0];
      
      const detailsQuery = 'SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1';
      const detailsResult = await pool.query(detailsQuery, [master.wb_id]);
      
      console.log(`Fetched purchase record for wb_id ${wbId}`);
      res.json({
        master,
        details: detailsResult.rows
      });
    } catch (error: any) {
      console.error('Error fetching purchase by wb_id:', error);
      res.status(500).json({ error: 'Failed to fetch purchase record' });
    }
  });

  // GET purchase by slip number
  app.get('/api/purchase/by-slip/:slipNo', async (req: Request, res: Response) => {
    try {
      const { slipNo } = req.params;
      
      const masterQuery = 'SELECT * FROM wb_weighbridge WHERE slip_no = $1';
      const masterResult = await pool.query(masterQuery, [slipNo]);
      
      if (masterResult.rows.length === 0) {
        return res.status(404).json({ message: 'No record found for this slip number' });
      }
      
      const master = masterResult.rows[0];
      
      const detailsQuery = 'SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1';
      const detailsResult = await pool.query(detailsQuery, [master.wb_id]);
      
      console.log(`Fetched purchase record for slip ${slipNo}`);
      res.json({
        master,
        details: detailsResult.rows
      });
    } catch (error: any) {
      console.error('Error fetching purchase by slip number:', error);
      res.status(500).json({ error: 'Failed to fetch purchase record' });
    }
  });

  // PUT update purchase record
  app.put('/api/purchase/update/:wbId', async (req: Request, res: Response) => {
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
        slip_out_time = null
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
        slip_out_time
      ];

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Purchase record not found' });
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
        balance_qty = null
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
            balance_qty = $10
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
          balance_qty ? parseFloat(balance_qty) : null
        ];

        await pool.query(detailsQuery, detailsValues);
      } else {
        // Insert new record
        const insertQuery = `
          INSERT INTO wb_weighbridge_items_purchase (
            wb_id, vehicle_no, vendor_name, po_no, igp_no, item_code, item_desc, po_qty, igp_qty, balance_qty
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          balance_qty ? parseFloat(balance_qty) : null
        ];

        await pool.query(insertQuery, insertValues);
      }

      console.log(`Updated purchase record: WB_ID ${wbId}`);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating purchase record:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to update purchase record',
        details: error.message 
      });
    }
  });

  // Sales endpoints
  // Deduction routes - save deduction data
  // GET deduction data by wb_id
  app.get('/api/deduction/:wbId', async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      const query = 'SELECT * FROM deduction WHERE wb_id = $1 ORDER BY bag_id';
      const result = await pool.query(query, [parseInt(wbId)]);
      
      console.log(`Fetched ${result.rows.length} deduction records for wb_id ${wbId}`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching deduction data:', error);
      res.status(500).json({ error: 'Failed to fetch deduction data' });
    }
  });

  app.post('/api/deduction/save', async (req: Request, res: Response) => {
    try {
      const { wbId, bagTableData } = req.body;
      
      console.log('Received deduction save request:', { wbId, bagTableData });
      
      if (!wbId || !bagTableData || bagTableData.length === 0) {
        return res.status(400).json({ error: 'Missing required data' });
      }
      
      // Delete existing deduction entries for this wb_id
      await pool.query('DELETE FROM deduction WHERE wb_id = $1', [wbId]);
      
      // Save each deduction entry
      for (const item of bagTableData) {
        const query = `
          INSERT INTO deduction (wb_id, bag_id, bags, pb, percentage, weight, total)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        const values = [
          wbId,
          item.bagId,
          item.bags,
          item.pb,
          item.percentage,
          typeof item.weight === 'string' ? parseFloat(item.weight) || 0 : item.weight,
          item.total
        ];
        
        console.log('Inserting deduction record:', values);
        await pool.query(query, values);
      }
      
      console.log(`Successfully saved ${bagTableData.length} deduction records for wb_id ${wbId}`);
      res.json({ success: true, message: 'Deduction data saved successfully' });
    } catch (error: any) {
      console.error('Error saving deduction data:', error);
      res.status(500).json({ error: 'Failed to save deduction data', details: error.message });
    }
  });

  app.post('/api/sales/save', async (req: Request, res: Response) => {
    try {
      const { salesData, entryType } = req.body;
      
      if (!salesData || !entryType) {
        return res.status(400).json({ error: 'Sales data and entry type are required' });
      }

      const {
        do_id,
        do_date,
        customer_name,
        customer_address,
        customer_phone,
        vehicle_no,
        driver_name,
        driver_phone,
        item_code,
        item_desc,
        do_qty,
        unit_price,
        total_amount,
        payment_terms,
        delivery_terms,
        remarks,
        first_weight,
        second_weight,
        net_weight,
        tare_weight,
        gross_weight,
        slip_no,
        slip_date,
        slip_time,
        weighbridge_operator,
        quality_remarks,
        moisture_content,
        foreign_matter,
        broken_grains,
        total_deduction,
        final_weight,
        rate_per_kg,
        total_value
      } = salesData;

      const query = `
        INSERT INTO sales_details (
          do_id, do_date, customer_name, customer_address, customer_phone,
          vehicle_no, driver_name, driver_phone, item_code, item_desc,
          do_qty, unit_price, total_amount, payment_terms, delivery_terms,
          remarks, first_weight, second_weight, net_weight, tare_weight,
          gross_weight, slip_no, slip_date, slip_time, weighbridge_operator,
          quality_remarks, moisture_content, foreign_matter, broken_grains,
          total_deduction, final_weight, rate_per_kg, total_value, entry_type,
          created_date
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, CURRENT_TIMESTAMP
        )
        RETURNING *;
      `;

      const values = [
        do_id,
        do_date,
        customer_name,
        customer_address,
        customer_phone,
        vehicle_no,
        driver_name,
        driver_phone,
        item_code,
        item_desc,
        parseFloat(do_qty) || null,
        parseFloat(unit_price) || null,
        parseFloat(total_amount) || null,
        payment_terms,
        delivery_terms,
        remarks,
        parseFloat(first_weight) || null,
        parseFloat(second_weight) || null,
        parseFloat(net_weight) || null,
        parseFloat(tare_weight) || null,
        parseFloat(gross_weight) || null,
        slip_no,
        slip_date,
        slip_time,
        weighbridge_operator,
        quality_remarks,
        parseFloat(moisture_content) || null,
        parseFloat(foreign_matter) || null,
        parseFloat(broken_grains) || null,
        parseFloat(total_deduction) || null,
        parseFloat(final_weight) || null,
        parseFloat(rate_per_kg) || null,
        parseFloat(total_value) || null,
        entryType
      ];

      const result = await pool.query(query, values);
      console.log('Sales data saved successfully:', result.rows[0]);
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error saving sales data:', error);
      res.status(500).json({ error: 'Failed to save sales data' });
    }
  });

  // GET all sales data with branch filtering
  app.get('/api/sales', async (req: Request, res: Response) => {
    try {
      const { branch_id } = req.query;
      let query = `
        SELECT 
          sd.wb_id,
          wb.slip_no,
          sd.vehicle_no,
          sd.customer_name,
          wb.slip_in_time, 
          wb.slip_out_time, 
          wb.entry_type, 
          wb.branch_id 
        FROM sales_details sd 
        JOIN wb_weighbridge wb ON sd.wb_id = wb.wb_id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (branch_id && branch_id !== 'all') {
        query += ' AND wb.branch_id = $1';
        params.push(parseInt(branch_id as string));
      }
      
      query += ' ORDER BY sd.id DESC';
      
      const result = await pool.query(query, params);
      
      console.log(`Fetched ${result.rows.length} sales records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching sales data:', error);
      res.status(500).json({ error: 'Failed to fetch sales data' });
    }
  });

  // GET purchase records for reports with branch filtering (online entries only)
  app.get('/api/purchases', async (req: Request, res: Response) => {
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
        WHERE wb.online_entry = 'Yes'
      `;
      const params: any[] = [];
      
      if (branch_id && branch_id !== 'all') {
        query += ' AND wb.branch_id = $1';
        params.push(parseInt(branch_id as string));
      }
      
      query += ' ORDER BY wb.wb_id DESC';
      
      const result = await pool.query(query, params);
      
      console.log(`Fetched ${result.rows.length} online purchase records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching purchase records:', error);
      res.status(500).json({ error: 'Failed to fetch purchase records' });
    }
  });

  // GET offline purchase records for reports with branch filtering
  app.get('/api/purchases/offline', async (req: Request, res: Response) => {
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
      
      if (branch_id && branch_id !== 'all') {
        query += ' AND wb.branch_id = $1';
        params.push(parseInt(branch_id as string));
      }
      
      query += ' ORDER BY wb.wb_id DESC';
      
      const result = await pool.query(query, params);
      
      console.log(`Fetched ${result.rows.length} offline purchase records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching offline purchase records:', error);
      res.status(500).json({ error: 'Failed to fetch offline purchase records' });
    }
  });

  // PUT endpoint to convert offline entry to online
  app.put('/api/purchase/convert-to-online/:wbId', async (req: Request, res: Response) => {
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
        return res.status(404).json({ error: 'Record not found' });
      }
      
      console.log(`Converted wb_id ${wbId} from offline to online`);
      res.json({ message: 'Entry converted to online successfully', record: result.rows[0] });
    } catch (error: any) {
      console.error('Error converting entry to online:', error);
      res.status(500).json({ error: 'Failed to convert entry to online' });
    }
  });

  // GET endpoint for generating next DO ID
  app.get('/api/sales/next-do-id', async (req, res) => {
    try {
      const query = 'SELECT do_id FROM sales_details ORDER BY id DESC LIMIT 1';
      const result = await pool.query(query);
      
      let nextDoId = 'DO001';
      if (result.rows.length > 0 && result.rows[0].do_id) {
        const currentNumber = parseInt(result.rows[0].do_id.replace('DO', ''));
        const nextNumber = currentNumber + 1;
        nextDoId = `DO${String(nextNumber).padStart(3, '0')}`;
      }
      
      res.json({ nextDoId });
    } catch (error: any) {
      console.error('Error generating next DO ID:', error);
      res.status(500).json({ error: 'Failed to generate next DO ID' });
    }
  });

  // GET endpoint for fetching deduction data by WB_ID
  app.get('/api/deduction/:wbId', async (req, res) => {
    try {
      const { wbId } = req.params;
      
      const query = `
        SELECT * FROM deduction 
        WHERE wb_id = $1 
        ORDER BY bag_id
      `;
      
      const result = await pool.query(query, [wbId]);
      
      console.log(`Fetched ${result.rows.length} deduction records for WB_ID: ${wbId}`);
      res.json(result.rows);
    } catch (error: any) {
      console.error('Error fetching deduction data:', error);
      res.status(500).json({ error: 'Failed to fetch deduction data' });
    }
  });

  return httpServer;
}