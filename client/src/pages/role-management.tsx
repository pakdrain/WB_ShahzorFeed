import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export default function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState('');
  const [roleName, setRoleName] = useState('');
  const [showForm, setShowForm] = useState(false);
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

  // Fetch existing roles from API
  const { data: existingRoles = [], refetch } = useQuery({
    queryKey: ['/api/user-roles'],
  });

  // Create role table if it doesn't exist
  useEffect(() => {
    fetch('/api/create-role-table', { method: 'POST' })
      .then(() => refetch())
      .catch(console.error);
  }, [refetch]);

  const roles = ['Admin', 'Office', 'HOD', 'Employee'];

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const handleSave = async () => {
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
        refetch();
      } else {
        alert('Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role');
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
                      onCheckedChange={(checked) => handlePermissionChange(key, checked as boolean)}
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
          <div className="space-y-3">
            {existingRoles.length > 0 ? (
              existingRoles
                .filter((role: any) => !selectedRole || role.role_name === selectedRole)
                .map((role: any) => (
                <div key={role.roleid} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{role.role_name}</h3>
                    <p className="text-sm text-gray-600">
                      Permissions: {Object.entries(role)
                        .filter(([key, value]) => key !== 'roleid' && key !== 'role_name' && value === 1)
                        .map(([key]) => key.replace(/_/g, ' '))
                        .join(', ')}
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
        </CardContent>
      </Card>
    </div>
  );
}