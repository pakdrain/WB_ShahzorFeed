import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const PurchaseOnline = () => {
  const { toast } = useToast();
  
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
    branch: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);

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
      'companyId', 'branchId', 'createdBy', 'lastUpdatedBy',
      'wtPerBag', 'noOfBags', 'qualityDed', 'weight', 'bags',
      'superweight', 'supWtBardana', 'swtsOurWt'
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
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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

  // Fetch IGP data
  const fetchIgpData = async () => {
    if (!formData.igpNo) {
      toast({
        title: 'Error',
        description: 'Please enter IGP No',
        variant: 'destructive',
      });
      return;
    }
    
    // Note: This would need your actual API endpoint
    toast({
      title: 'Info',
      description: 'IGP data fetch functionality ready - please provide your API endpoint',
    });
  };

  // On mount, set default timestamps
  useEffect(() => {
    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipNo: '1', // Default slip number
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));

    toggleOnlineMode(true);
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    toggleOnlineMode(true);
  };

  // Handle save
  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Note: This would connect to your actual API endpoint
      toast({
        title: 'Success',
        description: 'Purchase form ready - please configure your API endpoint',
      });
      console.log('Form data:', formData);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save purchase.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Weight capture functions
  const captureFirstWeight = () => {
    // This would get weight from your weight system
    toast({
      title: 'Weight Captured',
      description: 'First weight captured from scale',
    });
  };

  const captureSecondWeight = () => {
    // This would get weight from your weight system
    toast({
      title: 'Weight Captured',
      description: 'Second weight captured from scale',
    });
  };

  return (
    <div className="h-full overflow-auto bg-gray-100 p-4">
      {/* Top Bar Buttons */}
      <div className="flex justify-between items-center bg-white border rounded p-2 mb-3">
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">Purc</Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">Sale</Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">Edit</Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">|&lt; First</Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">&lt; Prev</Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">Next &gt;</Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">Last &gt;|</Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-green-700 hover:bg-green-800 px-3 py-1 text-sm text-white"
          >
            Save
          </Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">Print</Button>
          <Button variant="outline" size="sm" className="px-3 py-1 text-sm">Rej</Button>
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant={onlineMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleOnlineMode(true)}
            className="bg-gray-900 text-white px-4 py-1 text-sm"
          >
            ONLINE
          </Button>
          <Button 
            variant={!onlineMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleOnlineMode(false)}
            className="bg-gray-900 text-white px-4 py-1 text-sm"
          >
            OFFLINE
          </Button>
        </div>

        <div className="text-3xl text-green-600 font-bold">
          2500
        </div>
      </div>

      {/* Main Form Section */}
      <div className="bg-white border rounded p-4 mb-3">
        <div className="grid grid-cols-4 gap-6">
          {/* Column 1 - Left */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Slip No</Label>
              <Input 
                name="slipNo" 
                value={formData.slipNo} 
                readOnly 
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Net Weight</Label>
              <Input 
                name="netWeight" 
                value={formData.netWeight} 
                onChange={handleChange}
                className="h-8 text-sm bg-yellow-400 border-yellow-500 font-semibold"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Freight</Label>
              <Input 
                name="freight" 
                value={formData.freight} 
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Add remarks</Label>
              <Textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder=""
                className="h-16 text-sm resize-none"
              />
            </div>
          </div>

          {/* Column 2 - Middle Left */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">First Weight</Label>
              <Input 
                name="firstWeight" 
                value={formData.firstWeight} 
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Second Weight</Label>
              <Input 
                name="secondWeight" 
                value={formData.secondWeight} 
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Bardana Weight</Label>
              <Input 
                name="bardanaWeight" 
                value={formData.bardanaWeight} 
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Gross Weight</Label>
              <Input 
                name="grossWeight" 
                value={formData.grossWeight} 
                readOnly
                className="h-8 text-sm bg-gray-100"
              />
            </div>
          </div>

          {/* Column 3 - Middle Right */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Branch</Label>
              <Select 
                value={formData.branch} 
                onValueChange={(value) => handleSelectChange('branch', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Branch 1">Branch 1</SelectItem>
                  <SelectItem value="Branch 2">Branch 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Driver Name</Label>
              <Input 
                name="driverName" 
                value={formData.driverName} 
                onChange={handleChange}
                placeholder="Enter driver name"
                className="h-8 text-sm"
              />
            </div>
            
            <div>
              <Label className="text-sm text-gray-600 mb-1 block">Date & Time</Label>
              <Input 
                value="30-04-25 09:10:30 AM" 
                readOnly
                className="h-8 text-sm bg-gray-100"
              />
            </div>
            
            {/* Weight Buttons */}
            <div className="space-y-2 mt-4">
              <div className="flex gap-2">
                <Button 
                  onClick={captureFirstWeight}
                  className="bg-green-600 hover:bg-green-700 flex-1 h-8 text-sm text-white"
                >
                  1st WHT
                </Button>
                <Button 
                  onClick={captureSecondWeight}
                  className="bg-gray-500 hover:bg-gray-600 flex-1 h-8 text-sm text-white"
                >
                  2nd WHT
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={resetForm}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white flex-1 h-8 text-sm"
                >
                  Clear
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white flex-1 h-8 text-sm"
                >
                  Exit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white border rounded mb-3">
        <Tabs defaultValue="purchase" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-blue-100 rounded-none">
            <TabsTrigger value="purchase" className="text-sm">Purchase</TabsTrigger>
            <TabsTrigger value="sale" className="text-sm">Sale</TabsTrigger>
            <TabsTrigger value="offline" className="text-sm">Offline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchase" className="p-4">
            <div className="grid grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Bardana Type</Label>
                  <Input name="bardanaType" value={formData.bardanaType} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Wt Per Bag</Label>
                  <Input name="wtPerBag" value={formData.wtPerBag} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">No Of Bags</Label>
                  <Input name="noOfBags" value={formData.noOfBags} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Bardana Wht</Label>
                  <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Quality Ded</Label>
                  <Input name="qualityDed" value={formData.qualityDed} onChange={handleChange} className="h-8 text-sm" />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">IGP No</Label>
                  <Input
                    name="igpNo"
                    value={formData.igpNo}
                    onChange={handleChange}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') {
                        fetchIgpData();
                      }
                    }}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">IGP Date</Label>
                  <Input name="igpDate" value={formData.igpDate} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Vendor</Label>
                  <Input name="vendor" value={formData.vendor} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Vehicle No</Label>
                  <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <Label className="text-sm text-gray-600 mb-1 block">Weight</Label>
                    <Input name="weight" value={formData.weight} onChange={handleChange} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600 mb-1 block">% Bags</Label>
                    <Input name="bags" value={formData.bags} onChange={handleChange} className="h-8 text-sm" />
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Supp's Weight</Label>
                  <Input name="superweight" value={formData.superweight} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Sup.Wt - Bardana</Label>
                  <Input name="supWtBardana" value={formData.supWtBardana} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">S.Wts - Our Wt</Label>
                  <Input name="swtsOurWt" value={formData.swtsOurWt} onChange={handleChange} className="h-8 text-sm" />
                </div>
                <div className="pt-4">
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black h-8 text-sm font-semibold">
                    Deduction +
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sale" className="p-8 text-center">
            <p className="text-gray-500">Sale tab content here</p>
          </TabsContent>
          
          <TabsContent value="offline" className="p-8 text-center">
            <p className="text-gray-500">Offline tab content here</p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Data Table */}
      <div className="bg-white border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="border-r p-2 text-center font-medium">Po No</th>
              <th className="border-r p-2 text-center font-medium">Item Code</th>
              <th className="border-r p-2 text-center font-medium">Item Description</th>
              <th className="border-r p-2 text-center font-medium">Po Qty</th>
              <th className="border-r p-2 text-center font-medium">IgP Qty</th>
              <th className="p-2 text-center font-medium">Balance Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-12">
              <td className="border-r p-2 text-center">&nbsp;</td>
              <td className="border-r p-2 text-center">&nbsp;</td>
              <td className="border-r p-2 text-center">&nbsp;</td>
              <td className="border-r p-2 text-center">&nbsp;</td>
              <td className="border-r p-2 text-center">&nbsp;</td>
              <td className="p-2 text-center">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOnline;