import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import WeightIndicator from '@/components/weight-indicator';
import VideoStreamFullscreen from '@/components/video-stream-fullscreen';

const PurchaseOnline = () => {
  const [location, navigate] = useLocation();
  const [formData, setFormData] = useState({
    slipNo: '',
    slipInTime: '',
    firstWeight: '',
    secondWeight: '',
    netWeight: '',
    bardanaWeight: '',
    grossWeight: '',
    freight: '',
    remarks: '',
    driverName: '',
    companyId: '',
    branchId: '',
    createdBy: '',
    creationDate: '',
    lastUpdatedBy: '',
    lastUpdatedDate: '',
    manualDcNo: '',
    slipOutTime: '',
    status: '',
    slipDate: '',
    onlineEntry: 'Yes',
    offlineEntry: null
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [entryTypes, setEntryTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWbId, setEditingWbId] = useState<number | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchBranches();
    fetchEntryTypes();
    fetchNextSlipNumber();
    
    // Check for edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get('edit');
    if (editWbId) {
      loadDataByWbId(parseInt(editWbId));
    }
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/branches');
      const data = await response.json();
      setBranches(data);
      console.log('Branches fetched:', data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchEntryTypes = async () => {
    try {
      const response = await fetch('/api/entry-types');
      const data = await response.json();
      setEntryTypes(data);
      console.log('Entry types fetched:', data);
    } catch (error) {
      console.error('Error fetching entry types:', error);
    }
  };

  const fetchNextSlipNumber = async () => {
    try {
      const response = await fetch('/api/purchase/next-slip-number');
      const data = await response.json();
      setFormData(prev => ({ ...prev, slipNo: data.nextSlipNumber }));
    } catch (error) {
      console.error('Error fetching next slip number:', error);
    }
  };

  const loadDataByWbId = async (wbId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase/by-wbid/${wbId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.master) {
          setFormData({
            ...data.master,
            onlineEntry: 'Yes',
            offlineEntry: null
          });
          setIsEditMode(true);
          setEditingWbId(wbId);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        onlineEntry: 'Yes',
        offlineEntry: null,
        entryType: 'Purchase'
      };

      const url = isEditMode ? `/api/purchase/update/${editingWbId}` : '/api/purchase/save';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Purchase saved successfully!');
        if (!isEditMode) {
          resetForm();
          fetchNextSlipNumber();
        }
      } else {
        throw new Error('Failed to save purchase');
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Error saving purchase');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slipNo: '',
      slipInTime: '',
      firstWeight: '',
      secondWeight: '',
      netWeight: '',
      bardanaWeight: '',
      grossWeight: '',
      freight: '',
      remarks: '',
      driverName: '',
      companyId: '',
      branchId: '',
      createdBy: '',
      creationDate: '',
      lastUpdatedBy: '',
      lastUpdatedDate: '',
      manualDcNo: '',
      slipOutTime: '',
      status: '',
      slipDate: '',
      onlineEntry: 'Yes',
      offlineEntry: null
    });
    setIsEditMode(false);
    setEditingWbId(null);
  };

  return (
    <div className="p-2 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white p-2 rounded border mb-2">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-600">Purchase Online</h1>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="bg-blue-600 text-white p-2 rounded mb-2 text-center text-sm font-medium">
          EDIT MODE: Slip No. {formData.slipNo} (ID: {editingWbId})
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white p-4 rounded border">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Side - Form Fields */}
          <div className="col-span-8 space-y-4">
            {/* Slip Number and Basic Info */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Slip No</Label>
                <Input 
                  name="slipNo" 
                  value={formData.slipNo} 
                  onChange={handleInputChange}
                  readOnly 
                />
              </div>
              <div>
                <Label>Driver Name</Label>
                <Input 
                  name="driverName" 
                  value={formData.driverName} 
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Branch</Label>
                <select 
                  name="branchId" 
                  value={formData.branchId} 
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Freight</Label>
                <Input 
                  name="freight" 
                  value={formData.freight} 
                  onChange={handleInputChange}
                  type="number"
                />
              </div>
            </div>

            {/* Weight Information */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>First Weight</Label>
                <Input 
                  name="firstWeight" 
                  value={formData.firstWeight} 
                  onChange={handleInputChange}
                  type="number"
                />
              </div>
              <div>
                <Label>Second Weight</Label>
                <Input 
                  name="secondWeight" 
                  value={formData.secondWeight} 
                  onChange={handleInputChange}
                  type="number"
                />
              </div>
              <div>
                <Label>Net Weight</Label>
                <Input 
                  name="netWeight" 
                  value={formData.netWeight} 
                  onChange={handleInputChange}
                  type="number"
                />
              </div>
              <div>
                <Label>Bardana Weight</Label>
                <Input 
                  name="bardanaWeight" 
                  value={formData.bardanaWeight} 
                  onChange={handleInputChange}
                  type="number"
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Slip In Time</Label>
                <Input 
                  name="slipInTime" 
                  value={formData.slipInTime} 
                  onChange={handleInputChange}
                  type="datetime-local"
                />
              </div>
              <div>
                <Label>Slip Out Time</Label>
                <Input 
                  name="slipOutTime" 
                  value={formData.slipOutTime} 
                  onChange={handleInputChange}
                  type="datetime-local"
                />
              </div>
            </div>

            <div>
              <Label>Remarks</Label>
              <textarea 
                name="remarks" 
                value={formData.remarks} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={resetForm} variant="outline">
                Clear
              </Button>
              {isEditMode && (
                <Button onClick={resetForm} variant="destructive">
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          {/* Right Side - Camera and Weight */}
          <div className="col-span-4 space-y-4">
            <div>
              <Label>Weight Display</Label>
              <WeightIndicator comPort="COM6" />
            </div>
            
            <div>
              <Label>Camera Feed</Label>
              <VideoStreamFullscreen
                camera={{ id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }}
                isConnected={true}
                isStreaming={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOnline;