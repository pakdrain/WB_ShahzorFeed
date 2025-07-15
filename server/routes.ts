.log(`Processing nested array of ${data.items.length} items...`);
        dataToProcess = data.items;
      } else if (
        data &&
        typeof data === "object" &&
        data.data &&
        Array.isArray(data.data)
      ) {
        console.log(`Processing nested data array of ${data.data.length} items...`);
        dataToProcess = data.data;
      } else if (typeof data === "object" && data !== null) {
        console.log("Processing single object...");
        dataToProcess = [data];
      } else {
        throw new Error("Invalid data format received from URL. Expected JSON object or array.");
      }

      // Process all items
      for (let i = 0; i < dataToProcess.length; i++) {
        try {
          const wasInserted = await insertItemToDatabase(dataToProcess[i], i);
          if (wasInserted) {
            recordsInserted++;
          }
        } catch (error: any) {
          console.error(`Failed to process item ${i}:`, error.message);
          recordsSkipped++;
        }
      }

      // Verify data was actually saved by querying the table
      const verifyQuery = "SELECT COUNT(*) as count FROM sys_data_configg";
      const verifyResult = await pool.query(verifyQuery);
      const totalRecordsInTable = parseInt(verifyResult.rows[0].count);

      console.log(
        `✅ Processing complete: ${recordsInserted} inserted, ${recordsUpdated} updated, ${recordsSkipped} skipped. Total records in table: ${totalRecordsInTable}`
      );

      res.json({
        success: true,
        message: `Data fetched and saved successfully to sys_data_configg table`,
        recordsInserted,
        recordsUpdated,
        recordsSkipped,
        totalRecordsInTable,
        targetTable: "sys_data_configg",
        data: dataToProcess.slice(0, 3), // Show first 3 records for verification
      });
    } catch (error: any) {
      console.error("❌ Error fetching and saving sys config data:", error);
      console.error("Error stack:", error.stack);
      
      // Provide more specific error messages
      let errorMessage = "Failed to fetch and save sys config data";
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = "Network error: Failed to fetch data from URL. Please check your internet connection and URL accessibility.";
      } else if (error.message.includes('JSON') || error.message.includes('parse')) {
        errorMessage = "Data format error: Invalid JSON response from URL. Please check the API response format.";
      } else if (error.message.includes('INSERT') || error.message.includes('duplicate') || error.message.includes('database')) {
        errorMessage = "Database error: Failed to save data. Please check for duplicate IDs or database connectivity.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Timeout error: Request took too long. Please try again or check the URL.";
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.message,
        url: req.body.url || "Unknown URL",
        targetTable: "sys_data_configg"
      });
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

  // Static file serving for captured images is already handled above

  return httpServer;
}