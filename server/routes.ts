
import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupImageCapture } from "./image-capture";
import { setupStreamService } from "./stream-service";
import { Pool } from "pg";
import type { Request, Response } from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Setup image capture and stream service
  setupImageCapture(app, httpServer);
  setupStreamService(httpServer);

  // Database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Test database connection
  app.get("/api/db-test", async (req: Request, res: Response) => {
    try {
      const result = await pool.query("SELECT NOW()");
      res.json({ success: true, time: result.rows[0].now });
    } catch (error: any) {
      console.error("Database connection error:", error);
      res.status(500).json({ error: "Database connection failed" });
    }
  });

  // GET entry types from sys_data_configg table
  app.get("/api/entry-types", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT data_config_desc 
        FROM sys_data_configg 
        WHERE sys_config_id = 11
        ORDER BY data_config_desc
      `;

      const result = await pool.query(query);

      console.log(
        `Fetched ${result.rows.length} entry types from sys_data_configg`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching entry types:", error);
      // Fallback data when database is not available
      const fallbackData = [
        { data_config_desc: "PURCHASE" },
        { data_config_desc: "SALE" },
        { data_config_desc: "PURCHASE_RETURN" },
        { data_config_desc: "SALE_RETURN" },
      ];
      console.log("Using fallback entry types data");
      res.json(fallbackData);
    }
  });

  // GET branches from sys_branches table
  app.get("/api/branches", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT branch_id, branch_name 
        FROM sys_branches 
        ORDER BY branch_name
      `;

      const result = await pool.query(query);

      console.log(
        `Fetched ${result.rows.length} branches from sys_branches table`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching branches from sys_branches:", error);
      // Fallback data when database is not available
      const fallbackData = [
        { branch_id: 1, branch_name: "Main Branch" },
        { branch_id: 2, branch_name: "Shahzor" },
        { branch_id: 3, branch_name: "Secondary Branch" },
      ];
      console.log("Using fallback branches data");
      res.json(fallbackData);
    }
  });

  // GET items from inv_items table for item LOV
  app.get("/api/inv-items", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT item_id, item_code, item_desc 
        FROM inv_items 
        ORDER BY item_desc
      `;

      const result = await pool.query(query);

      console.log(
        `Fetched ${result.rows.length} items from inv_items table`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching items from inv_items:", error);
      // Fallback data when database is not available
      const fallbackData = [
        { item_id: 1, item_code: "FEED001", item_desc: "Chicken Feed - Starter" },
        { item_id: 2, item_code: "FEED002", item_desc: "Chicken Feed - Grower" },
        { item_id: 3, item_code: "FEED003", item_desc: "Chicken Feed - Finisher" },
        { item_id: 4, item_code: "SUPP001", item_desc: "Feed Supplements" },
        { item_id: 5, item_code: "MED001", item_desc: "Poultry Medicine" },
      ];
      console.log("Using fallback items data");
      res.json(fallbackData);
    }
  });

  // Create wb_weighbridge table if it doesn't exist
  app.post("/api/create-weighbridge-table", async (req: Request, res: Response) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wb_weighbridge (
          wb_id SERIAL PRIMARY KEY,
          slip_no INTEGER,
          slip_date DATE,
          slip_in_time TIMESTAMP,
          slip_out_time TIMESTAMP,
          vehicle_no VARCHAR(50),
          driver_name VARCHAR(100),
          driver_cnic VARCHAR(20),
          driver_mobile VARCHAR(20),
          entry_type VARCHAR(30),
          gross_weight NUMERIC(16,4),
          tare_weight NUMERIC(16,4),
          net_weight NUMERIC(16,4),
          first_weight NUMERIC(16,4),
          second_weight NUMERIC(16,4),
          offline_entry VARCHAR(10),
          online_entry VARCHAR(10),
          branch_id INTEGER,
          do_date DATE,
          freight NUMERIC(16,4),
          remarks VARCHAR(1000),
          created_by INTEGER,
          creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_updated_by INTEGER,
          last_update_date TIMESTAMP
        )
      `);

      res.json({
        success: true,
        message: "wb_weighbridge table created successfully",
      });
    } catch (error: any) {
      console.error("Error creating wb_weighbridge table:", error);
      res.status(500).json({ error: "Failed to create wb_weighbridge table" });
    }
  });

  // Create wb_weighbridge_items_purchase table if it doesn't exist
  app.post("/api/create-weighbridge-items-table", async (req: Request, res: Response) => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS wb_weighbridge_items_purchase (
          wb_item_id SERIAL PRIMARY KEY,
          wb_id INTEGER REFERENCES wb_weighbridge(wb_id),
          baradana_type VARCHAR(100),
          igp_no VARCHAR(50),
          vehicle_no VARCHAR(50),
          weight_per_bags NUMERIC(16,4),
          igp_date DATE,
          supplier_weight NUMERIC(16,4),
          quality_deduction NUMERIC(16,4),
          no_of_bags NUMERIC(16,4),
          vendor_name VARCHAR(200),
          bag_condition VARCHAR(100),
          po_no VARCHAR(50),
          item_code VARCHAR(50),
          item_desc VARCHAR(500),
          po_qty NUMERIC(16,4),
          igp_qty NUMERIC(16,4),
          balance_qty NUMERIC(16,4),
          customer_name VARCHAR(200),
          do_no VARCHAR(50),
          do_qty NUMERIC(16,4),
          dc_qty NUMERIC(16,4),
          do_date DATE,
          branch VARCHAR(200),
          dc_id VARCHAR(50),
          customer_id VARCHAR(50),
          item_id VARCHAR(50),
          do_id VARCHAR(50),
          created_by INTEGER,
          creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_updated_by INTEGER,
          last_update_date TIMESTAMP
        )
      `);

      res.json({
        success: true,
        message: "wb_weighbridge_items_purchase table created successfully",
      });
    } catch (error: any) {
      console.error("Error creating wb_weighbridge_items_purchase table:", error);
      res.status(500).json({ error: "Failed to create wb_weighbridge_items_purchase table" });
    }
  });

  // Save weighbridge data to wb_weighbridge table
  app.post("/api/weighbridge/save", async (req: Request, res: Response) => {
    try {
      const weighbridgeData = req.body;

      const query = `
        INSERT INTO wb_weighbridge (
          slip_no, slip_date, slip_in_time, slip_out_time, vehicle_no, 
          driver_name, driver_cnic, driver_mobile, entry_type, gross_weight, 
          tare_weight, net_weight, first_weight, second_weight, offline_entry, 
          online_entry, branch_id, do_date, freight, remarks, created_by, creation_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING wb_id
      `;

      const values = [
        weighbridgeData.slipNo,
        weighbridgeData.slipDate,
        weighbridgeData.slipInTime,
        weighbridgeData.slipOutTime,
        weighbridgeData.vehicleNo,
        weighbridgeData.driverName,
        weighbridgeData.driverCnic,
        weighbridgeData.driverMobile,
        weighbridgeData.entryType,
        weighbridgeData.grossWeight,
        weighbridgeData.tareWeight,
        weighbridgeData.netWeight,
        weighbridgeData.firstWeight,
        weighbridgeData.secondWeight,
        weighbridgeData.offlineEntry,
        weighbridgeData.onlineEntry,
        weighbridgeData.branchId,
        weighbridgeData.doDate,
        weighbridgeData.freight,
        weighbridgeData.remarks,
        weighbridgeData.createdBy,
        weighbridgeData.creationDate,
      ];

      const result = await pool.query(query, values);

      console.log(`Weighbridge data saved with wb_id: ${result.rows[0].wb_id}`);
      res.json({
        success: true,
        wb_id: result.rows[0].wb_id,
        message: "Weighbridge data saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving weighbridge data:", error);
      res.status(500).json({ error: "Failed to save weighbridge data" });
    }
  });

  // Update weighbridge data in wb_weighbridge table
  app.put("/api/weighbridge/update/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      const weighbridgeData = req.body;

      const query = `
        UPDATE wb_weighbridge SET
          slip_no = $1, slip_date = $2, slip_in_time = $3, slip_out_time = $4, 
          vehicle_no = $5, driver_name = $6, driver_cnic = $7, driver_mobile = $8, 
          entry_type = $9, gross_weight = $10, tare_weight = $11, net_weight = $12, 
          first_weight = $13, second_weight = $14, offline_entry = $15, 
          online_entry = $16, branch_id = $17, do_date = $18, freight = $19, 
          remarks = $20, last_updated_by = $21, last_update_date = $22
        WHERE wb_id = $23
        RETURNING wb_id
      `;

      const values = [
        weighbridgeData.slipNo,
        weighbridgeData.slipDate,
        weighbridgeData.slipInTime,
        weighbridgeData.slipOutTime,
        weighbridgeData.vehicleNo,
        weighbridgeData.driverName,
        weighbridgeData.driverCnic,
        weighbridgeData.driverMobile,
        weighbridgeData.entryType,
        weighbridgeData.grossWeight,
        weighbridgeData.tareWeight,
        weighbridgeData.netWeight,
        weighbridgeData.firstWeight,
        weighbridgeData.secondWeight,
        weighbridgeData.offlineEntry,
        weighbridgeData.onlineEntry,
        weighbridgeData.branchId,
        weighbridgeData.doDate,
        weighbridgeData.freight,
        weighbridgeData.remarks,
        weighbridgeData.lastUpdatedBy,
        weighbridgeData.lastUpdateDate,
        wbId,
      ];

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Weighbridge record not found" });
      }

      console.log(`Weighbridge data updated for wb_id: ${result.rows[0].wb_id}`);
      res.json({
        success: true,
        wb_id: result.rows[0].wb_id,
        message: "Weighbridge data updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating weighbridge data:", error);
      res.status(500).json({ error: "Failed to update weighbridge data" });
    }
  });

  // Save purchase items data to wb_weighbridge_items_purchase table
  app.post("/api/purchase-items", async (req: Request, res: Response) => {
    try {
      const purchaseItemsData = req.body;

      const query = `
        INSERT INTO wb_weighbridge_items_purchase (
          wb_id, baradana_type, igp_no, vehicle_no, weight_per_bags, igp_date, 
          supplier_weight, quality_deduction, no_of_bags, vendor_name, bag_condition, 
          po_no, item_code, item_desc, po_qty, igp_qty, balance_qty, customer_name, 
          do_no, do_qty, dc_qty, do_date, branch, dc_id, customer_id, item_id, do_id,
          created_by, creation_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        RETURNING wb_item_id
      `;

      const values = [
        purchaseItemsData.wb_id,
        purchaseItemsData.baradana_type,
        purchaseItemsData.igp_no,
        purchaseItemsData.vehicle_no,
        purchaseItemsData.weight_per_bags,
        purchaseItemsData.igp_date,
        purchaseItemsData.supplier_weight,
        purchaseItemsData.quality_deduction,
        purchaseItemsData.no_of_bags,
        purchaseItemsData.vendor_name,
        purchaseItemsData.bag_condition,
        purchaseItemsData.po_no,
        purchaseItemsData.item_code,
        purchaseItemsData.item_desc,
        purchaseItemsData.po_qty,
        purchaseItemsData.igp_qty,
        purchaseItemsData.balance_qty,
        purchaseItemsData.customer_name,
        purchaseItemsData.do_no,
        purchaseItemsData.do_qty,
        purchaseItemsData.dc_qty,
        purchaseItemsData.do_date,
        purchaseItemsData.branch,
        purchaseItemsData.dc_id,
        purchaseItemsData.customer_id,
        purchaseItemsData.item_id,
        purchaseItemsData.do_id,
        purchaseItemsData.created_by,
        purchaseItemsData.creation_date,
      ];

      const result = await pool.query(query, values);

      console.log(`Purchase items data saved with wb_item_id: ${result.rows[0].wb_item_id}`);
      res.json({
        success: true,
        wb_item_id: result.rows[0].wb_item_id,
        message: "Purchase items data saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving purchase items data:", error);
      res.status(500).json({ error: "Failed to save purchase items data" });
    }
  });

  // Update purchase items data in wb_weighbridge_items_purchase table
  app.put("/api/purchase-items/update/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;
      const purchaseItemsData = req.body;

      // First delete existing items for this wb_id
      await pool.query("DELETE FROM wb_weighbridge_items_purchase WHERE wb_id = $1", [wbId]);

      // Then insert new items
      const query = `
        INSERT INTO wb_weighbridge_items_purchase (
          wb_id, baradana_type, igp_no, vehicle_no, weight_per_bags, igp_date, 
          supplier_weight, quality_deduction, no_of_bags, vendor_name, bag_condition, 
          po_no, item_code, item_desc, po_qty, igp_qty, balance_qty, customer_name, 
          do_no, do_qty, dc_qty, do_date, branch, dc_id, customer_id, item_id, do_id,
          last_updated_by, last_update_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
        RETURNING wb_item_id
      `;

      const values = [
        wbId,
        purchaseItemsData.baradana_type,
        purchaseItemsData.igp_no,
        purchaseItemsData.vehicle_no,
        purchaseItemsData.weight_per_bags,
        purchaseItemsData.igp_date,
        purchaseItemsData.supplier_weight,
        purchaseItemsData.quality_deduction,
        purchaseItemsData.no_of_bags,
        purchaseItemsData.vendor_name,
        purchaseItemsData.bag_condition,
        purchaseItemsData.po_no,
        purchaseItemsData.item_code,
        purchaseItemsData.item_desc,
        purchaseItemsData.po_qty,
        purchaseItemsData.igp_qty,
        purchaseItemsData.balance_qty,
        purchaseItemsData.customer_name,
        purchaseItemsData.do_no,
        purchaseItemsData.do_qty,
        purchaseItemsData.dc_qty,
        purchaseItemsData.do_date,
        purchaseItemsData.branch,
        purchaseItemsData.dc_id,
        purchaseItemsData.customer_id,
        purchaseItemsData.item_id,
        purchaseItemsData.do_id,
        purchaseItemsData.lastUpdatedBy,
        purchaseItemsData.lastUpdateDate,
      ];

      const result = await pool.query(query, values);

      console.log(`Purchase items data updated for wb_id: ${wbId}`);
      res.json({
        success: true,
        wb_item_id: result.rows[0].wb_item_id,
        message: "Purchase items data updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating purchase items data:", error);
      res.status(500).json({ error: "Failed to update purchase items data" });
    }
  });

  // Get all weighbridge records with master-detail relationship
  app.get("/api/weighbridge/all", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          wb.*,
          wbi.*,
          sb.branch_name
        FROM wb_weighbridge wb
        LEFT JOIN wb_weighbridge_items_purchase wbi ON wb.wb_id = wbi.wb_id
        LEFT JOIN sys_branches sb ON wb.branch_id = sb.branch_id
        ORDER BY wb.wb_id DESC, wbi.wb_item_id
      `;

      const result = await pool.query(query);

      console.log(`Fetched ${result.rows.length} weighbridge records with details`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching weighbridge records:", error);
      res.status(500).json({ error: "Failed to fetch weighbridge records" });
    }
  });

  // Get weighbridge record by wb_id with master-detail relationship
  app.get("/api/weighbridge/:wbId", async (req: Request, res: Response) => {
    try {
      const { wbId } = req.params;

      // Get master data
      const masterQuery = `
        SELECT 
          wb.*,
          sb.branch_name,
          CASE 
            WHEN wb.offline_entry = 'Yes' THEN 'Yes'
            ELSE 'No'
          END as offline_entry,
          CASE 
            WHEN wb.online_entry = 'Yes' THEN 'Yes'
            ELSE 'No'
          END as online_entry
        FROM wb_weighbridge wb
        LEFT JOIN sys_branches sb ON wb.branch_id = sb.branch_id
        WHERE wb.wb_id = $1
      `;

      const masterResult = await pool.query(masterQuery, [wbId]);

      if (masterResult.rows.length === 0) {
        return res.status(404).json({ error: "Weighbridge record not found" });
      }

      // Get detail data
      const detailQuery = `
        SELECT 
          wbi.*,
          wbi.baradana_type as bardana_type
        FROM wb_weighbridge_items_purchase wbi 
        WHERE wbi.wb_id = $1
      `;

      const detailResult = await pool.query(detailQuery, [wbId]);

      console.log(`Fetched weighbridge record ${wbId} with ${detailResult.rows.length} detail records`);
      res.json({
        master: masterResult.rows[0],
        details: detailResult.rows.length > 0 ? detailResult.rows[0] : {}
      });
    } catch (error: any) {
      console.error("Error fetching weighbridge record:", error);
      res.status(500).json({ error: "Failed to fetch weighbridge record" });
    }
  });

  // Get all first weight records (records without second weight)
  app.get("/api/purchase/first-weight-records", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          wb.*,
          wbi.*,
          sb.branch_name
        FROM wb_weighbridge wb
        LEFT JOIN wb_weighbridge_items_purchase wbi ON wb.wb_id = wbi.wb_id
        LEFT JOIN sys_branches sb ON wb.branch_id = sb.branch_id
        WHERE wb.first_weight IS NOT NULL 
        ORDER BY wb.wb_id DESC, wbi.wb_item_id
      `;

      const result = await pool.query(query);

      console.log(`Fetched ${result.rows.length} first weight records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching first weight records:", error);
      res.status(500).json({ error: "Failed to fetch first weight records" });
    }
  });

  // Get offline purchase records
  app.get("/api/purchases/offline", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT 
          wb.*,
          wbi.*,
          sb.branch_name
        FROM wb_weighbridge wb
        LEFT JOIN wb_weighbridge_items_purchase wbi ON wb.wb_id = wbi.wb_id
        LEFT JOIN sys_branches sb ON wb.branch_id = sb.branch_id
        WHERE wb.offline_entry = 'Yes'
        ORDER BY wb.wb_id DESC, wbi.wb_item_id
      `;

      const result = await pool.query(query);

      console.log(`Fetched ${result.rows.length} offline purchase records`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching offline purchase records:", error);
      res.status(500).json({ error: "Failed to fetch offline purchase records" });
    }
  });

  // Get DO data by DO number from wb_weighbridge_items_purchase table
  app.get("/api/do-data/:doNo", async (req: Request, res: Response) => {
    try {
      const { doNo } = req.params;

      const query = `
        SELECT 
          wbi.*,
          wb.slip_no,
          wb.slip_date,
          wb.vehicle_no,
          wb.driver_name,
          wb.entry_type,
          wb.gross_weight,
          wb.tare_weight,
          wb.net_weight,
          wb.first_weight,
          wb.second_weight,
          wb.offline_entry,
          wb.online_entry,
          wb.branch_id,
          wb.do_date,
          wb.freight,
          wb.remarks,
          wbi.do_date as delivery_term
        FROM wb_weighbridge_items_purchase wbi
        LEFT JOIN wb_weighbridge wb ON wbi.wb_id = wb.wb_id
        WHERE wbi.do_no = $1
      `;

      const result = await pool.query(query, [doNo]);

      console.log(
        `Fetched ${result.rows.length} records for DO number: ${doNo}`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching DO data:", error);
      res.status(500).json({ error: "Failed to fetch DO data" });
    }
  });

  // GET bardana types from sys_data_configg table
  app.get("/api/bardana-types", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT data_config_segment1 || '-' || data_config_desc AS type, data_config_segment1 
        FROM sys_data_configg 
        WHERE sys_config_id = 15
        ORDER BY data_config_desc
      `;

      const result = await pool.query(query);

      console.log(
        `Fetched ${result.rows.length} bardana types from sys_data_configg`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching bardana types:", error);
      res.status(500).json({ error: "Failed to fetch bardana types" });
    }
  });

  // GET percentage data from sys_data_configg table
  app.get("/api/percentage-data", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT data_config_desc 
        FROM sys_data_configg 
        WHERE sys_config_id = 16
        ORDER BY data_config_desc
      `;

      const result = await pool.query(query);

      console.log(
        `Fetched ${result.rows.length} percentage data records from sys_data_configg`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching percentage data:", error);
      res.status(500).json({ error: "Failed to fetch percentage data" });
    }
  });

  // GET vendor data from sys_data_configg table for offline mode (weight field)
  app.get("/api/vendor-data", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT data_config_desc as view, data_config_desc as return 
        FROM sys_data_configg 
        WHERE sys_config_id = 16
        ORDER BY data_config_desc
      `;

      const result = await pool.query(query);

      console.log(
        `Fetched ${result.rows.length} vendor records from sys_data_configg`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching vendor data:", error);
      // Fallback data when database is not available - from sys_data_configg sys_config_id=16
      const fallbackData = [
        { view: "Ali Traders", return: "Ali Traders" },
        { view: "Ahmed & Co", return: "Ahmed & Co" },
        { view: "Malik Industries", return: "Malik Industries" },
        { view: "Khan Suppliers", return: "Khan Suppliers" },
        { view: "Fatima Trading", return: "Fatima Trading" },
      ];
      console.log("Using fallback vendor data");
      res.json(fallbackData);
    }
  });

  // GET vendors from inv_vendors table for vendor LOV
  app.get("/api/vendors", async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT vendor_id, vendor_name 
        FROM inv_vendors 
        ORDER BY vendor_name
      `;

      const result = await pool.query(query);

      console.log(
        `Fetched ${result.rows.length} vendors from inv_vendors table`,
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching vendors from inv_vendors:", error);
      // Fallback data when database is not available
      const fallbackData = [
        { vendor_id: 1, vendor_name: "Ali Traders" },
        { vendor_id: 2, vendor_name: "Ahmed & Co" },
        { vendor_id: 3, vendor_name: "Malik Industries" },
        { vendor_id: 4, vendor_name: "Khan Suppliers" },
        { vendor_id: 5, vendor_name: "Fatima Trading" },
      ];
      console.log("Using fallback vendors data");
      res.json(fallbackData);
    }
  });

  // Voucher API endpoints for gl_vouchers table

  // Create gl_vouchers table if it doesn't exist
  app.post(
    "/api/create-vouchers-table",
    async (req: Request, res: Response) => {
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
          hatch_no          VARCHAR(200),
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

        res.json({
          success: true,
          message: "gl_vouchers table created successfully",
        });
      } catch (error: any) {
        console.error("Error creating gl_vouchers table:", error);
        res.status(500).json({ error: "Failed to create gl_vouchers table" });
      }
    },
  );

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
        voucherData.voucherType || "CPV",
        voucherData.docDate,
        voucherData.remarks,
        voucherData.createdBy,
        voucherData.creationDate,
        "Create",
        voucherData.branch,
        voucherData.docNo,
        voucherData.remarks,
        "Sabirs' Poultry (Pvt.) Ltd",
      ];

      const result = await pool.query(query, values);

      console.log(`Voucher saved with ID: ${result.rows[0].voucher_id}`);
      res.json({
        success: true,
        voucher_id: result.rows[0].voucher_id,
        message: "Voucher saved successfully",
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
          gv.voucher_id,
          gv.voucher_type,
          gv.voucher_no,
          gv.voucher_date,
          gv.description,
          gv.status,
          gv.reference_no,
          gv.branch_id,
          gv.company_name,
          gv.entry_remarks,
          gv.creation_date,
          wbi.customer_name,
          wbi.item_desc,
          wb.remarks
        FROM gl_vouchers gv
        LEFT JOIN wb_weighbridge_items_purchase wbi ON gv.reference_no = wbi.do_no
        LEFT JOIN wb_weighbridge wb ON wbi.wb_id = wb.wb_id
        ORDER BY gv.voucher_id DESC
      `;

      const result = await pool.query(query);

      console.log(`Fetched ${result.rows.length} vouchers with DO data`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching vouchers:", error);
      res.status(500).json({ error: "Failed to fetch vouchers" });
    }
  });

  // GET purchase record by slip number
  app.get("/api/purchase/by-slip/:slipNo", async (req: Request, res: Response) => {
    try {
      const { slipNo } = req.params;
      const { entry_type } = req.query;

      console.log("Searching for slip:", slipNo, "with entry_type:", entry_type);

      // Build the WHERE clause based on whether entry_type is provided
      let whereClause = "wb.slip_no = $1";
      let queryParams: any[] = [slipNo];

      if (entry_type) {
        // If searching for PURCHASE, also include PURCHASE_RETURN
        if (entry_type === 'PURCHASE') {
          whereClause += " AND wb.entry_type IN ('PURCHASE', 'PURCHASE_RETURN')";
        } else if (entry_type === 'SALE') {
          whereClause += " AND wb.entry_type IN ('SALE', 'SALE_RETURN')";
        } else {
          whereClause += " AND wb.entry_type = $2";
          queryParams.push(entry_type);
        }
      }

      // Query to get master data
      const masterQuery = `
        SELECT 
          wb.*,
          CASE 
            WHEN wb.offline_entry = 'Yes' THEN 'Yes'
            ELSE 'No'
          END as offline_entry,
          CASE 
            WHEN wb.online_entry = 'Yes' THEN 'Yes'
            ELSE 'No'
          END as online_entry
        FROM wb_weighbridge wb 
        WHERE ${whereClause}
        ORDER BY wb.wb_id DESC
        LIMIT 1
      `;

      const masterResult = await pool.query(masterQuery, queryParams);

      if (masterResult.rows.length === 0) {
        return res.status(404).json({ 
          error: entry_type 
            ? `No ${entry_type} record found for slip number ${slipNo}` 
            : `No record found for slip number ${slipNo}` 
        });
      }

      const master = masterResult.rows[0];

      // Query to get detail data
      const detailQuery = `
        SELECT 
          wbi.*,
          wbi.baradana_type as bardana_type
        FROM wb_weighbridge_items_purchase wbi 
        WHERE wbi.wb_id = $1
      `;

      const detailResult = await pool.query(detailQuery, [master.wb_id]);

      console.log(`Found slip ${slipNo} with entry_type: ${master.entry_type}`);
      res.json({
        master: master,
        details: detailResult.rows
      });
    } catch (error: any) {
      console.error("Error fetching purchase by slip number:", error);
      res.status(500).json({ error: "Failed to fetch purchase data" });
    }
  });

  // GET sales record by slip number
  app.get("/api/sales/by-slip/:slipNo", async (req: Request, res: Response) => {
    try {
      const { slipNo } = req.params;
      const { entry_type } = req.query;

      console.log("Searching for sales slip:", slipNo, "with entry_type:", entry_type);

      // Build the WHERE clause based on whether entry_type is provided
      let whereClause = "wb.slip_no = $1";
      let queryParams: any[] = [slipNo];

      if (entry_type) {
        // If searching for SALE, also include SALE_RETURN
        if (entry_type === 'SALE') {
          whereClause += " AND wb.entry_type IN ('SALE', 'SALE_RETURN')";
        } else if (entry_type === 'PURCHASE') {
          whereClause += " AND wb.entry_type IN ('PURCHASE', 'PURCHASE_RETURN')";
        } else {
          whereClause += " AND wb.entry_type = $2";
          queryParams.push(entry_type);
        }
      }

      // Query to get master data
      const masterQuery = `
        SELECT 
          wb.*,
          CASE 
            WHEN wb.offline_entry = 'Yes' THEN 'Yes'
            ELSE 'No'
          END as offline_entry,
          CASE 
            WHEN wb.online_entry = 'Yes' THEN 'Yes'
            ELSE 'No'
          END as online_entry
        FROM wb_weighbridge wb 
        WHERE ${whereClause}
        ORDER BY wb.wb_id DESC
        LIMIT 1
      `;

      const masterResult = await pool.query(masterQuery, queryParams);

      if (masterResult.rows.length === 0) {
        return res.status(404).json({ 
          error: entry_type 
            ? `No ${entry_type} record found for slip number ${slipNo}` 
            : `No record found for slip number ${slipNo}` 
        });
      }

      const master = masterResult.rows[0];

      // Query to get detail data
      const detailQuery = `
        SELECT 
          wbi.*,
          wbi.baradana_type as bardana_type
        FROM wb_weighbridge_items_purchase wbi 
        WHERE wbi.wb_id = $1
      `;

      const detailResult = await pool.query(detailQuery, [master.wb_id]);

      console.log(`Found sales slip ${slipNo} with entry_type: ${master.entry_type}`);
      res.json({
        master: master,
        details: detailResult.rows
      });
    } catch (error: any) {
      console.error("Error fetching sales by slip number:", error);
      res.status(500).json({ error: "Failed to fetch sales data" });
    }
  });

  // Static file serving for captured images is already handled above

  return httpServer;
}
