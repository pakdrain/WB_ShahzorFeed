import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const PurchaseEntry = () => {
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
    poNo: '',
    driverName: '',
    vendor: '',
    companyId: '',
    branchId: '',
    onlineEntry: 'Yes',
    offlineEntry: '',
    createdBy: '',
    lastUpdatedBy: '',
    manualDcNo: '',
    entryType: 'PURCHASE',
    slipOutTime: '',
    status: '',
    slipDate: '',
    // Purchase item fields
    igpNo: '',
    igpDate: '',
    vehicleNo: '',
    bardanaType: '',
    noOfBags: '',
    weightPerBags: '',
    qualityDeduction: '',
    supplierWeight: '',
    supWeightWithoutBardana: '',
    itemCode: '',
    itemDesc: '',
    poQty: '',
    igpQty: '',
    balanceQty: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);

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

  // Format datetime for input
  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  // Format ISO date
  const formatISODate = (localString: string) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'firstWeight', 'secondWeight', 'netWeight',
      'bardanaWeight', 'grossWeight', 'freight',
      'companyId', 'branchId', 'createdBy', 'lastUpdatedBy',
      'noOfBags', 'weightPerBags', 'qualityDeduction',
      'supplierWeight', 'supWeightWithoutBardana', 'poQty', 'igpQty', 'balanceQty'
    ];

    if (numericFields.includes(name)) {
      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle online/offline mode
  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    toggleOnlineMode(true);
  };

  // Initialize form with next slip number and current time
  useEffect(() => {
    if (purchases && purchases.length > 0) {
      const maxSlip = purchases.reduce((max: number, curr: any) => {
        const slip = parseInt(curr.slipNo || '0', 10);
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
      slipInTime: formatDatetimeLocal(now),
      slipDate: now,
    }));

    toggleOnlineMode(true);
  }, [purchases]);

  // Handle save
  const handleSave = async () => {
    setLoading(true);

    const payload = {
      slipNo: formData.slipNo || null,
      slipInTime: formatISODate(formData.slipInTime),
      firstWeight: formData.firstWeight ? parseFloat(formData.firstWeight) : null,
      secondWeight: formData.secondWeight ? parseFloat(formData.secondWeight) : null,
      netWeight: formData.netWeight ? parseFloat(formData.netWeight) : null,
      bardanaWeight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
      grossWeight: formData.grossWeight ? parseFloat(formData.grossWeight) : null,
      freight: formData.freight ? parseFloat(formData.freight) : null,
      remarks: formData.remarks || null,
      poNo: formData.poNo || null,
      driverName: formData.driverName || null,
      vendor: formData.vendor || null,
      companyId: formData.companyId ? parseInt(formData.companyId, 10) : null,
      branchId: formData.branchId ? parseInt(formData.branchId, 10) : null,
      onlineEntry: formData.onlineEntry || null,
      offlineEntry: formData.offlineEntry || null,
      createdBy: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      lastUpdatedBy: formData.lastUpdatedBy ? parseInt(formData.lastUpdatedBy, 10) : null,
      manualDcNo: formData.manualDcNo || null,
      entryType: formData.entryType || null,
      slipOutTime: formatISODate(formData.slipOutTime),
      status: formData.status || null,
      slipDate: formData.slipDate || null,
    };

    try {
      await savePurchaseMutation.mutateAsync(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#d7e9f7', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap justify-between items-center bg-white border rounded p-3 mb-4 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm">Purc</Button>
          <Button variant="outline" size="sm">Sale</Button>
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="outline" size="sm">|&lt; First</Button>
          <Button variant="outline" size="sm">&lt; Prev</Button>
          <Button variant="outline" size="sm">Next &gt;</Button>
          <Button variant="outline" size="sm">Last &gt;|</Button>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button variant="outline" size="sm">Print</Button>
          <Button variant="outline" size="sm">Reject</Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={onlineMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleOnlineMode(true)}
          >
            ONLINE
          </Button>
          <Button 
            variant={!onlineMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleOnlineMode(false)}
          >
            OFFLINE
          </Button>
        </div>

        <div className="text-2xl font-bold text-green-600">
          2500
        </div>
      </div>

      {/* Main Form Section */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="slipNo">Slip No</Label>
                <Input
                  id="slipNo"
                  name="slipNo"
                  value={formData.slipNo}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              
              <div>
                <Label htmlFor="netWeight">Net Weight</Label>
                <Input
                  id="netWeight"
                  name="netWeight"
                  value={formData.netWeight}
                  onChange={handleChange}
                  className="bg-yellow-100"
                />
              </div>

              <div>
                <Label htmlFor="freight">Freight</Label>
                <Input
                  id="freight"
                  name="freight"
                  value={formData.freight}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Add remarks"
                  rows={3}
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstWeight">First Weight</Label>
                <Input
                  id="firstWeight"
                  name="firstWeight"
                  value={formData.firstWeight}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="secondWeight">Second Weight</Label>
                <Input
                  id="secondWeight"
                  name="secondWeight"
                  value={formData.secondWeight}
                  onChange={handleChange}
                  className="text-green-600"
                />
              </div>

              <div>
                <Label htmlFor="bardanaWeight">Bardana Weight</Label>
                <Input
                  id="bardanaWeight"
                  name="bardanaWeight"
                  value={formData.bardanaWeight}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="grossWeight">Gross Weight</Label>
                <Input
                  id="grossWeight"
                  name="grossWeight"
                  value={formData.grossWeight}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Select onValueChange={(value) => handleSelectChange('branchId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Branch 1</SelectItem>
                    <SelectItem value="2">Branch 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  placeholder="Enter driver name"
                />
              </div>

              <div>
                <Label htmlFor="slipInTime">Date & Time</Label>
                <Input
                  id="slipInTime"
                  name="slipInTime"
                  type="datetime-local"
                  value={formData.slipInTime}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button className="bg-green-600 hover:bg-green-700">1st WHT</Button>
                <Button variant="outline">2nd WHT</Button>
                <Button variant="outline" onClick={resetForm}>Clear</Button>
                <Button variant="destructive">Exit</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="purchase" className="mb-4">
        <TabsList>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Purchase Column 1 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bardanaType">Bardana Type</Label>
                    <Input
                      id="bardanaType"
                      name="bardanaType"
                      value={formData.bardanaType}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightPerBags">Wt Per Bag</Label>
                    <Input
                      id="weightPerBags"
                      name="weightPerBags"
                      value={formData.weightPerBags}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="noOfBags">No Of Bags</Label>
                    <Input
                      id="noOfBags"
                      name="noOfBags"
                      value={formData.noOfBags}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="qualityDeduction">Quality Deduction</Label>
                    <Input
                      id="qualityDeduction"
                      name="qualityDeduction"
                      value={formData.qualityDeduction}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Purchase Column 2 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="igpNo">IGP No</Label>
                    <Input
                      id="igpNo"
                      name="igpNo"
                      value={formData.igpNo}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="igpDate">IGP Date</Label>
                    <Input
                      id="igpDate"
                      name="igpDate"
                      type="date"
                      value={formData.igpDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleNo">Vehicle No</Label>
                    <Input
                      id="vehicleNo"
                      name="vehicleNo"
                      value={formData.vehicleNo}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Purchase Column 3 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supplierWeight">Supplier's Weight</Label>
                    <Input
                      id="supplierWeight"
                      name="supplierWeight"
                      value={formData.supplierWeight}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supWeightWithoutBardana">Sup.Wt - Bardana</Label>
                    <Input
                      id="supWeightWithoutBardana"
                      name="supWeightWithoutBardana"
                      value={formData.supWeightWithoutBardana}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Button variant="outline" className="w-full bg-yellow-100">
                      Deduction +
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sale">
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-gray-500">Sale functionality coming soon</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offline">
          <Card>
            <CardContent className="p-4">
              <div className="text-center text-gray-500">Offline functionality coming soon</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 p-2">Po No</th>
                  <th className="border border-gray-300 p-2">Item Code</th>
                  <th className="border border-gray-300 p-2">Item Description</th>
                  <th className="border border-gray-300 p-2">Po Qty</th>
                  <th className="border border-gray-300 p-2">IGP Qty</th>
                  <th className="border border-gray-300 p-2">Balance Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 text-center" colSpan={6}>
                    No data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseEntry;