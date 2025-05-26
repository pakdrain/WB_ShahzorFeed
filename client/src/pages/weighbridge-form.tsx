import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoStreamFullscreen from '@/components/video-stream-fullscreen';
import { useQuery } from '@tanstack/react-query';
import { useStream } from '@/hooks/use-stream';
import axios from 'axios';

const WeighbridgeForm = () => {
  const initialFormData = {
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
    onlineEntry: 'Yes',
    offlineEntry: '',
    createdBy: '',
    creationDate: '',
    lastUpdatedBy: '',
    lastUpdatedDate: '',
    manualDcNo: '',
    entryType: 'PURCHASE',
    slipOutTime: '',
    status: '',
    slipDate: '',
    bardanaType: '',
    igpNo: '',
    igpDate: '',
    vehicleNo: '',
    supWtBardana: '',
    noOfBags: '',
    wtPerBag: '',
    swtsOurWt: '',
    qualityDed: '',
    branch: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);

  // Camera setup - keeping existing working camera
  const { data: camera } = useQuery({
    queryKey: ['/api/cameras/1'],
  });
  
  const {
    isConnected,
    isStreaming,
    startStream,
    stopStream,
    reconnectStream
  } = useStream(camera?.id);

  // Format ISO datetime string to "YYYY-MM-DDTHH:mm" for input[type=datetime-local]
  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  // Format back to ISO for sending to backend
  const formatISODate = (localString) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  // Handle input change with numeric validation on some fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = [
      'firstWeight', 'secondWeight', 'netWeight',
      'bardanaWeight', 'grossWeight', 'freight',
      'companyId', 'branchId', 'createdBy', 'lastUpdatedBy'
    ];

    if (numericFields.includes(name)) {
      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Toggle online/offline entry mode
  const toggleOnlineMode = (isOnline) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  // On mount, set default values and timestamps
  useEffect(() => {
    // Set default slip number
    setFormData(prev => ({ ...prev, slipNo: '1001' }));

    // Set default timestamps now
    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));

    toggleOnlineMode(true);
  }, []);

  // Reset form for New or Clear
  const resetForm = () => {
    setFormData(initialFormData);
    toggleOnlineMode(true);
  };

  // Prepare payload and submit
  const handleSave = async () => {
    setLoading(true);
    
    // For now, just simulate saving until you set up your weighbridge API
    setTimeout(() => {
      alert('Purchase slip saved successfully!');
      console.log('Form data:', formData);
      setLoading(false);
      // Auto-increment slip number for next entry
      const nextSlipNo = (parseInt(formData.slipNo, 10) + 1).toString();
      setFormData(prev => ({ ...prev, slipNo: nextSlipNo }));
    }, 1000);
  };

  if (!camera) {
    return <div className="p-4">Loading camera...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Live Camera Region - 30x30 pixels in top-left */}
      <div className="fixed top-4 left-4 z-50">
        <div 
          className="bg-gray-800 border border-gray-600 overflow-hidden"
          style={{ width: '30px', height: '30px' }}
        >
          {camera && (
            <img
              className="w-full h-full object-cover bg-black"
              src={`/api/stream/${camera.id}/mjpeg`}
              alt="Live Camera Feed"
              style={{ 
                width: '30px',
                height: '30px',
                backgroundColor: 'black'
              }}
            />
          )}
        </div>
      </div>

      {/* Main Weighbridge Form */}
      <div className="container-fluid p-1 ml-20">
        <Card className="mb-3">
          <CardHeader className="bg-gray-100 py-2">
            <CardTitle className="text-lg font-bold">Purchase Weightbridge Slip</CardTitle>
          </CardHeader>
        </Card>

        <div className="flex gap-2 mb-4">
          <Button onClick={resetForm} variant="default">New</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="secondary">Print</Button>
          <Button onClick={resetForm} variant="outline">Clear</Button>
          <Button variant="destructive">Exit</Button>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="slipNo">Slip No</Label>
                <Input name="slipNo" value={formData.slipNo} readOnly />
                <Label htmlFor="netWeight">Net Weight</Label>
                <Input className="bg-yellow-100" name="netWeight" value={formData.netWeight} onChange={handleChange} />
                <Label htmlFor="freight">Freight</Label>
                <Input name="freight" value={formData.freight} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="firstWeight">First Weight</Label>
                <Input name="firstWeight" value={formData.firstWeight} onChange={handleChange} />
                <Label htmlFor="secondWeight">Second Weight</Label>
                <Input className="text-green-600" name="secondWeight" value={formData.secondWeight} onChange={handleChange} />
                <Label htmlFor="bardanaWeight">Bardana Weight</Label>
                <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="driverName">Driver Name</Label>
                <Input placeholder="Enter driver name" name="driverName" value={formData.driverName} onChange={handleChange} />
                <Label htmlFor="grossWeight">Gross Weight</Label>
                <Input name="grossWeight" value={formData.grossWeight} readOnly />
              </div>
            </div>

            <Textarea
              className="mb-4"
              placeholder="Add remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
            />

            <Tabs defaultValue="purchase" className="mb-4">
              <TabsList>
                <TabsTrigger value="purchase">Purchase</TabsTrigger>
                <TabsTrigger value="sale">Sale</TabsTrigger>
                <TabsTrigger value="offline">Offline</TabsTrigger>
              </TabsList>
              <TabsContent value="purchase">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bardanaType">Bardana Type</Label>
                    <Input name="bardanaType" value={formData.bardanaType} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="igpNo">IGP No</Label>
                    <Input name="igpNo" value={formData.igpNo} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="vehicleNo">Vehicle No</Label>
                    <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="companyId">Company ID</Label>
                    <Input name="companyId" value={formData.companyId} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="branchId">Branch ID</Label>
                    <Input name="branchId" value={formData.branchId} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="slipInTime">Slip In Time</Label>
                    <Input 
                      type="datetime-local" 
                      name="slipInTime" 
                      value={formData.slipInTime} 
                      onChange={handleChange} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Input name="status" value={formData.status} onChange={handleChange} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeighbridgeForm;