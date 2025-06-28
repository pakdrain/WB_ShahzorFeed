
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

interface UserPermissions {
  userId: string;
  userName: string;
  permissions: string[];
}

export default function RoleManagement() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'assign' | 'list'>('assign');
  const [userId, setUserId] = useState('');
  const [editingUser, setEditingUser] = useState<UserPermissions | null>(null);
  const [savedUsers, setSavedUsers] = useState<UserPermissions[]>([]);
  const [permissions, setPermissions] = useState({
    home: false,
    purchaseForm: false,
    purchaseOnline: false,
    purchaseOffline: false,
    salesForm: false,
    salesOnline: false,
    salesOffline: false,
    saleReturn: false,
    saleNode: false,
    reports: false,
    imageUpload: false,
    cameraSettings: false,
    weighbridgeSettings: false,
  });

  // Check if current user is admin
  const isAdmin = user?.userName === 'admin' || user?.userid === 1;

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    // Load saved users from localStorage
    const stored = localStorage.getItem('userPermissions');
    if (stored) {
      try {
        setSavedUsers(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading saved users:', error);
      }
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: checked
    }));
  };

  const resetForm = () => {
    setUserId('');
    setEditingUser(null);
    setPermissions({
      home: false,
      purchaseForm: false,
      purchaseOnline: false,
      purchaseOffline: false,
      salesForm: false,
      salesOnline: false,
      salesOffline: false,
      saleReturn: false,
      saleNode: false,
      reports: false,
      imageUpload: false,
      cameraSettings: false,
      weighbridgeSettings: false,
    });
  };

  const handleSavePermissions = async () => {
    if (!userId.trim()) {
      alert('Please enter a User ID');
      return;
    }

    try {
      // Get username from database
      const response = await fetch(`/api/users/${userId}`);
      let userName = `User ${userId}`;
      
      if (response.ok) {
        const userData = await response.json();
        userName = userData.username || userName;
      }

      const selectedPermissions = Object.entries(permissions)
        .filter(([_, value]) => value)
        .map(([key, _]) => key);

      const userPermissions: UserPermissions = {
        userId,
        userName,
        permissions: selectedPermissions
      };

      // Update or add user
      const updatedUsers = savedUsers.filter(u => u.userId !== userId);
      updatedUsers.push(userPermissions);
      
      setSavedUsers(updatedUsers);
      localStorage.setItem('userPermissions', JSON.stringify(updatedUsers));

      // Save to database
      await fetch(`/api/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: selectedPermissions,
          role: 'Custom'
        }),
      });

      alert('Permissions saved successfully!');
      resetForm();
      setCurrentView('list');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Error saving permissions');
    }
  };

  const handleEditUser = (userPermissions: UserPermissions) => {
    setEditingUser(userPermissions);
    setUserId(userPermissions.userId);
    
    // Set checkboxes based on saved permissions
    const newPermissions = {
      home: false,
      purchaseForm: false,
      purchaseOnline: false,
      purchaseOffline: false,
      salesForm: false,
      salesOnline: false,
      salesOffline: false,
      saleReturn: false,
      saleNode: false,
      reports: false,
      imageUpload: false,
      cameraSettings: false,
      weighbridgeSettings: false,
    };

    userPermissions.permissions.forEach(permission => {
      if (permission in newPermissions) {
        newPermissions[permission as keyof typeof newPermissions] = true;
      }
    });

    setPermissions(newPermissions);
    setCurrentView('assign');
  };

  const permissionLabels = {
    home: 'Home',
    purchaseForm: 'Purchase Form',
    purchaseOnline: 'Purchase Online',
    purchaseOffline: 'Purchase Offline',
    salesForm: 'Sales Form',
    salesOnline: 'Sales Online',
    salesOffline: 'Sales Offline',
    saleReturn: 'Sale Return',
    saleNode: 'Sale Node',
    reports: 'Reports',
    imageUpload: 'Image Upload',
    cameraSettings: 'Camera Settings',
    weighbridgeSettings: 'Weighbridge Settings',
  };

  if (currentView === 'assign') {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {editingUser ? 'Edit User Permissions' : 'Assign User Permissions'}
          </h1>
          <Button variant="outline" onClick={() => {
            resetForm();
            setCurrentView('list');
          }}>
            Back to Role List
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>User Role Assignment</CardTitle>
            <CardDescription>
              {editingUser ? 'Edit permissions for the selected user' : 'Assign permissions to a user'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-3">
              <Label>Menu Permissions</Label>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={permissions[key as keyof typeof permissions]}
                      onCheckedChange={(checked) => handlePermissionChange(key, !!checked)}
                    />
                    <Label htmlFor={key} className="text-sm font-medium">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSavePermissions} className="w-full" disabled={!userId.trim()}>
              {editingUser ? 'Update Permissions' : 'Save Permissions'}
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
        <Button onClick={() => {
          resetForm();
          setCurrentView('assign');
        }}>
          Add New User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Permissions Management</CardTitle>
          <CardDescription>View and manage user permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {savedUsers.length > 0 ? (
              savedUsers.map((userPermissions) => (
                <div key={userPermissions.userId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">
                      {userPermissions.userName} (ID: {userPermissions.userId})
                    </h3>
                    <p className="text-sm text-gray-600">
                      Permissions: {userPermissions.permissions.length > 0 
                        ? userPermissions.permissions.map(p => permissionLabels[p as keyof typeof permissionLabels]).join(', ')
                        : 'No permissions assigned'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditUser(userPermissions)}
                  >
                    Edit
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No users found. Click "Add New User" to assign permissions.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
