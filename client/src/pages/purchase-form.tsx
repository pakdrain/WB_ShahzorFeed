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
    <div className="h-screen bg-blue-50 p-1 overflow-hidden">
      {/* Compact Top Bar */}
      <div className="flex justify-between items-center bg-white border rounded p-1 mb-1">
        <div className="flex gap-1 text-xs">
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Purc</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Sale</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Edit</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">First</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Prev</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Next</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Last</Button>
          <Button className="bg-green-600 hover:bg-green-700 h-6 px-3 text-xs" onClick={handleSave}>Save</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Print</Button>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Rej</Button>
        </div>
        <div className="flex gap-1">
          <Button 
            className={`h-6 px-3 text-xs ${onlineMode ? 'bg-black' : 'bg-gray-400'}`}
            onClick={() => toggleOnlineMode(true)}
          >
            ONLINE
          </Button>
          <Button 
            className={`h-6 px-3 text-xs ${!onlineMode ? 'bg-black' : 'bg-gray-400'}`}
            onClick={() => toggleOnlineMode(false)}
          >
            OFFLINE
          </Button>
        </div>
        <div className="text-2xl text-green-600 font-bold">2500</div>
      </div>

      {/* Compact Main Form */}
      <div className="bg-white p-2 rounded border h-[calc(100vh-80px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-2 h-full">
          {/* Column 1 - Form Fields */}
          <div className="col-span-2 space-y-1">
            <div>
              <Label className="text-xs text-black">Slip No</Label>
              <Input name="slipNo" value={formData.slipNo} readOnly className="h-6 text-xs text-black" />
            </div>
            <div>
              <Label className="text-xs text-black">Net Weight</Label>
              <Input name="netWeight" value={formData.netWeight} onChange={handleChange} className="h-6 text-xs bg-yellow-200 text-black" />
            </div>
            <div>
              <Label className="text-xs text-black">Freight</Label>
              <Input name="freight" value={formData.freight} onChange={handleChange} className="h-6 text-xs text-black" />
            </div>
            <div>
              <Label className="text-xs text-black">Remarks</Label>
              <Textarea
                placeholder="Add remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="h-16 text-xs resize-none text-black placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Column 2 - Weight Fields */}
          <div className="col-span-2 space-y-1">
            <div>
              <Label className="text-xs text-black">First Weight</Label>
              <Input name="firstWeight" value={formData.firstWeight} onChange={handleChange} className="h-6 text-xs text-black" />
            </div>
            <div>
              <Label className="text-xs text-black">Second Weight</Label>
              <Input name="secondWeight" value={formData.secondWeight} onChange={handleChange} className="h-6 text-xs text-green-600" />
            </div>
            <div>
              <Label className="text-xs text-black">Bardana Weight</Label>
              <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} className="h-6 text-xs text-black" />
            </div>
            <div>
              <Label className="text-xs text-black">Gross Weight</Label>
              <Input name="grossWeight" value={formData.grossWeight} readOnly className="h-6 text-xs text-black" />
            </div>
          </div>

          {/* Column 3 - Driver & Branch */}
          <div className="col-span-2 space-y-1">
            <div>
              <Label className="text-xs text-black">Branch</Label>
              <Select name="branch" value={formData.branch} onValueChange={(value) => setFormData(prev => ({...prev, branch: value}))}>
                <SelectTrigger className="h-6 text-xs text-black">
                  <SelectValue placeholder="Select branch" className="text-black" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Branch 1">Branch 1</SelectItem>
                  <SelectItem value="Branch 2">Branch 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-black">Driver Name</Label>
              <Input
                placeholder="Enter driver name"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                className="h-6 text-xs text-black placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label className="text-xs text-black">Date & Time</Label>
              <Input value="30-04-25 09:10:30 AM" readOnly className="h-6 text-xs text-black" />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button className="h-6 bg-green-600 text-xs">1st WHT</Button>
              <Button className="h-6 bg-gray-500 text-xs">2nd WHT</Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button className="h-6 bg-yellow-500 text-xs" onClick={resetForm}>Clear</Button>
              <Button className="h-6 bg-red-500 text-xs">Exit</Button>
            </div>
          </div>

          {/* Columns 4-6 - Camera and Weight in vertical stack */}
          <div className="col-span-3">
            <div className="space-y-2 h-full">
              {/* Weight Region */}
              <div className="bg-monitoring-dark border border-monitoring-gray rounded p-2 h-1/2">
                <h3 className="text-white text-center text-xs mb-2">Weight Monitor</h3>
                <WeightIndicator comPort="COM3" />
              </div>
              {/* Camera Region */}
              <div className="bg-black border border-monitoring-gray rounded overflow-hidden h-1/2">
                <h3 className="text-white text-center text-xs p-1 bg-monitoring-dark">Camera Feed</h3>
                <div className="h-[calc(100%-28px)]">
                  <VideoStreamFullscreen
                    camera={camera || { id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }}
                    isConnected={true}
                    isStreaming={true}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Columns 7-12 - Tabs and Table */}
          <div className="col-span-3">
            <Tabs defaultValue="purchase" className="h-full">
              <TabsList className="h-6">
                <TabsTrigger value="purchase" className="text-xs">Purchase</TabsTrigger>
                <TabsTrigger value="sale" className="text-xs">Sale</TabsTrigger>
                <TabsTrigger value="offline" className="text-xs">Offline</TabsTrigger>
              </TabsList>

              <TabsContent value="purchase" className="mt-1">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  {/* Mini Column 1 */}
                  <div className="space-y-1">
                    <div>
                      <Label className="text-xs text-black">Bardana Type</Label>
                      <Input name="bardanaType" value={formData.bardanaType} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">Wt Per Bag</Label>
                      <Input name="wtPerBag" value={formData.wtPerBag} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">No Of Bags</Label>
                      <Input name="noOfBags" value={formData.noOfBags} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                  </div>

                  {/* Mini Column 2 */}
                  <div className="space-y-1">
                    <div>
                      <Label className="text-xs text-black">IGP No</Label>
                      <Input name="igpNo" value={formData.igpNo} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">IGP Date</Label>
                      <Input name="igpDate" value={formData.igpDate} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">Vendor</Label>
                      <Input name="vendor" value={formData.vendor} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                  </div>

                  {/* Mini Column 3 */}
                  <div className="space-y-1">
                    <div>
                      <Label className="text-xs text-black">Vehicle No</Label>
                      <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">Supp's Weight</Label>
                      <Input name="superweight" value={formData.superweight} onChange={handleChange} className="h-5 text-xs text-black" />
                    </div>
                    <div>
                      <Button className="w-full h-5 bg-yellow-500 text-xs">Deduction +</Button>
                    </div>
                  </div>
                </div>

                {/* Compact Table */}
                <div className="border rounded mt-2 text-xs">
                  <table className="w-full text-center">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-1 text-xs text-black">Po</th>
                        <th className="border p-1 text-xs text-black">Item Code</th>
                        <th className="border p-1 text-xs text-black">Item Description</th>
                        <th className="border p-1 text-xs text-black">Po Qty</th>
                        <th className="border p-1 text-xs text-black">IgP Qty</th>
                        <th className="border p-1 text-xs text-black">Balance Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-1 h-6"></td>
                        <td className="border p-1 h-6"></td>
                        <td className="border p-1 h-6"></td>
                        <td className="border p-1 h-6"></td>
                        <td className="border p-1 h-6"></td>
                        <td className="border p-1 h-6"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="sale">
                <div className="text-center p-4 text-xs text-black">Sale tab content here</div>
              </TabsContent>

              <TabsContent value="offline">
                <div className="text-center p-4 text-xs text-black">Offline tab content here</div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}