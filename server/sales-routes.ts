import type { Express, Request, Response } from 'express';
import postgres from 'postgres';

const db = postgres(process.env.DATABASE_URL!);

export function registerSalesRoutes(app: Express) {
  // Generate next slip number for sales
  app.get('/api/sales/next-slip-number', async (req: Request, res: Response) => {
    try {
      const result = await db`
        SELECT COALESCE(MAX(CAST(slip_no AS INTEGER)), 0) + 1 as next_slip_no 
        FROM wb_weighbridge 
        WHERE entry_type = 'Sale'
      `;
      const nextSlipNumber = result[0]?.next_slip_no || 1;
      res.json({ nextSlipNumber: nextSlipNumber.toString() });
    } catch (error) {
      console.error('Error generating next slip number:', error);
      res.status(500).json({ error: 'Failed to generate next slip number' });
    }
  });

  // Save sale record
  app.post('/api/sales/save', async (req: Request, res: Response) => {
    try {
      const { master, details } = req.body;
      
      // Generate WB ID
      const wbIdResult = await db`
        SELECT COALESCE(MAX(wb_id), 0) + 1 as next_wb_id FROM wb_weighbridge
      `;
      const wbId = wbIdResult[0].next_wb_id;

      // Insert master record
      const masterQuery = `
        INSERT INTO wb_weighbridge (
          wb_id, slip_no, slip_in_time, first_weight, second_weight, net_weight,
          bardana_weight, gross_weight, freight, remarks, driver_name, company_id,
          branch_id, online_entry, offline_entry, created_by, creation_date,
          last_updated_by, last_updated_date, manual_dc_no, entry_type,
          slip_out_time, status, slip_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) RETURNING wb_id
      `;

      const masterValues = [
        wbId, master.slipNo, master.slipInTime, master.firstWeight,
        master.secondWeight, master.netWeight, master.bardanaWeight,
        master.grossWeight, master.freight, master.remarks,
        master.driverName, master.companyId, master.branchId,
        master.onlineEntry, master.offlineEntry, master.createdBy,
        master.creationDate, master.lastUpdatedBy, master.lastUpdatedDate,
        master.manualDcNo, 'Sale', master.slipOutTime,
        master.status, master.slipDate
      ];

      const masterResult = await db.unsafe(masterQuery, masterValues);
      const savedWbId = masterResult[0].wb_id;

      // Insert sale details if provided
      if (details && Object.keys(details).length > 0) {
        const detailsQuery = `
          INSERT INTO wb_weighbridge_sales_details (
            wb_id, customer_name, customer_address, delivery_address, 
            order_no, item_code, item_description, quantity, rate, amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const detailsValues = [
          savedWbId, details.customerName, details.customerAddress,
          details.deliveryAddress, details.orderNo, details.itemCode,
          details.itemDescription, details.quantity, details.rate, details.amount
        ];

        await db.query(detailsQuery, detailsValues);
      }
      
      res.json({ 
        success: true, 
        wbId: savedWbId,
        message: 'Sale saved successfully' 
      });
    } catch (error) {
      console.error('Error saving sale:', error);
      res.status(500).json({ error: 'Failed to save sale' });
    }
  });

  // Update sale record
  app.put('/api/sales/update/:wbId', async (req: Request, res: Response) => {
    try {
      const wbId = parseInt(req.params.wbId);
      const { master, details } = req.body;

      // Update master record
      const updateMasterQuery = `
        UPDATE wb_weighbridge SET
          slip_no = $2, slip_in_time = $3, first_weight = $4, second_weight = $5,
          net_weight = $6, bardana_weight = $7, gross_weight = $8, freight = $9,
          remarks = $10, driver_name = $11, company_id = $12, branch_id = $13,
          online_entry = $14, offline_entry = $15, last_updated_by = $16,
          last_updated_date = $17, manual_dc_no = $18, slip_out_time = $19,
          status = $20, slip_date = $21
        WHERE wb_id = $1 AND entry_type = 'Sale'
      `;

      const masterValues = [
        wbId, master.slipNo, master.slipInTime, master.firstWeight,
        master.secondWeight, master.netWeight, master.bardanaWeight,
        master.grossWeight, master.freight, master.remarks,
        master.driverName, master.companyId, master.branchId,
        master.onlineEntry, master.offlineEntry, master.lastUpdatedBy,
        master.lastUpdatedDate, master.manualDcNo, master.slipOutTime,
        master.status, master.slipDate
      ];

      await db.unsafe(updateMasterQuery, masterValues);

      // Update sale details if provided
      if (details && Object.keys(details).length > 0) {
        // First, delete existing details
        await db.unsafe('DELETE FROM wb_weighbridge_sales_details WHERE wb_id = $1', [wbId]);
        
        // Insert new details
        const detailsQuery = `
          INSERT INTO wb_weighbridge_sales_details (
            wb_id, customer_name, customer_address, delivery_address, 
            order_no, item_code, item_description, quantity, rate, amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;

        const detailsValues = [
          wbId, details.customerName, details.customerAddress,
          details.deliveryAddress, details.orderNo, details.itemCode,
          details.itemDescription, details.quantity, details.rate, details.amount
        ];

        await db.query(detailsQuery, detailsValues);
      }
      
      res.json({ 
        success: true, 
        message: 'Sale updated successfully' 
      });
    } catch (error) {
      console.error('Error updating sale:', error);
      res.status(500).json({ error: 'Failed to update sale' });
    }
  });

  // Get sale by wb_id
  app.get('/api/sales/by-wbid/:wbId', async (req: Request, res: Response) => {
    try {
      const wbId = parseInt(req.params.wbId);
      
      const masterQuery = `
        SELECT w.*, b.branch_name 
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.wb_id = $1 AND w.entry_type = 'Sale'
      `;
      
      const masterResult = await db.unsafe(masterQuery, [wbId]);
      
      if (masterResult.length === 0) {
        return res.status(404).json({ error: 'Sale record not found' });
      }

      const detailsQuery = `
        SELECT * FROM wb_weighbridge_sales_details 
        WHERE wb_id = $1
      `;
      
      const detailsResult = await db.unsafe(detailsQuery, [wbId]);
      
      res.json({
        master: masterResult[0],
        details: detailsResult[0] || {}
      });
    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({ error: 'Failed to fetch sale' });
    }
  });

  // Get sale by slip number
  app.get('/api/sales/by-slip/:slipNo', async (req: Request, res: Response) => {
    try {
      const slipNo = req.params.slipNo;
      
      const masterQuery = `
        SELECT w.*, b.branch_name 
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.slip_no = $1 AND w.entry_type = 'Sale'
      `;
      
      const masterResult = await db.query(masterQuery, [slipNo]);
      
      if (masterResult.rows.length === 0) {
        return res.status(404).json({ error: 'Sale record not found' });
      }

      const detailsQuery = `
        SELECT * FROM wb_weighbridge_sales_details 
        WHERE wb_id = $1
      `;
      
      const detailsResult = await db.query(detailsQuery, [masterResult.rows[0].wb_id]);
      
      res.json({
        master: masterResult.rows[0],
        details: detailsResult.rows[0] || {}
      });
    } catch (error) {
      console.error('Error fetching sale:', error);
      res.status(500).json({ error: 'Failed to fetch sale' });
    }
  });

  // Get all sales
  app.get('/api/sales', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT ON (w.slip_no) w.wb_id, w.slip_no, w.slip_in_time, w.first_weight, 
               w.second_weight, w.net_weight, w.online_entry, w.offline_entry, 
               b.branch_name, w.entry_type
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.entry_type = 'Sale'
        ORDER BY w.slip_no DESC, w.wb_id DESC
        LIMIT 50
      `;
      
      const result = await db.unsafe(query);
      console.log(`Fetched ${result.length} sale records`);
      res.json(result);
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ error: 'Failed to fetch sales' });
    }
  });

  // Get offline sales
  app.get('/api/sales/offline', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT ON (w.slip_no) w.wb_id, w.slip_no, w.slip_in_time, w.first_weight, 
               w.second_weight, w.net_weight, w.online_entry, w.offline_entry, 
               b.branch_name, w.entry_type
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.entry_type = 'Sale' AND w.offline_entry = 'Yes'
        ORDER BY w.slip_no DESC, w.wb_id DESC
        LIMIT 50
      `;
      
      const result = await db.query(query);
      console.log(`Fetched ${result.rows.length} offline sale records`);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching offline sales:', error);
      res.status(500).json({ error: 'Failed to fetch offline sales' });
    }
  });

  // Convert offline to online sale
  app.put('/api/sales/convert-to-online/:wbId', async (req: Request, res: Response) => {
    try {
      const wbId = parseInt(req.params.wbId);
      
      const updateQuery = `
        UPDATE wb_weighbridge 
        SET online_entry = 'Yes', offline_entry = NULL, last_updated_date = NOW()
        WHERE wb_id = $1 AND entry_type = 'Sale'
      `;
      
      await db.unsafe(updateQuery, [wbId]);
      
      res.json({ 
        success: true, 
        message: 'Sale converted to online successfully' 
      });
    } catch (error) {
      console.error('Error converting sale to online:', error);
      res.status(500).json({ error: 'Failed to convert sale to online' });
    }
  });
}