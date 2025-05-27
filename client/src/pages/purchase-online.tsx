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
    <div className="h-full overflow-auto bg-blue-50 p-4">
      {/* Top Bar Buttons */}
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
            Save
          </Button>
          <Button variant="outline" size="sm">Print</Button>
          <Button variant="outline" size="sm">Rej</Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={onlineMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleOnlineMode(true)}
            className="bg-gray-800"
          >
            ONLINE
          </Button>
          <Button 
            variant={!onlineMode ? "default" : "outline"}
            size="sm"
            onClick={() => toggleOnlineMode(false)}
            className="bg-gray-800"
          >
            OFFLINE
          </Button>
        </div>

        <div className="text-4xl text-green-600 font-bold">
          2500
        </div>
      </div>

      {/* Main Form Section */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-6 gap-4 mb-4">
            {/* Column 1 - Slip & Weight Info */}
            <div className="space-y-3">
              <div>
                <Label>Slip No</Label>
                <Input 
                  name="slipNo" 
                  value={formData.slipNo} 
                  readOnly 
                  className="bg-gray-100"
                />
              </div>
              
              <div>
                <Label className="text-orange-600">Net Weight</Label>
                <Input 
                  name="netWeight" 
                  value={formData.netWeight} 
                  onChange={handleChange}
                  className="bg-yellow-100 border-yellow-400"
                />
              </div>
              
              <div>
                <Label>Freight</Label>
                <Input 
                  name="freight" 
                  value={formData.freight} 
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label>Remarks</Label>
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Add remarks"
                  className="h-12"
                />
              </div>
            </div>

            {/* Column 2 - Weights */}
            <div className="space-y-3">
              <div>
                <Label>First Weight</Label>
                <Input 
                  name="firstWeight" 
                  value={formData.firstWeight} 
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label>Second Weight</Label>
                <Input 
                  name="secondWeight" 
                  value={formData.secondWeight} 
                  onChange={handleChange}
                  className="text-green-600"
                />
              </div>
              
              <div>
                <Label>Bardana Weight</Label>
                <Input 
                  name="bardanaWeight" 
                  value={formData.bardanaWeight} 
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Column 3 - PO & Vehicle */}
            <div className="space-y-3">
              <div>
                <Label>PO No</Label>
                <Input 
                  name="po_no" 
                  value={formData.po_no} 
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label>Vehicle No</Label>
                <Input 
                  name="vehicleNo" 
                  value={formData.vehicleNo} 
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label>Gross Weight</Label>
                <Input 
                  name="grossWeight" 
                  value={formData.grossWeight} 
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Column 4 - Branch & Driver */}
            <div className="space-y-3">
              <div>
                <Label>Branch</Label>
                <Select 
                  value={formData.branch} 
                  onValueChange={(value) => handleSelectChange('branch', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Branch 1">Branch 1</SelectItem>
                    <SelectItem value="Branch 2">Branch 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Driver Name</Label>
                <Input 
                  name="driverName" 
                  value={formData.driverName} 
                  onChange={handleChange}
                  placeholder="Enter driver name"
                />
              </div>
              
              <div>
                <Label>Date & Time</Label>
                <Input 
                  value={new Date().toLocaleString()} 
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              
              {/* Weight Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={captureFirstWeight}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    size="sm"
                  >
                    1st WHT
                  </Button>
                  <Button 
                    onClick={captureSecondWeight}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    2nd WHT
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white flex-1"
                    size="sm"
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    Exit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="purchase" className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchase">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-6">
                {/* Column 1 */}
                <div className="space-y-3">
                  <div>
                    <Label>Bardana Type</Label>
                    <Input name="bardanaType" value={formData.bardanaType} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Wt Per Bag</Label>
                    <Input name="wtPerBag" value={formData.wtPerBag} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>No Of Bags</Label>
                    <Input name="noOfBags" value={formData.noOfBags} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Bardana Wht</Label>
                    <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Quality Ded</Label>
                    <Input name="qualityDed" value={formData.qualityDed} onChange={handleChange} />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-3">
                  <div>
                    <Label>IGP No</Label>
                    <Input
                      name="igpNo"
                      value={formData.igpNo}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchIgpData();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label>IGP Date</Label>
                    <Input name="igpDate" value={formData.igpDate} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Vendor</Label>
                    <Input name="vendor" value={formData.vendor} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Vehicle No</Label>
                    <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label>Weight</Label>
                      <Input name="weight" value={formData.weight} onChange={handleChange} />
                    </div>
                    <div>
                      <Label>% Bags</Label>
                      <Input name="bags" value={formData.bags} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="space-y-3">
                  <div>
                    <Label>Supp's Weight</Label>
                    <Input name="superweight" value={formData.superweight} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>Sup.Wt - Bardana</Label>
                    <Input name="supWtBardana" value={formData.supWtBardana} onChange={handleChange} />
                  </div>
                  <div>
                    <Label>S.Wts - Our Wt</Label>
                    <Input name="swtsOurWt" value={formData.swtsOurWt} onChange={handleChange} />
                  </div>
                  <div className="pt-4">
                    <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
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
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Sale tab content here</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="offline">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Offline tab content here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-center">Po</th>
                  <th className="border p-2 text-center">Item Code</th>
                  <th className="border p-2 text-center">Item Description</th>
                  <th className="border p-2 text-center">Po Qty</th>
                  <th className="border p-2 text-center">IgP Qty</th>
                  <th className="border p-2 text-center">Balance Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2 text-center">&nbsp;</td>
                  <td className="border p-2 text-center">&nbsp;</td>
                  <td className="border p-2 text-center">&nbsp;</td>
                  <td className="border p-2 text-center">&nbsp;</td>
                  <td className="border p-2 text-center">&nbsp;</td>
                  <td className="border p-2 text-center">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOnline;