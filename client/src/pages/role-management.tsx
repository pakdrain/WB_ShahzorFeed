
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shield, CheckCircle, AlertTriangle, Plus, Edit, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface UserRole {
  userId: number;
  userName: string;
  branchName: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

interface UserPermission {
  userId: number;
  permissions: string[];
}

const availablePermissions: Permission[] = [
  { id: 'home', name: 'Home', description: 'Access to home dashboard' },
  { id: 'purchase_form', name: 'Purchase Form Menu', description: 'Access to purchase form section' },
  { id: 'purchase_online', name: 'Purchase Online', description: 'Create online purchase entries' },
  { id: 'purchase_offline', name: 'Purchase Offline', description: 'Create offline purchase entries' },
  { id: 'sales_form', name: 'Sales Form', description: 'Access to sales form section' },
  { id: 'sales_online', name: 'Sales Online', description: 'Create online sales entries' },
  { id: 'sales_offline', name: 'Sales Offline', description: 'Create offline sales entries' },
  { id: 'sale_return', name: 'Sale Return', description: 'Process sale returns' },
  { id: 'sale_node', name: 'Sale Node', description: 'Access sale node management' },
  { id: 'reports', name: 'Reports', description: 'View and generate reports' },
  { id: 'image_upload', name: 'Image Upload', description: 'Upload and manage images' },
  { id: 'camera_settings', name: 'Camera Settings', description: 'Configure camera settings' },
  { id: 'weighbridge_settings', name: 'Weighbridge Settings', description: 'Configure weighbridge settings' },
];

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'office', label: 'Office' },
  { value: 'hod', label: 'HOD' },
  { value: 'employee', label: 'Employee' },
  { value: 'operator', label: 'Operator' },
  { value: 'manager', label: 'Manager' },
];

