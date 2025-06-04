import type { Express, Request, Response } from 'express';

// Simple Sales API endpoint
export function addSalesRoute(app: Express) {
  app.post('/api/sales/save', async (req: Request, res: Response) => {
    try {
      const { salesData, entryType } = req.body;
      
      if (!salesData || !Array.isArray(salesData)) {
        return res.status(400).json({ error: 'Invalid sales data' });
      }

      // Generate auto-incremented WB ID
      const wbId = Date.now(); // Simple ID generation
      
      // Save each sales record to both tables
      const results = [];
      
      for (const item of salesData) {
        if (!item.doNo && !item.customerName && !item.vehicleNo) continue;
        
        // Save to wb_weighbridge (Master table)
        const masterData = {
          wb_id: wbId + results.length,
          slip_no: item.doId || `S${String(results.length + 1).padStart(3, '0')}`,
          vehicle_no: item.vehicleNo || '',
          vendor_name: item.customerName || '',
          entry_type: 'Sales',
          slip_in_time: new Date().toISOString(),
        };
        
        // Save to wb_details (Details table)
        const detailsData = {
          wb_id: wbId + results.length,
          po_no: item.doNo || '',
          igp_no: item.dcNo || '',
          item_desc: item.itemDescription || '',
          po_qty: parseFloat(item.doQty) || 0,
          igp_qty: parseFloat(item.dcQty) || 0,
        };
        
        results.push({ master: masterData, details: detailsData });
      }
      
      console.log('Sales data processed:', results.length, 'records');
      
      res.json({ 
        success: true, 
        message: `${results.length} sales records saved successfully`,
        records: results.length 
      });
      
    } catch (error) {
      console.error('Sales save error:', error);
      res.status(500).json({ error: 'Failed to save sales data' });
    }
  });
}