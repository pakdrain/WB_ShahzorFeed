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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    // Additional fields from your code
    wbItemPId: '',
    wbId: '',
    doId: '',
    doNo: '',
    customerId: '',
    customerName: '',
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
    igpId: '',
    vendorId: '',
    vendorName: '',
    weightPerBags: '',
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

  const defaultCamera = {
    id: 1,
    name: "Camera 01",
    ip: "10.10.10.146",
    port: 554
  };

  // Fetch existing purchases to generate next slip number
  const { data: purchases } = useQuery({
    queryKey: ['/api/purchases'],
    queryFn: async () => {
      const response = await fetch('/api/purchases');
      if (!response.ok) throw new Error('Failed to fetch purchases');
      return response.json();
    },
  });

  // Save purchase mutation
  const savePurchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/purchases', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Purchase saved successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: 'Failed to save purchase: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  // IGP Data fetch function
  const fetchIgpData = async () => {
    if (!formData.igpNo) {
      alert('Please enter IGP No');
      return;
    }
    try {
      const response = await fetch(
        `http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/live_data?igp_no=${formData.igpNo}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.items && data.items.length > 0) {
        setIgpItems(data.items);
        // Populate form with IGP data
        const igpData = data.items[0];
        setFormData(prev => ({
          ...prev,
          vendor: igpData.vendor_name || '',
          vehicleNo: igpData.vehicle_no || '',
          po_no: igpData.po_no || '',
          itemCode: igpData.item_code || '',
          itemDesc: igpData.item_desc || '',
          poQty: igpData.po_qty || '',
          igpQty: igpData.igp_qty || '',
          balanceQty: igpData.balance_qty || '',
        }));
        toast({
          title: 'Success',
          description: 'IGP data loaded successfully!',
        });
      } else {
        toast({
          title: 'No Data',
          description: 'No IGP data found for this number',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error fetching IGP data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch IGP data: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Initialize form with next slip number and current time
  useEffect(() => {
    if (purchases && purchases.length > 0) {
      const maxSlip = purchases.reduce((max: number, curr: any) => {
        const slip = parseInt(curr.slip_no || '0', 10);
        return slip > max ? slip : max;
      }, 0);
      const nextSlip = (maxSlip + 1).toString();
      setFormData(prev => ({ ...prev, slipNo: nextSlip }));
    } else {
      setFormData(prev => ({ ...prev, slipNo: '1' }));
    }

    // Set default timestamps
    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: now.slice(0, 16),
      slipDate: now,
      creationDate: now,
      lastUpdatedDate: now,
    }));
  }, [purchases]);

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setIgpItems([]);
    setOnlineMode(true);
  };

  // Handle save
  const handleSave = async () => {
    setLoading(true);
    
    const payload = {
      slipNo: formData.slipNo || null,
      slipInTime: formData.slipInTime ? new Date(formData.slipInTime).toISOString() : null,
      firstWeight: formData.firstWeight ? parseFloat(formData.firstWeight) : null,
      secondWeight: formData.secondWeight ? parseFloat(formData.secondWeight) : null,
      netWeight: formData.netWeight ? parseFloat(formData.netWeight) : null,
      bardanaWeight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
      grossWeight: formData.grossWeight ? parseFloat(formData.grossWeight) : null,
      freight: formData.freight ? parseFloat(formData.freight) : null,
      remarks: formData.remarks || null,
      po_no: formData.po_no || null,
      driverName: formData.driverName || null,
      vendor: formData.vendor || null,
      companyId: formData.companyId ? parseInt(formData.companyId, 10) : null,
      branchId: formData.branchId ? parseInt(formData.branchId, 10) : null,
      onlineEntry: formData.onlineEntry || null,
      offlineEntry: formData.offlineEntry || null,
      createdBy: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      lastUpdatedBy: formData.lastUpdatedBy ? parseInt(formData.lastUpdatedBy, 10) : null,
      manualDcNo: formData.manualDcNo || null,
      entryType: formData.entryType || 'PURCHASE',
      slipOutTime: formData.slipOutTime ? new Date(formData.slipOutTime).toISOString() : null,
      status: formData.status || null,
      slipDate: formData.slipDate || null,
      igpNo: formData.igpNo || null,
      igpDate: formData.igpDate ? new Date(formData.igpDate).toISOString() : null,
      vehicleNo: formData.vehicleNo || null,
      bardanaType: formData.bardanaType || null,
      noOfBags: formData.noOfBags ? parseInt(formData.noOfBags, 10) : null,
      weightPerBags: formData.weightPerBags ? parseFloat(formData.weightPerBags) : null,
      qualityDeduction: formData.qualityDeduction ? parseFloat(formData.qualityDeduction) : null,
      supplierWeight: formData.supplierWeight ? parseFloat(formData.supplierWeight) : null,
      supWeightWithoutBardana: formData.supWeightWithoutBardana ? parseFloat(formData.supWeightWithoutBardana) : null,
    };

    try {
      await savePurchaseMutation.mutateAsync(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-monitoring-dark text-white p-4">
      {/* Camera and Weight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Camera Stream */}
        <Card className="bg-monitoring-slate border-monitoring-gray">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-monitoring-blue">Live Camera Feed</h3>
            <VideoStreamFullscreen
              camera={camera || defaultCamera}
              isConnected={true}
              isStreaming={true}
            />
          </CardContent>
        </Card>

        {/* Weight Indicator */}
        <Card className="bg-monitoring-slate border-monitoring-gray">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-monitoring-blue">Weight Reading</h3>
            <WeightIndicator />
          </CardContent>
        </Card>
      </div>

      {/* Purchase Form */}
      <Card className="bg-monitoring-slate border-monitoring-gray">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-monitoring-blue">Purchase Entry Form</h2>
            <div className="flex gap-2">
              <Button 
                variant={onlineMode ? "default" : "outline"}
                onClick={() => setOnlineMode(true)}
                className="bg-monitoring-blue hover:bg-monitoring-blue/90"
              >
                ONLINE
              </Button>
              <Button 
                variant={!onlineMode ? "default" : "outline"}
                onClick={() => setOnlineMode(false)}
              >
                OFFLINE
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {/* Basic Information */}
            <div>
              <Label htmlFor="slipNo" className="text-gray-300">Slip No</Label>
              <Input
                id="slipNo"
                name="slipNo"
                value={formData.slipNo}
                readOnly
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="slipInTime" className="text-gray-300">Date & Time</Label>
              <Input
                id="slipInTime"
                name="slipInTime"
                type="datetime-local"
                value={formData.slipInTime}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="firstWeight" className="text-gray-300">First Weight</Label>
              <Input
                id="firstWeight"
                name="firstWeight"
                value={formData.firstWeight}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="secondWeight" className="text-gray-300">Second Weight</Label>
              <Input
                id="secondWeight"
                name="secondWeight"
                value={formData.secondWeight}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="netWeight" className="text-gray-300">Net Weight</Label>
              <Input
                id="netWeight"
                name="netWeight"
                value={formData.netWeight}
                onChange={handleChange}
                className="bg-yellow-600 border-monitoring-gray text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="driverName" className="text-gray-300">Driver Name</Label>
              <Input
                id="driverName"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="vehicleNo" className="text-gray-300">Vehicle No</Label>
              <Input
                id="vehicleNo"
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="vendor" className="text-gray-300">Vendor</Label>
              <Input
                id="vendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>
          </div>

          {/* IGP Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="igpNo" className="text-gray-300">IGP No</Label>
              <div className="flex gap-2">
                <Input
                  id="igpNo"
                  name="igpNo"
                  value={formData.igpNo}
                  onChange={handleChange}
                  className="bg-gray-700 border-monitoring-gray text-white"
                />
                <Button 
                  onClick={fetchIgpData}
                  className="bg-monitoring-blue hover:bg-monitoring-blue/90"
                >
                  Fetch
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="igpDate" className="text-gray-300">IGP Date</Label>
              <Input
                id="igpDate"
                name="igpDate"
                type="date"
                value={formData.igpDate}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="po_no" className="text-gray-300">PO No</Label>
              <Input
                id="po_no"
                name="po_no"
                value={formData.po_no}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="bardanaType" className="text-gray-300">Bardana Type</Label>
              <Input
                id="bardanaType"
                name="bardanaType"
                value={formData.bardanaType}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="noOfBags" className="text-gray-300">No of Bags</Label>
              <Input
                id="noOfBags"
                name="noOfBags"
                value={formData.noOfBags}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="weightPerBags" className="text-gray-300">Weight Per Bag</Label>
              <Input
                id="weightPerBags"
                name="weightPerBags"
                value={formData.weightPerBags}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="supplierWeight" className="text-gray-300">Supplier Weight</Label>
              <Input
                id="supplierWeight"
                name="supplierWeight"
                value={formData.supplierWeight}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>

            <div>
              <Label htmlFor="qualityDeduction" className="text-gray-300">Quality Deduction</Label>
              <Input
                id="qualityDeduction"
                name="qualityDeduction"
                value={formData.qualityDeduction}
                onChange={handleChange}
                className="bg-gray-700 border-monitoring-gray text-white"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="mb-6">
            <Label htmlFor="remarks" className="text-gray-300">Remarks</Label>
            <Textarea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="bg-gray-700 border-monitoring-gray text-white"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Saving...' : 'Save Purchase'}
            </Button>
            <Button 
              onClick={resetForm}
              variant="outline"
              className="border-monitoring-gray text-white hover:bg-monitoring-gray"
            >
              Clear Form
            </Button>
          </div>

          {/* IGP Items Display */}
          {igpItems.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 text-monitoring-blue">IGP Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-monitoring-gray">
                  <thead className="bg-monitoring-gray">
                    <tr>
                      <th className="border border-monitoring-gray p-2 text-left">Item Code</th>
                      <th className="border border-monitoring-gray p-2 text-left">Description</th>
                      <th className="border border-monitoring-gray p-2 text-left">PO Qty</th>
                      <th className="border border-monitoring-gray p-2 text-left">IGP Qty</th>
                      <th className="border border-monitoring-gray p-2 text-left">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {igpItems.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="border border-monitoring-gray p-2">{item.item_code}</td>
                        <td className="border border-monitoring-gray p-2">{item.item_desc}</td>
                        <td className="border border-monitoring-gray p-2">{item.po_qty}</td>
                        <td className="border border-monitoring-gray p-2">{item.igp_qty}</td>
                        <td className="border border-monitoring-gray p-2">{item.balance_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}