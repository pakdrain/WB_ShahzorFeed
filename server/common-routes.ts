import type { Express, Request, Response } from 'express';
import postgres from 'postgres';

const db = postgres(process.env.DATABASE_URL!);

export function registerCommonRoutes(app: Express) {
  // Generate next WB ID
  app.get('/api/next-wb-id', async (req: Request, res: Response) => {
    try {
      const result = await db`
        SELECT COALESCE(MAX(wb_id), 0) + 1 as next_wb_id 
        FROM wb_weighbridge
      `;
      const nextWbId = result[0]?.next_wb_id || 1;
      res.json({ nextWbId });
    } catch (error) {
      console.error('Error generating next WB ID:', error);
      res.status(500).json({ error: 'Failed to generate next WB ID' });
    }
  });

  // Get branches
  app.get('/api/branches', async (req: Request, res: Response) => {
    try {
      const result = await db`
        SELECT branch_id, branch_name 
        FROM branches 
        ORDER BY branch_name
      `;
      res.json(result);
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  });

  // Get entry types
  app.get('/api/entry-types', async (req: Request, res: Response) => {
    try {
      const result = await db`
        SELECT DISTINCT entry_type 
        FROM wb_weighbridge 
        WHERE entry_type IS NOT NULL
        ORDER BY entry_type
      `;
      res.json(result);
    } catch (error) {
      console.error('Error fetching entry types:', error);
      res.status(500).json({ error: 'Failed to fetch entry types' });
    }
  });
}