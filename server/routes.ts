ermissions = [];
      let role = '';

      if (permissionsResult.rows.length > 0) {
        const roleData = permissionsResult.rows[0];
        role = roleData.role_name || '';

        // Build permissions array based on role table columns
        if (roleData.home_menu === 1) permissions.push('home');
        if (roleData.pur_form_menu === 1) permissions.push('purchase_form');
        if (roleData.pur_form_online === 1) permissions.push('purchase_online');
        if (roleData.pur_form_offline === 1) permissions.push('purchase_offline');
        if (roleData.sale_form_menu === 1) permissions.push('sales_form');
        if (roleData.sale_form_online === 1) permissions.push('sales_online');
        if (roleData.sale_form_offline === 1) permissions.push('sales_offline');
        if (roleData.sale_return_menu === 1) permissions.push('sale_return');
        if (roleData.sale_node_menu === 1) permissions.push('sale_node');
        if (roleData.reports === 1) permissions.push('reports');
        if (roleData.camera_settings === 1) permissions.push('camera_settings');
        if (roleData.wb_settings === 1) permissions.push('weighbridge_settings');
      }

      res.json({
        userInfo: {
          userName: userResult.rows[0].username,
          branchName: userResult.rows[0].branch_name
        },
        permissions: permissions,
        role: role
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get user info by ID
  app.get('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const result = await pool.query('SELECT username FROM users WHERE userid = $1', [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ username: result.rows[0].username });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update user permissions
  app.put('/api/users/:userId/permissions', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { permissions, role } = req.body;

      // Check if user exists
      const userResult = await pool.query('SELECT userid FROM users WHERE userid = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Convert permissions array to integer flags
      const permissionFlags = {
        home_menu: permissions.includes('home') ? 1 : 0,
        pur_form_menu: permissions.includes('purchase_form') ? 1 : 0,
        pur_form_online: permissions.includes('purchase_online') ? 1 : 0,
        pur_form_offline: permissions.includes('purchase_offline') ? 1 : 0,
        sale_form_menu: permissions.includes('sales_form') ? 1 : 0,
        sale_form_online: permissions.includes('sales_online') ? 1 : 0,
        sale_form_offline: permissions.includes('sales_offline') ? 1 : 0,
        sale_return_menu: permissions.includes('sale_return') ? 1 : 0,
        sale_node_menu: permissions.includes('sale_node') ? 1 : 0,
        reports: permissions.includes('reports') ? 1 : 0,
        camera_settings: permissions.includes('camera_settings') ? 1 : 0,
        wb_settings: permissions.includes('weighbridge_settings') ? 1 : 0
      };

      // Insert or update role permissions
      await pool.query(`
        INSERT INTO role (
          roleid, role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline,
          sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, 
          sale_node_menu, reports, camera_settings, wb_settings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (roleid)
        DO UPDATE SET 
          role_name = EXCLUDED.role_name,
          home_menu = EXCLUDED.home_menu,
          pur_form_menu = EXCLUDED.pur_form_menu,
          pur_form_online = EXCLUDED.pur_form_online,
          pur_form_offline = EXCLUDED.pur_form_offline,
          sale_form_menu = EXCLUDED.sale_form_menu,
          sale_form_online = EXCLUDED.sale_form_online,
          sale_form_offline = EXCLUDED.sale_form_offline,
          sale_return_menu = EXCLUDED.sale_return_menu,
          sale_node_menu = EXCLUDED.sale_node_menu,
          reports = EXCLUDED.reports,
          camera_settings = EXCLUDED.camera_settings,
          wb_settings = EXCLUDED.wb_settings
      `, [
        userId, role,
        permissionFlags.home_menu,
        permissionFlags.pur_form_menu,
        permissionFlags.pur_form_online,
        permissionFlags.pur_form_offline,
        permissionFlags.sale_form_menu,
        permissionFlags.sale_form_online,
        permissionFlags.sale_form_offline,
        permissionFlags.sale_return_menu,
        permissionFlags.sale_node_menu,
        permissionFlags.reports,
        permissionFlags.camera_settings,
        permissionFlags.wb_settings
      ]);

      res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
      console.error('Error updating user permissions:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create role table if it doesn't exist
app.post('/api/create-role-table', async (req: Request, res: Response) => {
  try {
    // Check if table exists first
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role'
      )
    `);

    if (!tableExists.rows[0].exists) {
      await pool.query(`
        CREATE TABLE role (
          roleid SERIAL PRIMARY KEY,
          role_name VARCHAR(100),
          home_menu INTEGER DEFAULT 0,
          pur_form_menu INTEGER DEFAULT 0,
          pur_form_online INTEGER DEFAULT 0,
          pur_form_offline INTEGER DEFAULT 0,
          sale_form_menu INTEGER DEFAULT 0,
          sale_form_online INTEGER DEFAULT 0,
          sale_form_offline INTEGER DEFAULT 0,
          sale_return_menu INTEGER DEFAULT 0,
          sale_node_menu INTEGER DEFAULT 0,
          reports INTEGER DEFAULT 0,
          camera_settings INTEGER DEFAULT 0,
          wb_settings INTEGER DEFAULT 0
        )
      `);

      // Insert default roles
      await pool.query(`
        INSERT INTO role (role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline, sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, sale_node_menu, reports, camera_settings, wb_settings)
        VALUES 
        ('Admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
        ('Office', 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0),
        ('HOD', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0),
        ('Employee', 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0)
      `);
    } else {
      // Table exists, check if it has data
      const existingRoles = await pool.query('SELECT COUNT(*) FROM role');
      if (parseInt(existingRoles.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO role (role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline, sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, sale_node_menu, reports, camera_settings, wb_settings)
          VALUES 
          ('Admin', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
          ('Office', 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0),
          ('HOD', 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0),
          ('Employee', 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0)
        `);
      }
    }

    res.json({ success: true, message: 'Role table ready' });
  } catch (error) {
    console.error('Error with role table:', error);
    res.status(500).json({ message: 'Failed to setup role table' });
  }
});

// Role management endpoint
app.get('/api/user-roles', async (req: Request, res: Response) => {
  try {
    // Check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role'
      )
    `);

    if (!tableExists.rows[0].exists) {
      // Return empty array if table doesn't exist
      return res.json([]);
    }

    const result = await pool.query('SELECT * FROM role ORDER BY roleid');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Save role assignment endpoint
app.post('/api/save-role', async (req: Request, res: Response) => {
  try {
    const { roleName, permissions } = req.body;

    const query = `
      INSERT INTO role (role_name, home_menu, pur_form_menu, pur_form_online, pur_form_offline, sale_form_menu, sale_form_online, sale_form_offline, sale_return_menu, sale_node_menu, reports, camera_settings, wb_settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING roleid
    `;

    const values = [
      roleName,
      permissions.homeMenu ? 1 : 0,
      permissions.purFormMenu ? 1 : 0,
      permissions.purFormOnline ? 1 : 0,
      permissions.purFormOffline ? 1 : 0,
      permissions.saleFormMenu ? 1 : 0,
      permissions.saleFormOnline ? 1 : 0,
      permissions.saleFormOffline ? 1 : 0,
      permissions.saleReturnMenu ? 1 : 0,
      permissions.saleNodeMenu ? 1 : 0,
      permissions.reports ? 1 : 0,
      permissions.cameraSettings ? 1 : 0,
      permissions.wbSettings ? 1 : 0
    ];

    const result = await pool.query(query, values);
    res.json({ success: true, roleId: result.rows[0].roleid });
  } catch (error) {
    console.error('Error saving role:', error);
    res.status(500).json({ message: 'Failed to save role' });
  }
});

  // Static file serving for captured images is already handled above

  return httpServer;
}