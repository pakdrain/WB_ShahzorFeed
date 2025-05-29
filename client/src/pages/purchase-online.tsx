import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import WeightIndicator from '@/components/weight-indicator';
import VideoStreamFullscreen from '@/components/video-stream-fullscreen';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const PurchaseOnline = () => {
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
    igpNo: '',
    vehicleNo: '',
    customerId: '',
    customerName: '',
    doId: '',
    doNo: '',
    doDate: '',
    itemId: '',
    itemCode: '',
    itemDesc: '',
    poId: '',
    poQty: '',
    igpQty: '',
    balanceQty: '',
    baradanaType: '',
    manualIgpNo: '',
    vendorId: '',
    vendorName: '',
    noOfBags: '',
    weightPerBags: '',
    igpDate: '',
    qualityDeduction: '',
    supplierWeight: '',
    supWeightWithoutBardana: '',
    netSupplierWeight: '',
    bagCondition: '',
    bardanaTypeId: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);
  const [igpItems, setIgpItems] = useState([]);

  // Get camera data
  const { data: camera } = useQuery({
    queryKey: ['/api/cameras/1'],
    enabled: true,
  });

  const fetchIgpData = async () => {
    if (!formData.igpNo) {
      alert('Please enter IGP No');
      return;
    }
    try {
      const response = await axios.get(
        `http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/live_data`,
        { params: { igp_no: formData.igpNo } }
      );

      if (response.data && response.data.items && response.data.items.length > 0) {
        const data = response.data.items;
        const firstItem = data[0];
        setFormData(prev => ({
          ...prev,
          driverName: firstItem.driver_name || '',
          vendor: firstItem.vendor_name || '',
          vehicleNo: firstItem.vehicle_no || '',
          bardanaWeight: firstItem.bardana_qty ? String(firstItem.bardana_qty) : '',
        }));
        setIgpItems(data);
      } else {
        alert('No data found for this IGP No.');
        setIgpItems([]);
      }
    } catch (error) {
      console.error('Error fetching IGP data:', error);
      alert('Failed to fetch IGP data');
      setIgpItems([]);
    }
  };

  const formatDatetimeLocal = (isoString: any) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  const formatISODate = (localString: any) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  const handleChange = (e: any) => {
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

  const toggleOnlineMode = (isOnline: any) => {
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
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
      slipNo: '1', // You can implement auto-increment logic here
    }));
    toggleOnlineMode(true);
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    toggleOnlineMode(true);
  };

  const handleSave = async () => {
    setLoading(true);
    // Implement save logic here
    try {
      alert('Purchase saved successfully!');
      resetForm();
    } catch (err) {
      alert('Failed to save purchase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-monitoring-bg overflow-hidden">
      <div className="flex-1 p-4">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Side - Form Fields (Columns 1-9) */}
          <div className="col-span-9">
            <Tabs defaultValue="basic" className="h-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="weights">Weights</TabsTrigger>
                <TabsTrigger value="igp">IGP Details</TabsTrigger>
                <TabsTrigger value="items">Item Details</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 h-[calc(100%-60px)] overflow-y-auto">
                <div className="grid grid-cols-4 gap-3">
                  {/* Online/Offline Mode */}
                  <div className="col-span-4 flex items-center space-x-4 mb-4">
                    <Label className="text-black font-medium">Mode:</Label>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={onlineMode} 
                        onCheckedChange={toggleOnlineMode}
                      />
                      <Label className="text-black">{onlineMode ? 'Online' : 'Offline'}</Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-black font-medium">Slip No</Label>
                    <Input name="slipNo" value={formData.slipNo} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Slip In Time</Label>
                    <Input 
                      type="datetime-local" 
                      name="slipInTime" 
                      value={formData.slipInTime} 
                      onChange={handleChange} 
                      className="text-black"
                    />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Driver Name</Label>
                    <Input name="driverName" value={formData.driverName} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Vehicle No</Label>
                    <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Vendor</Label>
                    <Input name="vendor" value={formData.vendor} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Company ID</Label>
                    <Input name="companyId" value={formData.companyId} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Branch ID</Label>
                    <Input name="branchId" value={formData.branchId} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Manual DC No</Label>
                    <Input name="manualDcNo" value={formData.manualDcNo} onChange={handleChange} className="text-black" />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-black font-medium">Remarks</Label>
                    <Textarea name="remarks" value={formData.remarks} onChange={handleChange} className="text-black" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="weights" className="space-y-4 h-[calc(100%-60px)] overflow-y-auto">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-black font-medium">First Weight</Label>
                    <Input name="firstWeight" value={formData.firstWeight} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Second Weight</Label>
                    <Input name="secondWeight" value={formData.secondWeight} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Net Weight</Label>
                    <Input name="netWeight" value={formData.netWeight} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Bardana Weight</Label>
                    <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Gross Weight</Label>
                    <Input name="grossWeight" value={formData.grossWeight} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Freight</Label>
                    <Input name="freight" value={formData.freight} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Supplier Weight</Label>
                    <Input name="supplierWeight" value={formData.supplierWeight} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Quality Deduction</Label>
                    <Input name="qualityDeduction" value={formData.qualityDeduction} onChange={handleChange} className="text-black" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="igp" className="space-y-4 h-[calc(100%-60px)] overflow-y-auto">
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Label className="text-black font-medium">IGP No</Label>
                    <div className="flex gap-2">
                      <Input name="igpNo" value={formData.igpNo} onChange={handleChange} className="text-black" />
                      <Button onClick={fetchIgpData} disabled={loading}>
                        Fetch IGP
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-black font-medium">Manual IGP No</Label>
                    <Input name="manualIgpNo" value={formData.manualIgpNo} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">IGP Date</Label>
                    <Input type="date" name="igpDate" value={formData.igpDate} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">PO No</Label>
                    <Input name="po_no" value={formData.po_no} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">PO Qty</Label>
                    <Input name="poQty" value={formData.poQty} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">IGP Qty</Label>
                    <Input name="igpQty" value={formData.igpQty} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Balance Qty</Label>
                    <Input name="balanceQty" value={formData.balanceQty} onChange={handleChange} className="text-black" />
                  </div>
                </div>

                {/* IGP Items Table */}
                {igpItems.length > 0 && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-black">IGP Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 p-2 text-black">Item Code</th>
                              <th className="border border-gray-300 p-2 text-black">Item Description</th>
                              <th className="border border-gray-300 p-2 text-black">Quantity</th>
                              <th className="border border-gray-300 p-2 text-black">Vehicle No</th>
                            </tr>
                          </thead>
                          <tbody>
                            {igpItems.map((item: any, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-2 text-black">{item.item_code}</td>
                                <td className="border border-gray-300 p-2 text-black">{item.item_desc}</td>
                                <td className="border border-gray-300 p-2 text-black">{item.igp_qty}</td>
                                <td className="border border-gray-300 p-2 text-black">{item.vehicle_no}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="items" className="space-y-4 h-[calc(100%-60px)] overflow-y-auto">
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-black font-medium">Customer ID</Label>
                    <Input name="customerId" value={formData.customerId} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Customer Name</Label>
                    <Input name="customerName" value={formData.customerName} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Item Code</Label>
                    <Input name="itemCode" value={formData.itemCode} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Item Description</Label>
                    <Input name="itemDesc" value={formData.itemDesc} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">No of Bags</Label>
                    <Input name="noOfBags" value={formData.noOfBags} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Weight Per Bag</Label>
                    <Input name="weightPerBags" value={formData.weightPerBags} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Bag Condition</Label>
                    <Input name="bagCondition" value={formData.bagCondition} onChange={handleChange} className="text-black" />
                  </div>
                  <div>
                    <Label className="text-black font-medium">Bardana Type</Label>
                    <Input name="baradanaType" value={formData.baradanaType} onChange={handleChange} className="text-black" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? 'Saving...' : 'Save Purchase'}
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="border-gray-400 text-black">
                    Clear Form
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Side - Camera and Weight (Columns 10-12) */}
          <div className="col-span-3">
            <div className="space-y-3 h-full">
              {/* Weight Region - Top */}
              <div className="bg-monitoring-dark border border-monitoring-gray rounded p-3 h-[45%]">
                <h3 className="text-white text-center text-sm mb-3">Weight Monitor</h3>
                <WeightIndicator comPort="COM3" />
              </div>
              {/* Camera Region - Bottom */}
              <div className="bg-monitoring-dark border border-monitoring-gray rounded p-3 h-[50%]">
                <h3 className="text-white text-center text-sm mb-3">Camera Feed</h3>
                <div className="bg-black rounded h-[calc(100%-60px)] overflow-hidden">
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
      </div>
    </div>
  );
};

export default PurchaseOnline;