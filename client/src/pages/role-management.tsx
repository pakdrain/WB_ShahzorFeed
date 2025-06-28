
<old_str>
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState('');
  const [roleName, setRoleName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [existingRoles, setExistingRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState({
    homeMenu: false,
    purFormMenu: false,
    purFormOnline: false,
    purFormOffline: false,
    saleFormMenu: false,
    saleFormOnline: false,
    saleFormOffline: false,
    saleReturnMenu: false,
    saleNodeMenu: false,
    reports: false,
    cameraSettings: false,
    wbSettings: false,
  });

  const roles = ['Admin', 'Office', 'HOD', 'Employee'];

  // Fetch existing roles
  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First ensure table exists
      await fetch('/api/create-role-table', { method: 'POST' });
      
      // Then fetch roles
      const response = await fetch('/api/user-roles');
      if (response.ok) {
        const data = await response.json();
        setExistingRoles(data);
      } else {
        throw new Error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(error.message);
      setExistingRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handlePermissionChange = (permission, checked) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      alert('Please enter a role name');
      return;
    }

    try {
      const response = await fetch('/api/save-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleName,
          permissions
        }),
      });

      if (response.ok) {
        alert('Role saved successfully!');
        setRoleName('');
        setPermissions({
          homeMenu: false,
          purFormMenu: false,
          purFormOnline: false,
          purFormOffline: false,
          saleFormMenu: false,
          saleFormOnline: false,
          saleFormOffline: false,
          saleReturnMenu: false,
          saleNodeMenu: false,
          reports: false,
          cameraSettings: false,
          wbSettings: false,
        });
        setShowForm(false);
        fetchRoles();
      } else {
        throw new Error('Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role: ' + error.message);
    }
  };

  const openNewRoleForm = () => {
    setShowForm(true);
    setRoleName('');
    setSelectedRole('');
    setPermissions({
      homeMenu: false,
      purFormMenu: false,
      purFormOnline: false,
      purFormOffline: false,
      saleFormMenu: false,
      saleFormOnline: false,
      saleFormOffline: false,
      saleReturnMenu: false,
      saleNodeMenu: false,
      reports: false,
      cameraSettings: false,
      wbSettings: false,
    });
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">New Role Assignment</h1>
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Back to Roles List
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Assign Role</CardTitle>
            <CardDescription>Create a new role and assign permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => handlePermissionChange(key, checked)}
                    />
                    <Label htmlFor={key} className="text-sm">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={!roleName.trim()}>
              Save Role
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Roles List</h1>
        <div className="flex gap-2">
          <Button onClick={openNewRoleForm}>
            + New Role
          </Button>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>View and manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading roles...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading roles: {error}</p>
              <Button onClick={fetchRoles} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {existingRoles.length > 0 ? (
                existingRoles
                  .filter((role) => !selectedRole || role.role_name === selectedRole)
                  .map((role) => (
                  <div key={role.roleid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{role.role_name}</h3>
                      <p className="text-sm text-gray-600">
                        Permissions: {Object.entries(role)
                          .filter(([key, value]) => key !== 'roleid' && key !== 'role_name' && value === 1)
                          .map(([key]) => key.replace(/_/g, ' '))
                          .join(', ') || 'No permissions assigned'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No roles found. Click "New Role" to create one.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
</old_str>
<new_str>
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoleManagement() {
  const [currentView, setCurrentView] = useState('permissions'); // 'permissions' or 'roleList'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  
  const [permissions, setPermissions] = useState({
    home: false,
    purchase_form: false,
    purchase_online: false,
    purchase_offline: false,
    sales_form: false,
    sales_online: false,
    sales_offline: false,
    sale_return: false,
    sale_node: false,
    reports: false,
    camera_settings: false,
    weighbridge_settings: false,
  });

  const permissionLabels = {
    home: 'Home',
    purchase_form: 'Purchase Form',
    purchase_online: 'Purchase Online',
    purchase_offline: 'Purchase Offline',
    sales_form: 'Sales Form',
    sales_online: 'Sales Online',
    sales_offline: 'Sales Offline',
    sale_return: 'Sales Return',
    sale_node: 'Sales Node',
    reports: 'Reports',
    camera_settings: 'Camera Settings',
    weighbridge_settings: 'Weighbridge Settings',
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch assigned users (users with permissions)
  const fetchAssignedUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users-with-permissions');
      if (response.ok) {
        const data = await response.json();
        setAssignedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching assigned users:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (currentView === 'roleList') {
      fetchAssignedUsers();
    }
  }, [currentView]);

  const handlePermissionChange = (permission, checked) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    try {
      const selectedPermissions = Object.entries(permissions)
        .filter(([key, value]) => value)
        .map(([key]) => key);

      const response = await fetch(`/api/users/${selectedUserId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: selectedPermissions,
          role: 'Custom'
        }),
      });

      if (response.ok) {
        alert('Permissions saved successfully!');
        setCurrentView('roleList');
        setSelectedUserId('');
        setPermissions({
          home: false,
          purchase_form: false,
          purchase_online: false,
          purchase_offline: false,
          sales_form: false,
          sales_online: false,
          sales_offline: false,
          sale_return: false,
          sale_node: false,
          reports: false,
          camera_settings: false,
          weighbridge_settings: false,
        });
      } else {
        throw new Error('Failed to save permissions');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error saving permissions: ' + error.message);
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        
        // Reset permissions first
        const resetPermissions = {
          home: false,
          purchase_form: false,
          purchase_online: false,
          purchase_offline: false,
          sales_form: false,
          sales_online: false,
          sales_offline: false,
          sale_return: false,
          sale_node: false,
          reports: false,
          camera_settings: false,
          weighbridge_settings: false,
        };

        // Set permissions based on user's current permissions
        data.permissions.forEach(permission => {
          if (resetPermissions.hasOwnProperty(permission)) {
            resetPermissions[permission] = true;
          }
        });

        setPermissions(resetPermissions);
        setSelectedUserId(userId);
        setEditingUserId(userId);
        setCurrentView('permissions');
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      alert('Error loading user permissions');
    }
  };

  const handleBackToRoleList = () => {
    setCurrentView('roleList');
    setEditingUserId(null);
    setSelectedUserId('');
    setPermissions({
      home: false,
      purchase_form: false,
      purchase_online: false,
      purchase_offline: false,
      sales_form: false,
      sales_online: false,
      sales_offline: false,
      sale_return: false,
      sale_node: false,
      reports: false,
      camera_settings: false,
      weighbridge_settings: false,
    });
  };

  if (currentView === 'permissions') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {editingUserId ? 'Edit User Permissions' : 'Assign User Permissions'}
          </h1>
          <Button variant="outline" onClick={handleBackToRoleList}>
            Back to Role List
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>User Permission Assignment</CardTitle>
            <CardDescription>Select a user and assign form access permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-select">Select User (by ID)</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={!!editingUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.userid} value={user.userid.toString()}>
                      ID: {user.userid} - {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Form Access Permissions</Label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => handlePermissionChange(key, checked)}
                    />
                    <Label htmlFor={key} className="text-sm">
                      {permissionLabels[key]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSavePermissions} 
              className="w-full" 
              disabled={!selectedUserId}
            >
              Save Permissions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Role List</h1>
        <Button onClick={() => setCurrentView('permissions')}>
          Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users with Assigned Roles</CardTitle>
          <CardDescription>View and manage user permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading users: {error}</p>
              <Button onClick={fetchAssignedUsers} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedUsers.length > 0 ? (
                assignedUsers.map((user) => (
                  <div key={user.userid} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{user.userName}</h3>
                      <p className="text-sm text-gray-600">
                        User ID: {user.userid} | Branch: {user.branchName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Role: {user.role || 'Custom'} | Permissions: {user.permissions.length > 0 ? user.permissions.join(', ') : 'None'}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditUser(user.userid)}
                    >
                      Edit
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No users with assigned roles found. Click "Add New User" to assign permissions.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
</new_str>
