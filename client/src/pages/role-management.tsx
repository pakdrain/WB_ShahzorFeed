
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Permission {
  id: string;
  name: string;
  description: string;
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

export default function RoleManagement() {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ userName: string; branchName: string } | null>(null);

  // Check if current user is admin
  const isAdmin = user?.userName === 'admin' || user?.userid === 1;

  useEffect(() => {
    if (!isAdmin) {
      setMessage({ type: 'error', text: 'Access denied. Admin privileges required.' });
    }
  }, [isAdmin]);

  const fetchUserPermissions = async (userId: string) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPermissions(data.permissions || []);
        setUserInfo(data.userInfo || null);
        setMessage(null);
      } else {
        setMessage({ type: 'error', text: 'User not found' });
        setSelectedPermissions([]);
        setUserInfo(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching user permissions' });
      setSelectedPermissions([]);
      setUserInfo(null);
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
    if (!targetUserId || !userInfo) {
      setMessage({ type: 'error', text: 'Please select a valid user first' });
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
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Permissions updated successfully' });
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

  return (
    <div className="min-h-screen bg-monitoring-dark p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="bg-monitoring-blue p-3 rounded-full">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Role Management</h1>
            <p className="text-gray-400">Manage user permissions and access control</p>
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

        {/* User Selection */}
        <Card className="bg-monitoring-slate border-monitoring-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Select User
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-gray-300">User ID</Label>
              <Input
                id="userId"
                type="number"
                value={targetUserId}
                onChange={(e) => handleUserIdChange(e.target.value)}
                placeholder="Enter user ID to manage permissions"
                className="bg-monitoring-gray border-monitoring-gray text-white placeholder:text-gray-500 focus:border-monitoring-blue"
                disabled={isLoading}
              />
            </div>
            
            {userInfo && (
              <div className="p-3 bg-monitoring-gray/50 rounded-md border border-monitoring-gray">
                <p className="text-white font-medium">{userInfo.userName}</p>
                <p className="text-gray-400 text-sm">{userInfo.branchName}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        {userInfo && (
          <Card className="bg-monitoring-slate border-monitoring-gray">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Permissions</CardTitle>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-monitoring-gray text-gray-300 hover:bg-monitoring-gray hover:text-white"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="border-monitoring-gray text-gray-300 hover:bg-monitoring-gray hover:text-white"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-md border border-monitoring-gray bg-monitoring-gray/20">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                      className="mt-1"
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
                  disabled={isLoading || !userInfo}
                  className="w-full bg-monitoring-blue hover:bg-monitoring-blue/90 text-white"
                >
                  {isLoading ? 'Saving...' : 'Save Permissions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