export default function RoleManagement() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ userName: string; branchName: string } | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  // Check if current user is admin
  const isAdmin = user?.userName === 'admin' || user?.userid === 1;

  useEffect(() => {
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
    } else {
      fetchUserRoles();
    }
  }, [isAdmin]);

  const fetchUserRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user-roles');
      if (response.ok) {
        const data = await response.json();
        setUserRoles(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to fetch user roles' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching user roles' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    if (!userId || !userId.trim()) {
      setSelectedPermissions([]);
      setUserInfo(null);
      setMessage(null);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPermissions(data.permissions || []);
        setUserInfo(data.userInfo || null);
        setSelectedRole(data.role || '');
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'User not found' });
        setSelectedPermissions([]);
        setUserInfo(null);
        setSelectedRole('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching user permissions' });
      setSelectedPermissions([]);
      setUserInfo(null);
      setSelectedRole('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserIdChange = (value: string) => {
    setTargetUserId(value);
    if (value && /^\d+$/.test(value)) {
      fetchUserPermissions(value);
    } else {
      setSelectedPermissions([]);
      setUserInfo(null);
      setSelectedRole('');
      setMessage(null);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setSelectedPermissions(prev => {
      if (checked) {
        return [...prev, permissionId];
      } else {
        return prev.filter(id => id !== permissionId);
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedPermissions(availablePermissions.map(p => p.id));
  };

  const handleClearAll = () => {
    setSelectedPermissions([]);
  };

  const handleSavePermissions = async () => {
    if (!targetUserId || !userInfo || !selectedRole) {
      setMessage({ type: 'error', text: 'Please select a valid user and role first' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUserId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: selectedPermissions,
          role: selectedRole,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions updated successfully' });
        // Redirect back to list view after successful save
        setTimeout(() => {
          setCurrentView('list');
          fetchUserRoles();
          resetForm();
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to update permissions' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving permissions' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTargetUserId('');
    setSelectedRole('');
    setSelectedPermissions([]);
    setUserInfo(null);
    setMessage(null);
    setEditingUserId(null);
  };

  const handleNewRole = () => {
    resetForm();
    setCurrentView('create');
  };

  const handleEditRole = async (userId: number) => {
    setEditingUserId(userId);
    setTargetUserId(userId.toString());
    await fetchUserPermissions(userId.toString());
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    resetForm();
    setCurrentView('list');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-monitoring-dark p-6">
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-red-900/50 border-red-700">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Access denied. You do not have administrator privileges to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Roles List View
  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-monitoring-dark p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-monitoring-blue p-3 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Roles List</h1>
                <p className="text-gray-400">Manage user roles and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select defaultValue="">
                <SelectTrigger className="w-48 bg-monitoring-gray border-monitoring-gray text-white">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="bg-monitoring-gray border-monitoring-gray">
                  <SelectItem value="">All Roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value} className="text-white">
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleNewRole}
                className="bg-monitoring-blue hover:bg-monitoring-blue/90 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Role
              </Button>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <Alert className={message.type === 'success' ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'}>
              {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription className={message.type === 'success' ? 'text-green-200' : 'text-red-200'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <Card className="bg-monitoring-slate border-monitoring-gray">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="mr-2 h-5 w-5" />
                User Roles & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-monitoring-gray">
                    <TableHead className="text-gray-300">User ID</TableHead>
                    <TableHead className="text-gray-300">User Name</TableHead>
                    <TableHead className="text-gray-300">Branch</TableHead>
                    <TableHead className="text-gray-300">Role</TableHead>
                    <TableHead className="text-gray-300">Permissions</TableHead>
                    <TableHead className="text-gray-300">Created</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        Loading user roles...
                      </TableCell>
                    </TableRow>
                  ) : userRoles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        No user roles found. Click "New Role" to assign roles to users.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userRoles.map((userRole) => (
                      <TableRow key={userRole.userId} className="border-monitoring-gray">
                        <TableCell className="text-white">{userRole.userId}</TableCell>
                        <TableCell className="text-white">{userRole.userName}</TableCell>
                        <TableCell className="text-gray-400">{userRole.branchName}</TableCell>
                        <TableCell className="text-white">
                          <span className="px-2 py-1 bg-monitoring-blue/20 text-monitoring-blue rounded-md text-sm">
                            {roleOptions.find(r => r.value === userRole.role)?.label || userRole.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {userRole.permissions.length} permissions
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {new Date(userRole.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRole(userRole.userId)}
                            className="border-monitoring-gray text-gray-300 hover:bg-monitoring-gray hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Create/Edit Role Form View
  return (
    <div className="min-h-screen bg-monitoring-dark p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleBackToList}
            className="border-monitoring-gray text-gray-300 hover:bg-monitoring-gray hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-monitoring-blue p-3 rounded-full">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {currentView === 'edit' ? 'Edit User Role' : 'Create New Role'}
            </h1>
            <p className="text-gray-400">
              {currentView === 'edit' ? 'Modify user permissions and role' : 'Assign role and permissions to user'}
            </p>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={message.type === 'success' ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription className={message.type === 'success' ? 'text-green-200' : 'text-red-200'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Role Assignment Form */}
        <Card className="bg-monitoring-slate border-monitoring-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {currentView === 'edit' ? 'Edit User Role' : 'User Role Assignment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Selection Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-monitoring-gray/20 rounded-md border border-monitoring-gray">
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-gray-300 font-medium">User ID</Label>
                <Input
                  id="userId"
                  type="number"
                  value={targetUserId}
                  onChange={(e) => handleUserIdChange(e.target.value)}
                  placeholder="Enter user ID"
                  className="bg-monitoring-gray border-monitoring-gray text-white placeholder:text-gray-500 focus:border-monitoring-blue"
                  disabled={isLoading || currentView === 'edit'}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-300 font-medium">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole} disabled={isLoading}>
                  <SelectTrigger className="bg-monitoring-gray border-monitoring-gray text-white">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="bg-monitoring-gray border-monitoring-gray">
                    {roleOptions.map((role) => (
                      <SelectItem key={role.value} value={role.value} className="text-white">
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {userInfo && (
                <div className="md:col-span-2 p-3 bg-green-900/20 rounded-md border border-green-700">
                  <p className="text-white font-medium">{userInfo.userName}</p>
                  <p className="text-gray-400 text-sm">{userInfo.branchName}</p>
                </div>
              )}
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-lg font-medium">Menu Permissions</h3>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-monitoring-gray text-gray-300 hover:bg-monitoring-gray hover:text-white"
                    disabled={isLoading}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="border-monitoring-gray text-gray-300 hover:bg-monitoring-gray hover:text-white"
                    disabled={isLoading}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-md border border-monitoring-gray bg-monitoring-gray/20">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      className="mt-1"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={permission.id}
                        className="text-white font-medium cursor-pointer"
                      >
                        {permission.name}
                      </Label>
                      <p className="text-gray-400 text-sm">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-monitoring-gray">
                <Button
                  onClick={handleSavePermissions}
                  disabled={isLoading || !userInfo || !targetUserId || !selectedRole}
                  className="w-full bg-monitoring-blue hover:bg-monitoring-blue/90 text-white disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : currentView === 'edit' ? 'Update Permissions' : 'Save Permissions'}
                </Button>
                {(!userInfo || !selectedRole) && targetUserId && (
                  <p className="text-gray-400 text-sm text-center mt-2">
                    {!userInfo ? 'Enter a valid User ID' : 'Select a role'} to enable saving permissions
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
