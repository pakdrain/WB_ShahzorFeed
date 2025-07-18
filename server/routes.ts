import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Pool } from '@neondatabase/serverless';
import { spawn } from "child_process";
import { storage } from "./storage";
import { db, pool } from "./db";
import { streamService } from "./stream-service";
import { nanoid } from "nanoid";

// Test database connection
async function testDatabaseConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ Database connection test successful");
    
    // Test users table structure
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    const columns = result.rows.map(row => row.column_name);
    console.log("✅ Using users table with columns:", columns.join(", "));
    
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.log("🔄 Attempting to continue without database connection...");
  }

  // Setup WebSocket for camera streams
  streamService.initialize(server);

  // Authentication endpoints
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      let user = null;
      
      try {
        // Try database first
        const result = await pool.query(
          "SELECT userid as id, username, branchid as branch_id FROM users WHERE username = $1 AND userpassword = $2",
          [username, password]
        );
        
        if (result.rows.length > 0) {
          user = result.rows[0];
        }
      } catch (error) {
        console.error("Database login failed, using storage:", error);
        // Fallback to storage
        const storageUser = await storage.getUserByUsername(username);
        if (storageUser && storageUser.password === password) {
          user = {
            id: storageUser.id,
            username: storageUser.username,
            branch_id: storageUser.branchId || 1
          };
        }
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set up session
      req.session.userId = user.id;
      req.session.user = user;
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          branch_id: user.branch_id
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET branches
  app.get("/api/branches", async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT branch_id, branch_name FROM branches ORDER BY branch_name");
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      // Fallback data when database is not available
      const fallbackData = [
        { branch_id: 1, branch_name: "Main Branch" },
        { branch_id: 2, branch_name: "Secondary Branch" },
        { branch_id: 3, branch_name: "Shahzor" }
      ];
      console.log("Using fallback branches data");
      res.json(fallbackData);
    }
  });

  // GET vendor data from sys_data_configg table for offline mode
  app.get("/api/vendor-data", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT data_config_desc as view, data_config_desc as return 
        FROM sys_data_configg 
        WHERE sys_config_id = 16
        ORDER BY data_config_desc
      `;
      
      const result = await pool.query(query);
      
      console.log(`Fetched ${result.rows.length} vendor records from sys_data_configg`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching vendor data:", error);
      // Fallback data when database is not available - from sys_data_configg sys_config_id=16
      const fallbackData = [
        { view: "Ali Traders", return: "Ali Traders" },
        { view: "Ahmed & Co", return: "Ahmed & Co" },
        { view: "Malik Industries", return: "Malik Industries" },
        { view: "Khan Suppliers", return: "Khan Suppliers" },
        { view: "Fatima Trading", return: "Fatima Trading" }
      ];
      console.log("Using fallback vendor data");
      res.json(fallbackData);
    }
  });

  // GET deduction data by wb_id
  app.get("/api/deduction/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      const query = `
        SELECT id, wb_id, bag_id, bags, pb, percentage, weight, total
        FROM deduction 
        WHERE wb_id = $1
        ORDER BY bag_id
      `;
      
      const result = await pool.query(query, [wbId]);
      
      console.log(`Fetched ${result.rows.length} deduction records for wb_id: ${wbId}`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching deduction data:", error);
      res.status(500).json({ error: "Failed to fetch deduction data" });
    }
  });

  // Weight API endpoints
  app.get("/api/weight/data", (req: Request, res: Response) => {
    res.json({
      weight: "0.00",
      unit: "kg",
      connected: false
    });
  });

  // Camera API endpoints
  app.get("/api/cameras/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    res.json({
      id: parseInt(id),
      name: `Camera ${id.padStart(2, '0')}`,
      ip: "10.10.10.146",
      status: "disconnected"
    });
  });

  // Purchase API endpoints
  app.get("/api/purchase/first-weight-records", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT ON (slip_no) 
          wb_id, slip_no, vehicle_no, first_weight, second_weight, 
          net_weight, gross_weight, party, entry_type, offline_entry
        FROM wb_weighbridge 
        WHERE first_weight IS NOT NULL 
        ORDER BY slip_no, wb_id DESC
      `;
      
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching first weight records:", error);
      res.json([]);
    }
  });

  app.get("/api/purchases/offline", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT ON (slip_no) 
          wb_id, slip_no, vehicle_no, first_weight, second_weight, 
          net_weight, gross_weight, party, entry_type, offline_entry
        FROM wb_weighbridge 
        WHERE offline_entry = 'Yes'
        ORDER BY slip_no, wb_id DESC
      `;
      
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching offline records:", error);
      res.json([]);
    }
  });

  app.get("/api/purchase/by-wbid/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      
      // Fetch master record
      const masterQuery = `
        SELECT * FROM wb_weighbridge WHERE wb_id = $1
      `;
      const masterResult = await pool.query(masterQuery, [wbId]);
      
      if (masterResult.rows.length === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      // Fetch detail records
      const detailQuery = `
        SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1
      `;
      const detailResult = await pool.query(detailQuery, [wbId]);
      
      res.json({
        master: masterResult.rows[0],
        details: detailResult.rows
      });
    } catch (error: any) {
      console.error("Error fetching record by wb_id:", error);
      res.status(500).json({ error: "Failed to fetch record" });
    }
  });

  app.get("/api/purchase/by-slip/:slipNo", async (req: Request, res: Response) => {
    try {
      const { slipNo } = req.params;
      
      // Fetch master record by slip number
      const masterQuery = `
        SELECT * FROM wb_weighbridge WHERE slip_no = $1 ORDER BY wb_id DESC LIMIT 1
      `;
      const masterResult = await pool.query(masterQuery, [slipNo]);
      
      if (masterResult.rows.length === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      // Fetch detail records
      const detailQuery = `
        SELECT * FROM wb_weighbridge_items_purchase WHERE wb_id = $1
      `;
      const detailResult = await pool.query(detailQuery, [masterResult.rows[0].wb_id]);
      
      res.json({
        master: masterResult.rows[0],
        details: detailResult.rows
      });
    } catch (error: any) {
      console.error("Error fetching record by slip number:", error);
      res.status(500).json({ error: "Failed to fetch record" });
    }
  });

  // Additional API endpoints for application functionality
  app.get("/api/db/wake", async (req: Request, res: Response) => {
    try {
      await pool.query("SELECT 1");
      res.json({ success: true, message: "Database is awake" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: "Database wake failed" });
    }
  });

  app.get("/api/entry-types", async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT * FROM entry_types ORDER BY entry_type");
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching entry types:", error);
      res.json([
        { entry_type: "PURCHASE", description: "Purchase Transaction" },
        { entry_type: "SALE", description: "Sale Transaction" }
      ]);
    }
  });

  app.get("/api/inv-items", async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT * FROM inv_items ORDER BY item_desc");
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching inventory items:", error);
      res.json([
        { item_id: 1, item_desc: "Rice", item_code: "RICE001" },
        { item_id: 2, item_desc: "Wheat", item_code: "WHEAT001" }
      ]);
    }
  });

  app.get("/api/bardana-types", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT data_config_segment1 || '-' || data_config_desc AS type, data_config_segment1 
        FROM sys_data_configg 
        WHERE sys_config_id = 15
        ORDER BY data_config_desc
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching bardana types:", error);
      res.json([
        { type: "50-Standard Bag", data_config_segment1: "50" },
        { type: "100-Large Bag", data_config_segment1: "100" }
      ]);
    }
  });

  app.get("/api/percentage-data", async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT * FROM percentage_data ORDER BY percentage");
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching percentage data:", error);
      res.json([
        { percentage: 2.5, description: "Standard Deduction" },
        { percentage: 5.0, description: "High Deduction" }
      ]);
    }
  });

  app.get("/api/vendors", async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT * FROM inv_vendors ORDER BY vendor_name");
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching vendors:", error);
      res.json([
        { vendor_id: 1, vendor_name: "Ali Traders" },
        { vendor_id: 2, vendor_name: "Ahmed & Co" }
      ]);
    }
  });

  app.get("/api/purchases/next-slip", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT COALESCE(MAX(slip_no), 1000) + 1 as next_slip 
        FROM wb_weighbridge 
        WHERE entry_type = 'PURCHASE'
      `);
      res.json({ next_slip: result.rows[0].next_slip });
    } catch (error: any) {
      console.error("Error fetching next slip number:", error);
      res.json({ next_slip: 1001 });
    }
  });

  return server;
}