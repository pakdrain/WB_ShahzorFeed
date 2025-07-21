import { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { Pool } from "pg";
import path from "path";
import fs from "fs";

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: "sabirthedev",
  host: "localhost",
  database: "sabirs_poultry",
  password: "sabirthedev",
  port: 5432,
});

async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS captured_images (
        id SERIAL PRIMARY KEY,
        image_name VARCHAR(255) NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
  }
}

// Initialize Redis client
const redisClient = createClient({
  socket: {
    host: "localhost",
    port: 6379,
  },
});

redisClient.on("connect", () => console.log("✅ Connected to Redis"));
redisClient.on("error", (err) => console.log("❌ Redis Client Error", err));

async function startServer() {
  await redisClient.connect();

  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

    socket.on("chat message", (msg) => {
      io.emit("chat message", msg); // Broadcast to all clients
    });
  });

  // Express app setup (assuming 'app' is defined here)
  const express = require("express");
  const app = express();
  const cors = require("cors");

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve static files from the 'uploads' directory
  const uploadsDir = path.join(__dirname, "uploads");
  app.use("/uploads", express.static(uploadsDir));

  // API endpoint to handle image uploads
  app.post("/api/upload", async (req: Request, res: Response) => {
    try {
      const { imageName, imageData } = req.body;

      if (!imageName || !imageData) {
        return res
          .status(400)
          .json({ error: "Image name and data are required." });
      }

      const imageBuffer = Buffer.from(imageData, "base64");
      const imagePath = path.join(uploadsDir, imageName);

      // Ensure the 'uploads' directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      fs.writeFileSync(imagePath, imageBuffer);

      // Save image details to the database
      await pool.query(
        "INSERT INTO captured_images (image_name, image_path) VALUES ($1, $2)",
        [imageName, imagePath],
      );

      console.log(`Image saved: ${imageName} to ${imagePath}`);
      res.status(201).json({
        message: "Image uploaded successfully!",
        imageUrl: `/uploads/${imageName}`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload image." });
    }
  });

  // API endpoint to fetch all captured images
  app.get("/api/images", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        "SELECT id, image_name, image_path, upload_date FROM captured_images ORDER BY upload_date DESC",
      );
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Fetch and save data from external API to inv_items table
  app.post("/api/fetch-and-save", async (req: Request, res: Response) => {
    try {
      console.log("🔄 Starting fetch and save operation...");

      // Fetch data from external API
      const apiResponse = await fetch("http://192.168.100.75:8080/api/inv_items");

      if (!apiResponse.ok) {
        throw new Error(`API request failed with status: ${apiResponse.status}`);
      }

      const apiData = await apiResponse.json();
      console.log("✅ API data fetched successfully, total records:", apiData?.length || 0);

      if (!Array.isArray(apiData) || apiData.length === 0) {
        return res.status(400).json({ 
          error: "No valid data received from API",
          receivedData: apiData 
        });
      }

      // Log sample of received data for debugging
      console.log("📋 Sample API data structure:", JSON.stringify(apiData[0], null, 2));

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const item of apiData) {
        try {
          // Extract item_id - this is the critical fix
          let itemId = null;

          // Try different possible field names for item_id (case-insensitive)
          const possibleIdFields = ['item_id', 'id', 'ID', 'ITEM_ID', 'itemId', 'ItemId'];
          for (const field of possibleIdFields) {
            if (item.hasOwnProperty(field) && item[field] !== undefined && item[field] !== null && item[field] !== '') {
              // Convert to integer and validate
              const parsedId = parseInt(String(item[field]));
              if (!isNaN(parsedId) && parsedId > 0) {
                itemId = parsedId;
                console.log(`✅ Found valid item_id: ${itemId} from field: ${field} (value: ${item[field]})`);
                break;
              }
            }
          }

          // If still no valid item_id found, skip this record or generate one
          if (itemId === null || isNaN(itemId) || itemId <= 0) {
            console.warn("⚠️ No valid item_id found in item:", JSON.stringify(item));
            // Get next available item_id
            const maxIdResult = await pool.query('SELECT COALESCE(MAX(item_id), 0) as max_id FROM inv_items');
            itemId = (maxIdResult.rows[0]?.max_id || 0) + 1;
            console.log(`🔧 Generated sequential item_id: ${itemId}`);
          }

          // Extract other fields with proper fallback logic
          const itemCode = String(item.item_code || item.ITEM_CODE || item.code || item.CODE || `CODE_${itemId}`).trim();
          const itemDesc = String(item.item_desc || item.ITEM_DESC || item.description || item.DESCRIPTION || item.desc || item.DESC || 'Unknown Item').trim();
          const uom = String(item.uom || item.UOM || item.unit || item.UNIT || 'KGS').trim();

          // Handle weight_in_kg as numeric
          let weightInKg = null;
          if (item.weight_in_kg !== undefined && item.weight_in_kg !== null && item.weight_in_kg !== '') {
            const parsedWeight = parseFloat(String(item.weight_in_kg));
            if (!isNaN(parsedWeight)) {
              weightInKg = parsedWeight;
            }
          }

          // Handle payable_acc as integer
          let payableAcc = null;
          if (item.payable_acc !== undefined && item.payable_acc !== null && item.payable_acc !== '') {
            const parsedAcc = parseInt(String(item.payable_acc));
            if (!isNaN(parsedAcc)) {
              payableAcc = parsedAcc;
            }
          }

          console.log(`💾 Preparing to save - item_id: ${itemId}, item_code: ${itemCode}, item_desc: ${itemDesc}`);

          // First check if record exists
          const existsQuery = 'SELECT item_id FROM inv_items WHERE item_id = $1 OR item_code = $2';
          const existsResult = await pool.query(existsQuery, [itemId, itemCode]);

          let result;
          if (existsResult.rows.length > 0) {
            // Update existing record
            const updateQuery = `
              UPDATE inv_items 
              SET item_desc = $3, uom = $4, weight_in_kg = $5, payable_acc = $6
              WHERE item_id = $1 OR item_code = $2
              RETURNING *
            `;
            result = await pool.query(updateQuery, [itemId, itemCode, itemDesc, uom, weightInKg, payableAcc]);
            console.log(`🔄 Updated existing item with item_id: ${itemId}`);
          } else {
            // Insert new record
            const insertQuery = `
              INSERT INTO inv_items (item_id, item_code, item_desc, uom, weight_in_kg, payable_acc) 
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING *
            `;
            result = await pool.query(insertQuery, [itemId, itemCode, itemDesc, uom, weightInKg, payableAcc]);
            console.log(`✅ Inserted new item with item_id: ${itemId}`);
          }

          if (result.rows && result.rows.length > 0) {
            const savedItem = result.rows[0];
            console.log(`✅ Successfully processed item:`, {
              item_id: savedItem.item_id,
              item_code: savedItem.item_code,
              item_desc: savedItem.item_desc
            });
            results.push(savedItem);
            successCount++;

            // Immediate verification query for this specific item
            const verifyQuery = 'SELECT item_id, item_code FROM inv_items WHERE item_id = $1';
            const verifyResult = await pool.query(verifyQuery, [savedItem.item_id]);
            if (verifyResult.rows.length > 0 && verifyResult.rows[0].item_id !== null) {
              console.log(`🔍 Verification passed - item_id ${savedItem.item_id} is properly saved`);
            } else {
              console.error(`❌ Verification failed - item_id is NULL for record ${savedItem.item_id}`);
            }
          } else {
            console.error(`❌ No result returned for item_id: ${itemId}`);
            errorCount++;
          }

        } catch (itemError: any) {
          console.error(`❌ Error processing individual item:`, itemError.message);
          console.error(`❌ Failed item data:`, JSON.stringify(item, null, 2));
          errorCount++;
        }
      }

      // Final verification query
      const finalVerificationQuery = 'SELECT item_id, item_code, item_desc FROM inv_items WHERE item_id IS NOT NULL ORDER BY item_id DESC LIMIT 10';
      const finalVerificationResult = await pool.query(finalVerificationQuery);
      console.log("🔍 Final database verification - Recent items with non-null item_id:", finalVerificationResult.rows);

      // Check for NULL item_id entries
      const nullCheckQuery = 'SELECT COUNT(*) as null_count FROM inv_items WHERE item_id IS NULL';
      const nullCheckResult = await pool.query(nullCheckQuery);
      console.log("🔍 NULL item_id count:", nullCheckResult.rows[0]?.null_count || 0);

      console.log(`📊 Operation completed - Success: ${successCount}, Errors: ${errorCount}`);

      res.json({
        success: true,
        message: `Data fetched and saved successfully. ${successCount} items processed successfully, ${errorCount} errors.`,
        totalProcessed: apiData.length,
        successCount: successCount,
        errorCount: errorCount,
        nullItemIdCount: nullCheckResult.rows[0]?.null_count || 0,
        sampleSavedData: results.slice(0, 3),
        recentDbEntries: finalVerificationResult.rows
      });

    } catch (error: any) {
      console.error("❌ Fatal error in fetch-and-save:", error);
      res.status(500).json({ 
        error: "Failed to fetch and save data", 
        details: error.message,
        stack: error.stack
      });
    }
  });

  // GET specific item from inv_items table
  app.get("/api/items/:itemId", async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const query = `SELECT item_id, item_code, item_desc, uom FROM inv_items WHERE item_id = $1`;
      const result = await pool.query(query, [itemId]);

      if (result.rows.length > 0) {
        console.log(`Fetched item with item_id: ${itemId}`);
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (error: any) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // GET all items from inv_items table
  app.get("/api/items", async (req: Request, res: Response) => {
    try {
      const query = `SELECT item_id, item_code, item_desc, uom FROM inv_items ORDER BY item_desc`;
      const result = await pool.query(query);

      console.log(`Fetched ${result.rows.length} items`);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get(
    "/api/vouchers/slip-data/:slipNo",
    async (req: Request, res: Response) => {
      try {
        const { slipNo } = req.params;

        const query = `
        SELECT 
          WW.SLIP_NO, 
          WW.WB_ID,
          WWIP.VEHICLE_NO,
          WWIP.ITEM_ID AS ITEM_ID,
          WWIP.ITEM_CODE AS ITEM_CODE,
          WWIP.ITEM_DESC AS ITEM_DESC, 
          WWIP.VENDOR_ID AS VENDOR_ID,
          WWIP.VENDOR_NAME AS VENDOR_NAME,
          WW.FREIGHT
        FROM 
          WB_WEIGHBRIDGE WW
        JOIN 
          WB_WEIGHBRIDGE_ITEMS_PURCHASE WWIP
        ON 
          WW.WB_ID = WWIP.WB_ID
        WHERE 
          WW.SLIP_NO = $1
          AND (COALESCE(WW.FIRST_WEIGHT::numeric, 0) > 0 
               AND COALESCE(WW.SECOND_WEIGHT::numeric, 0) > 0)
      `;

        const result = await pool.query(query, [slipNo]);

        console.log(
          `Fetched ${result.rows.length} records for slip number: ${slipNo}`,
        );
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error fetching slip data by slip number:", error);
        res.status(500).json({ error: "Failed to fetch slip data" });
      }
    },
  );

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

  // Get freight items for freight voucher details section
  app.get(
    "/api/freight-vouchers/:freightId/items",
    async (req: Request, res: Response) => {
      try {
        const { freightId } = req.params;

        const query = `
        SELECT 
          gfi.freight_item_id,
          gfi.freight_id,
          gfi.vendor_id,
          gfi.customer_id,
          gfi.igp_id,
          gfi.ogp_id,
          gfi.item_id,
          gfi.freight_amount,
          gfi.debit,
          gfi.credit,
          gfi.remarks as item_desc,
          gfi.company_id,
          gfi.branch_id,
          gfi.dept_id,
          gfi.last_update_by,
          gfi.last_update_date,
          gfi.freight_charged_to,
          gfi.actual_frt_amount,
          gfi.creation_date,
          gfi.created_by,
          gfi.voucher_id,
          gfi.vehicale_no,
          gfi.delivery_terms,
          gfi.wb_id,
          COALESCE(iv.vendor_name, 'Unknown Vendor') as vendor_name,
          COALESCE(ii.item_code, 'Unknown Code') as item_code,
          COALESCE(ii.item_desc, gfi.remarks, 'Unknown Item') as full_item_desc
        FROM gl_freight_items gfi
        LEFT JOIN inv_vendors iv ON gfi.vendor_id = iv.vendor_id
        LEFT JOIN inv_items ii ON gfi.item_id = ii.item_id
        WHERE gfi.freight_id = $1
        ORDER BY gfi.freight_item_id
      `;

        const result = await pool.query(query, [parseInt(freightId)]);

        console.log(
          `Fetched ${result.rows.length} freight items for freight ID: ${freightId}`,
        );
        console.log("Sample freight item:", result.rows[0]);
        res.json(result.rows);
      } catch (error: any) {
        console.error("Error fetching freight items:", error);
        res.status(500).json({ error: "Failed to fetch freight items" });
      }
    },
  );

  // Static file serving for captured images is already handled above

  return httpServer;
}