import type { Express, Request, Response } from 'express';
import pkg from 'pg';
const { Pool } = pkg;

// Sales API endpoint to save detail data
export function addSalesRoute(app: Express) {
  app.post('/api/sales/save', async (req: Request, res: Response) => {
    try {
      const { salesData, entryType } = req.body;
      
      if (!salesData || !Array.isArray(salesData)) {
        return res.status(400).json({ error: 'Invalid sales data' });
      }

      // Create database connection
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });

      // Save each sales record to details table with your specified column mappings
      const results = [];
      
      for (const item of salesData) {
        if (!item.customerName && !item.vehicleNo && !item.itemDescription && !item.dcNo && !item.doNo) {
          continue; // Skip empty rows
        }
        
        // Generate auto-incremented DO ID as maximum number
        const maxDoIdResult = await pool.query(
          'SELECT COALESCE(MAX(do_id), 0) as max_do_id FROM wb_details WHERE do_id IS NOT NULL'
        );
        const maxDoId = maxDoIdResult.rows[0]?.max_do_id || 0;
        
        // Save to wb_details table with proper column mappings
        const insertQuery = `
          INSERT INTO wb_details (
            wb_id, do_id, customer_name, vehicle_no, do_date, 
            item_description, dc_qty, do_qty, branch, po_no, igp_no
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;
        
        const values = [
          item.wbId,
          maxDoId + 1, // Auto-generated maximum number
          item.customerName || null,
          item.vehicleNo || null,
          null, // As requested - null for now
          item.itemDescription || null,
          item.dcQty || null,
          item.doQty || null,
          item.branch || null,
          item.doNo || null,
          item.dcNo || null
        ];
        
        const insertResult = await pool.query(insertQuery, values);
        results.push(insertResult.rows[0]);
      }
      
      await pool.end();
      
      console.log('Sales detail data saved to database:', results.length, 'records');
      
      res.json({ 
        success: true, 
        message: `${results.length} sales detail records saved successfully to database`,
        records: results.length 
      });
      
    } catch (error) {
      console.error('Sales save error:', error);
      res.status(500).json({ error: 'Failed to save sales data' });
    }
  });
}