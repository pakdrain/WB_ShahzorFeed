import type { Express, Request, Response } from 'express';
import postgres from 'postgres';

const db = postgres(process.env.DATABASE_URL!);

export function registerPurchaseRoutes(app: Express) {
  // Generate next slip number for purchases
  app.get('/api/purchase/next-slip-number', async (req: Request, res: Response) => {
    try {
      const result = await db`
        SELECT COALESCE(MAX(CAST(slip_no AS INTEGER)), 0) + 1 as next_slip_no 
        FROM wb_weighbridge 
        WHERE entry_type = 'Purchase'
      `;
      const nextSlipNumber = result[0]?.next_slip_no || 1;
      res.json({ nextSlipNumber: nextSlipNumber.toString() });
    } catch (error) {
      console.error('Error generating next slip number:', error);
      res.status(500).json({ error: 'Failed to generate next slip number' });
    }
  });

  // Save purchase record
  app.post('/api/purchase/save', async (req: Request, res: Response) => {
    try {
      const masterData = req.body;
      
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
        wbId, masterData.slipNo, masterData.slipInTime, masterData.firstWeight,
        masterData.secondWeight, masterData.netWeight, masterData.bardanaWeight,
        masterData.grossWeight, masterData.freight, masterData.remarks,
        masterData.driverName, masterData.companyId, masterData.branchId,
        masterData.onlineEntry, masterData.offlineEntry, masterData.createdBy,
        masterData.creationDate, masterData.lastUpdatedBy, masterData.lastUpdatedDate,
        masterData.manualDcNo, 'Purchase', masterData.slipOutTime,
        masterData.status, masterData.slipDate
      ];

      const result = await db.unsafe(masterQuery, masterValues);
      
      res.json({ 
        success: true, 
        wbId: result[0].wb_id,
        message: 'Purchase saved successfully' 
      });
    } catch (error) {
      console.error('Error saving purchase:', error);
      res.status(500).json({ error: 'Failed to save purchase' });
    }
  });

  // Update purchase record
  app.put('/api/purchase/update/:wbId', async (req: Request, res: Response) => {
    try {
      const wbId = parseInt(req.params.wbId);
      const masterData = req.body;

      const updateQuery = `
        UPDATE wb_weighbridge SET
          slip_no = $2, slip_in_time = $3, first_weight = $4, second_weight = $5,
          net_weight = $6, bardana_weight = $7, gross_weight = $8, freight = $9,
          remarks = $10, driver_name = $11, company_id = $12, branch_id = $13,
          online_entry = $14, offline_entry = $15, last_updated_by = $16,
          last_updated_date = $17, manual_dc_no = $18, slip_out_time = $19,
          status = $20, slip_date = $21
        WHERE wb_id = $1
      `;

      const updateValues = [
        wbId, masterData.slipNo, masterData.slipInTime, masterData.firstWeight,
        masterData.secondWeight, masterData.netWeight, masterData.bardanaWeight,
        masterData.grossWeight, masterData.freight, masterData.remarks,
        masterData.driverName, masterData.companyId, masterData.branchId,
        masterData.onlineEntry, masterData.offlineEntry, masterData.lastUpdatedBy,
        masterData.lastUpdatedDate, masterData.manualDcNo, masterData.slipOutTime,
        masterData.status, masterData.slipDate
      ];

      await db.unsafe(updateQuery, updateValues);
      
      res.json({ 
        success: true, 
        message: 'Purchase updated successfully' 
      });
    } catch (error) {
      console.error('Error updating purchase:', error);
      res.status(500).json({ error: 'Failed to update purchase' });
    }
  });

  // Get purchase by wb_id
  app.get('/api/purchase/by-wbid/:wbId', async (req: Request, res: Response) => {
    try {
      const wbId = parseInt(req.params.wbId);
      
      const masterQuery = `
        SELECT w.*, b.branch_name 
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.wb_id = $1 AND w.entry_type = 'Purchase'
      `;
      
      const masterResult = await db.unsafe(masterQuery, [wbId]);
      
      if (masterResult.length === 0) {
        return res.status(404).json({ error: 'Purchase record not found' });
      }

      const detailsQuery = `
        SELECT * FROM wb_weighbridge_items_purchase 
        WHERE wb_id = $1
      `;
      
      const detailsResult = await db.unsafe(detailsQuery, [wbId]);
      
      res.json({
        master: masterResult[0],
        details: detailsResult
      });
    } catch (error) {
      console.error('Error fetching purchase:', error);
      res.status(500).json({ error: 'Failed to fetch purchase' });
    }
  });

  // Get purchase by slip number
  app.get('/api/purchase/by-slip/:slipNo', async (req: Request, res: Response) => {
    try {
      const slipNo = req.params.slipNo;
      
      const masterQuery = `
        SELECT w.*, b.branch_name 
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.slip_no = $1 AND w.entry_type = 'Purchase'
      `;
      
      const masterResult = await db.unsafe(masterQuery, [slipNo]);
      
      if (masterResult.length === 0) {
        return res.status(404).json({ error: 'Purchase record not found' });
      }

      const detailsQuery = `
        SELECT * FROM wb_weighbridge_items_purchase 
        WHERE wb_id = $1
      `;
      
      const detailsResult = await db.unsafe(detailsQuery, [masterResult[0].wb_id]);
      
      res.json({
        master: masterResult[0],
        details: detailsResult
      });
    } catch (error) {
      console.error('Error fetching purchase:', error);
      res.status(500).json({ error: 'Failed to fetch purchase' });
    }
  });

  // Get all purchases
  app.get('/api/purchases', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT ON (w.slip_no) w.wb_id, w.slip_no, w.slip_in_time, w.first_weight, 
               w.second_weight, w.net_weight, w.online_entry, w.offline_entry, 
               b.branch_name, w.entry_type
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.entry_type = 'Purchase'
        ORDER BY w.slip_no DESC, w.wb_id DESC
        LIMIT 50
      `;
      
      const result = await db.unsafe(query);
      console.log(`Fetched ${result.length} purchase records`);
      res.json(result);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      res.status(500).json({ error: 'Failed to fetch purchases' });
    }
  });

  // Get offline purchases
  app.get('/api/purchases/offline', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT ON (w.slip_no) w.wb_id, w.slip_no, w.slip_in_time, w.first_weight, 
               w.second_weight, w.net_weight, w.online_entry, w.offline_entry, 
               b.branch_name, w.entry_type
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.entry_type = 'Purchase' AND w.offline_entry = 'Yes'
        ORDER BY w.slip_no DESC, w.wb_id DESC
        LIMIT 50
      `;
      
      const result = await db.unsafe(query);
      console.log(`Fetched ${result.length} offline purchase records`);
      res.json(result);
    } catch (error) {
      console.error('Error fetching offline purchases:', error);
      res.status(500).json({ error: 'Failed to fetch offline purchases' });
    }
  });

  // Get first weight records for purchases
  app.get('/api/purchase/first-weight-records', async (req: Request, res: Response) => {
    try {
      const query = `
        SELECT DISTINCT ON (w.slip_no) w.wb_id, w.slip_no, w.slip_in_time, w.first_weight, 
               w.second_weight, w.net_weight, w.online_entry, w.offline_entry, 
               b.branch_name, w.entry_type
        FROM wb_weighbridge w
        LEFT JOIN branches b ON w.branch_id = b.branch_id
        WHERE w.entry_type = 'Purchase' AND w.first_weight IS NOT NULL
        ORDER BY w.slip_no DESC, w.wb_id DESC
        LIMIT 50
      `;
      
      const result = await db.unsafe(query);
      console.log(`Fetched ${result.length} first weight records`);
      res.json(result);
    } catch (error) {
      console.error('Error fetching first weight records:', error);
      res.status(500).json({ error: 'Failed to fetch first weight records' });
    }
  });

  // Convert offline to online purchase
  app.put('/api/purchase/convert-to-online/:wbId', async (req: Request, res: Response) => {
    try {
      const wbId = parseInt(req.params.wbId);
      
      const updateQuery = `
        UPDATE wb_weighbridge 
        SET online_entry = 'Yes', offline_entry = NULL, last_updated_date = NOW()
        WHERE wb_id = $1 AND entry_type = 'Purchase'
      `;
      
      await db.unsafe(updateQuery, [wbId]);
      
      res.json({ 
        success: true, 
        message: 'Purchase converted to online successfully' 
      });
    } catch (error) {
      console.error('Error converting purchase to online:', error);
      res.status(500).json({ error: 'Failed to convert purchase to online' });
    }
  });
}