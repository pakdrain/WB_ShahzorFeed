import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import WeightIndicator from '@/components/weight-indicator';
import VideoStreamFullscreen from '@/components/video-stream-fullscreen';
import { useQuery } from '@tanstack/react-query';

export default function PurchaseForm() {
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
    po_no: '',
    driverName: '',
    vendor: '',
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
    branch: '',
    bardanaType: '',
    wtPerBag: '',
    noOfBags: '',
    qualityDed: '',
    igpNo: '',
    igpDate: '',
    vehicleNo: '',
    weight: '',
    bags: '',
    superweight: '',
    supWtBardana: '',
    swtsOurWt: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);

  // Get camera data
  const { data: camera } = useQuery({
    queryKey: ['/api/cameras/1'],
    enabled: true,
  });

  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

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

  const toggleOnlineMode = (isOnline) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  useEffect(() => {
    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipNo: '1',
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));
    toggleOnlineMode(true);
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    toggleOnlineMode(true);
  };

  const handleSave = async () => {
    setLoading(true);
    // Save logic here
    alert('Purchase saved successfully!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-blue-50 p-2">
      {/* Top Bar Buttons */}
      <div className="flex flex-wrap justify-between items-center bg-white border rounded p-2 mb-2">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm">Purc</Button>
          <Button variant="outline" size="sm">Sale</Button>
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="outline" size="sm">|&lt; First</Button>
          <Button variant="outline" size="sm">&lt; Prev</Button>
          <Button variant="outline" size="sm">Next &gt;</Button>
          <Button variant="outline" size="sm">Last &gt;|</Button>
          <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={handleSave}>Save</Button>
          <Button variant="outline" size="sm">Print</Button>
          <Button variant="outline" size="sm">Rej</Button>
        </div>
        <div className="flex gap-2">
          <Button 
            className={`${onlineMode ? 'bg-black' : 'bg-gray-400'}`}
            onClick={() => toggleOnlineMode(true)}
          >
            ONLINE
          </Button>
          <Button 
            className={`${!onlineMode ? 'bg-black' : 'bg-gray-400'}`}
            onClick={() => toggleOnlineMode(false)}
          >
            OFFLINE
          </Button>
        </div>
        <div className="text-4xl text-green-600 font-bold">2500</div>
      </div>

      {/* Main Form Section */}
      <div className="bg-white p-3 rounded border mb-2">
        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Column 1 - Form Fields */}
          <div className="col-span-2">
            <Label>Slip No</Label>
            <Input name="slipNo" value={formData.slipNo} readOnly className="mb-4" />

            <Label className="mt-4">Net Weight</Label>
            <Input name="netWeight" value={formData.netWeight} onChange={handleChange} className="bg-yellow-200 mb-2" />

            <Label className="mt-2">Freight</Label>
            <Input name="freight" value={formData.freight} onChange={handleChange} />

            <Textarea
              className="mt-4 mb-3 w-full"
              placeholder="Add remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              style={{ height: '50px' }}
            />
          </div>

          {/* Column 2 - Weight Fields */}
          <div className="col-span-2">
            <Label>First Weight</Label>
            <Input name="firstWeight" value={formData.firstWeight} onChange={handleChange} />
            
            <Label>Second Weight</Label>
            <Input name="secondWeight" value={formData.secondWeight} onChange={handleChange} className="text-green-600" />
            
            <Label>Bardana Weight</Label>
            <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} />

            <Label>Gross Weight</Label>
            <Input name="grossWeight" value={formData.grossWeight} readOnly />
          </div>

          {/* Column 3 - Driver & Branch */}
          <div className="col-span-2">
            <Label>Branch</Label>
            <Select name="branch" value={formData.branch} onValueChange={(value) => setFormData(prev => ({...prev, branch: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Branch 1">Branch 1</SelectItem>
                <SelectItem value="Branch 2">Branch 2</SelectItem>
              </SelectContent>
            </Select>

            <Label>Driver Name</Label>
            <Input
              placeholder="Enter driver name"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
            />

            <Label>Date & Time</Label>
            <Input value="30-04-25 09:10:30 AM" readOnly />

            {/* Buttons */}
            <div className="mt-3">
              <div className="flex gap-2 mb-2">
                <Button className="flex-1 bg-green-600">1st WHT</Button>
                <Button className="flex-1 bg-gray-500">2nd WHT</Button>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-yellow-500" onClick={resetForm}>Clear</Button>
                <Button className="flex-1 bg-red-500">Exit</Button>
              </div>
            </div>
          </div>

          {/* Column 4 & 5 - Camera and Weight Display (30x30 each) */}
          <div className="col-span-6">
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Weight Region - Upper Right (30x30) */}
              <div className="bg-monitoring-dark border border-monitoring-gray rounded p-4">
                <h3 className="text-white text-center mb-4">Weight Monitor</h3>
                <WeightIndicator comPort="COM3" />
              </div>

              {/* Camera Region - Lower Right (30x30) */}
              <div className="bg-black border border-monitoring-gray rounded overflow-hidden">
                <h3 className="text-white text-center p-2 bg-monitoring-dark">Camera Feed</h3>
                <div className="aspect-video">
                  <VideoStreamFullscreen
                    camera={camera || { id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }}
                    isConnected={true}
                    isStreaming={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="purchase" className="mb-4">
          <TabsList>
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="sale">Sale</TabsTrigger>
            <TabsTrigger value="offline">Offline</TabsTrigger>
          </TabsList>

          <TabsContent value="purchase">
            <div className="grid grid-cols-6 gap-4 mb-4">
              {/* Column 1 */}
              <div className="col-span-2">
                <Label>Bardana Type</Label>
                <Input name="bardanaType" value={formData.bardanaType} onChange={handleChange} />
                <Label>Wt Per Bag</Label>
                <Input name="wtPerBag" value={formData.wtPerBag} onChange={handleChange} />
                <Label>No Of Bags</Label>
                <Input name="noOfBags" value={formData.noOfBags} onChange={handleChange} />
                <Label>Bardana Wht</Label>
                <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} />
                <Label>Quality Ded</Label>
                <Input name="qualityDed" value={formData.qualityDed} onChange={handleChange} />
              </div>

              {/* Column 2 */}
              <div className="col-span-2">
                <Label>IGP No</Label>
                <Input name="igpNo" value={formData.igpNo} onChange={handleChange} />
                <Label>IGP Date</Label>
                <Input name="igpDate" value={formData.igpDate} onChange={handleChange} />
                <Label>Vendor</Label>
                <Input name="vendor" value={formData.vendor} onChange={handleChange} />
                <Label>Vehicle No</Label>
                <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} />

                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <Label>Weight</Label>
                    <Input name="weight" value={formData.weight} onChange={handleChange} />
                  </div>
                  <div className="col-span-1">
                    <Label>% Bags</Label>
                    <Input name="bags" value={formData.bags} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="col-span-2">
                <Label>Supp's Weight</Label>
                <Input name="superweight" value={formData.superweight} onChange={handleChange} />
                <Label>Sup.Wt - Bardana</Label>
                <Input name="supWtBardana" value={formData.supWtBardana} onChange={handleChange} />
                <Label>S.Wts - Our Wt</Label>
                <Input name="swtsOurWt" value={formData.swtsOurWt} onChange={handleChange} />
                
                <div className="mt-4">
                  <Button className="w-full bg-yellow-500">Deduction +</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sale">
            <div className="text-center p-8">Sale tab content here</div>
          </TabsContent>

          <TabsContent value="offline">
            <div className="text-center p-8">Offline tab content here</div>
          </TabsContent>
        </Tabs>

        {/* Data Table */}
        <div className="border rounded overflow-hidden">
          <table className="w-full text-center border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Po</th>
                <th className="border p-2">Item Code</th>
                <th className="border p-2">Item Description</th>
                <th className="border p-2">Po Qty</th>
                <th className="border p-2">IgP Qty</th>
                <th className="border p-2">Balance Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
                <td className="border p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}