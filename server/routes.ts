("Error fetching slip data:", error);
      res.status(500).json({ error: "Failed to fetch slip data" });
    }
  });

  // GET specific slip data by slip number
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

  // Get freight items for freight voucher details section
  app.get("/api/freight-vouchers/:freightId/items", async (req: Request, res: Response) => {
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

      console.log(`Fetched ${result.rows.length} freight items for freight ID: ${freightId}`);
      console.log("Sample freight item:", result.rows[0]);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching freight items:", error);
      res.status(500).json({ error: "Failed to fetch freight items" });
    }
  });

  // Fetch and save data from URL to inv_items table
  app.post("/api/fetch-and-save", async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Fetch data from the provided URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Expected array data from URL" });
      }

      // Save each item to inv_items table
      let savedCount = 0;
      for (const item of data) {
        try {
          const insertQuery = `
            INSERT INTO inv_items (
              item_id, item_code, item_desc, uom, weight_in_kg, gl_asset_id, 
              payable_acc_id, gl_cogs_acc_id, gl_sale_acc_id, 
              gl_sale_return_acc_id, gl_purchase_acc_id, delivery_term
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (item_code) DO UPDATE SET
              item_id = EXCLUDED.item_id,
              item_desc = EXCLUDED.item_desc,
              uom = EXCLUDED.uom,
              weight_in_kg = EXCLUDED.weight_in_kg,
              gl_asset_id = EXCLUDED.gl_asset_id,
              payable_acc_id = EXCLUDED.payable_acc_id,
              gl_cogs_acc_id = EXCLUDED.gl_cogs_acc_id,
              gl_sale_acc_id = EXCLUDED.gl_sale_acc_id,
              gl_sale_return_acc_id = EXCLUDED.gl_sale_return_acc_id,
              gl_purchase_acc_id = EXCLUDED.gl_purchase_acc_id,
              delivery_term = EXCLUDED.delivery_term
          `;

          const values = [
            item.item_id || null,  // Include item_id from API response
            item.item_code || null,
            item.item_desc || null,
            item.uom || null,
            item.weight_in_kg || null,
            item.gl_asset_id || null,
            item.payable_acc_id || null,
            item.gl_cogs_acc_id || null,
            item.gl_sale_acc_id || null,
            item.gl_sale_return_acc_id || null,
            item.gl_purchase_acc_id || null,
            item.delivery_term || null,
          ];

          const result = await pool.query(insertQuery, values);
          if (result.rowCount && result.rowCount > 0) {
            savedCount++;
          }
        } catch (itemError: any) {
          console.error(`Error saving item ${item.item_code}:`, itemError);
        }
      }

      res.json({
        success: true,
        message: `Successfully fetched and saved ${savedCount} records to inv_items table`,
        totalFetched: data.length,
        savedCount,
      });
    } catch (error: any) {
      console.error("Error fetching and saving data:", error);
      res.status(500).json({ error: "Failed to fetch and save data" });
    }
  });

  // Static file serving for captured images is already handled above

  return httpServer;
}