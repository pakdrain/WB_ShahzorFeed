.do_date,
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

  // Static file serving for captured images is already handled above

  return httpServer;
}