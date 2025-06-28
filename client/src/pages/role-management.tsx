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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {editingUser ? 'Edit User Permissions' : 'Assign User Permissions'}
              </h1>
              <p className="text-gray-600">
                {editingUser ? 'Modify existing user access rights' : 'Grant access permissions to users'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white hover:bg-gray-50 border-2 border-gray-300 font-semibold text-gray-700 px-6 py-3"
              onClick={() => {
                resetForm();
                setCurrentView('list');
              }}
            >
              ← Back to Role List
            </Button>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold">User Role Assignment</CardTitle>
              <CardDescription className="text-blue-100">
                {editingUser ? 'Edit permissions for the selected user' : 'Assign permissions to a user'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <Label htmlFor="user-id" className="text-lg font-semibold text-gray-700 mb-3 block">
                  User ID
                </Label>
                <Input
                  id="user-id"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter User ID"
                  disabled={!!editingUser}
                  className="text-lg p-4 border-2 focus:border-blue-500 rounded-lg"
                />
              </div>

              <div className="space-y-6">
                <div className="border-b pb-4">
                  <Label className="text-xl font-bold text-gray-800">Menu Permissions</Label>
                  <p className="text-gray-600 mt-2">Select which menu items this user can access</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="bg-white p-4 rounded-lg border-2 hover:border-blue-300 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={key}
                          checked={permissions[key as keyof typeof permissions]}
                          onCheckedChange={(checked) => handlePermissionChange(key, !!checked)}
                          className="w-5 h-5"
                        />
                        <Label htmlFor={key} className="text-base font-medium text-gray-700 cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button 
                  onClick={handleSavePermissions} 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg py-4 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200" 
                  disabled={!userId.trim()}
                  size="lg"
                >
                  {editingUser ? '✓ UPDATE PERMISSIONS' : '✓ SAVE PERMISSIONS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Role Management</h1>
            <p className="text-gray-600">Manage user permissions and access rights</p>
          </div>
          <Button 
            onClick={() => {
              resetForm();
              setCurrentView('assign');
            }}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            size="lg"
          >
            + ADD NEW USER
          </Button>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">User Permissions Management</CardTitle>
            <CardDescription className="text-blue-100">
              View and manage user permissions across the system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4">
              {savedUsers.length > 0 ? (
                savedUsers.map((userPermissions) => (
                  <div key={userPermissions.userId} className="bg-white p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {userPermissions.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">
                              {userPermissions.userName}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {userPermissions.userId}</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Assigned Permissions:</p>
                          <div className="flex flex-wrap gap-2">
                            {userPermissions.permissions.length > 0 ? (
                              userPermissions.permissions.map(p => (
                                <span key={p} className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                                  {permissionLabels[p as keyof typeof permissionLabels]}
                                </span>
                              ))
                            ) : (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">
                                No permissions assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="lg"
                        className="bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-600 font-bold px-6 py-3 ml-6"
                        onClick={() => handleEditUser(userPermissions)}
                      >
                        ✏️ EDIT
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-gray-400">👥</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Users Found</h3>
                  <p className="text-gray-500 mb-6">Get started by adding your first user with permissions</p>
                  <Button 
                    onClick={() => {
                      resetForm();
                      setCurrentView('assign');
                    }}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-3 rounded-lg"
                  >
                    + Add First User
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}