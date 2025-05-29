import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

const PurchaseForm = () => {
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
  };

  const initialItemData = {
    wb_item_p_id: '',
    wb_id: '',
    manual_dc_no: '',
    do_id: '',
    do_no: '',
    customer_id: '',
    customer_name: '',
    vehicle_no: '',
    do_date: '',
    item_id: '',
    item_code: '',
    item_desc: '',
    created_by: '',
    creation_date: '',
    last_updated_by: '',
    last_updated_date: '',
    po_id: '',
    po_no: '',
    po_qty: '',
    igp_qty: '',
    balance_qty: '',
    bardana_type: '',
    igp_no: '',
    manual_igp_no: '',
    igp_id: '',
    vendor_id: '',
    vendor_name: '',
    no_of_bags: '',
    weight_per_bags: '',
    bardana_weight: '',
    igp_date: '',
    quality_deduction: '',
    supplier_weight: '',
    sup_weight_wthout_bardana: '',
    net_supplier_weight: '',
    bag_condition: '',
    bardana_type_id: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [itemData, setItemData] = useState(initialItemData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);
  const [igpItems, setIgpItems] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Handle changes for master form inputs
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle changes for item details inputs
  const handleItemChange = (field: string, value: string) => {
    setItemData(prev => ({ ...prev, [field]: value }));
  };

  // Toggle online/offline
  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  useEffect(() => {
    // Fetch max slip no logic
    fetch('/api/purchases')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const maxSlip = data.reduce((max: number, curr: any) => {
            const slip = parseInt(curr.slip_no, 10);
            return slip > max ? slip : max;
          }, 0);
          const nextSlip = (maxSlip + 1).toString();
          setFormData(prev => ({ ...prev, slipNo: nextSlip }));
        } else {
          setFormData(prev => ({ ...prev, slipNo: '1' }));
        }
      })
      .catch(err => {
        console.error('Error fetching purchases:', err);
      });

    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: now.slice(0, 16),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));

    toggleOnlineMode(true);
  }, []);

  // Reset all forms
  const resetForm = () => {
    setFormData(initialFormData);
    setItemData(initialItemData);
    toggleOnlineMode(true);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Prepare master data exactly as your working index.js expects
      const payload = {
        slip_no: formData.slipNo || null,
        slip_in_time: formData.slipInTime || null,
        first_weight: formData.firstWeight ? parseFloat(formData.firstWeight) : null,
        second_weight: formData.secondWeight ? parseFloat(formData.secondWeight) : null,
        net_weight: formData.netWeight ? parseFloat(formData.netWeight) : null,
        bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
        gross_weight: formData.grossWeight ? parseFloat(formData.grossWeight) : null,
        freight: formData.freight ? parseFloat(formData.freight) : null,
        remarks: formData.remarks || null,
        driver_name: formData.driverName || null,
        vendor: formData.vendor || null,
        vehicle_no: formData.vehicleNo || null,
        igp_no: formData.igpNo || null,
        entry_type: 'PURCHASE',
        online_entry: onlineMode ? 'Yes' : 'No',
        purchase_items: purchaseItems.map((item: any) => ({
          wb_item_p_id: item.wb_item_p_id ? parseInt(item.wb_item_p_id, 10) : null,
          manual_dc_no: item.manual_dc_no || null,
          do_id: item.do_id ? parseInt(item.do_id, 10) : null,
          item_id: item.item_id ? parseInt(item.item_id, 10) : null,
          item_desc: item.item_desc || null,
          created_by: item.created_by ? parseInt(item.created_by, 10) : null,
          creation_date: item.creation_date || null,
          last_updated_by: item.last_updated_by ? parseInt(item.last_updated_by, 10) : null,
          last_updated_date: item.last_updated_date || null,
          po_id: item.po_id ? parseInt(item.po_id, 10) : null,
          po_no: item.po_no || null,
          po_qty: item.po_qty ? parseFloat(item.po_qty) : null,
          igp_qty: item.igp_qty ? parseFloat(item.igp_qty) : null,
          balance_qty: item.balance_qty ? parseFloat(item.balance_qty) : null,
          bardana_type: item.bardana_type || null,
          igp_no: item.igp_no || null,
          manual_igp_no: item.manual_igp_no || null,
          igp_id: item.igp_id ? parseInt(item.igp_id, 10) : null,
          vendor_id: item.vendor_id ? parseInt(item.vendor_id, 10) : null,
          vendor_name: item.vendor_name || null,
          no_of_bags: item.no_of_bags ? parseInt(item.no_of_bags, 10) : null,
          weight_per_bags: item.weight_per_bags ? parseFloat(item.weight_per_bags) : null,
          bardana_weight: item.bardana_weight ? parseFloat(item.bardana_weight) : null,
          igp_date: item.igp_date || null,
          quality_deduction: item.quality_deduction ? parseFloat(item.quality_deduction) : null,
          supplier_weight: item.supplier_weight ? parseFloat(item.supplier_weight) : null,
          sup_weight_wthout_bardana: item.sup_weight_wthout_bardana ? parseFloat(item.sup_weight_wthout_bardana) : null,
          net_supplier_weight: item.net_supplier_weight ? parseFloat(item.net_supplier_weight) : null,
          bag_condition: item.bag_condition || null,
          bardana_type_id: item.bardana_type_id ? parseInt(item.bardana_type_id, 10) : null,
        }))
      };

      // POST payload to backend
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        console.log('Data saved:', result);
        alert('Data saved successfully!');
        resetForm();
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Top Bar Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline">Purc</Button>
              <Button variant="outline">Sale</Button>
              <Button variant="outline">Edit</Button>
              <Button variant="outline">|&lt; First</Button>
              <Button variant="outline">&lt; Prev</Button>
              <Button variant="outline">Next &gt;</Button>
              <Button variant="outline">Last &gt;|</Button>
              <Button 
                onClick={handleSaveAll} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Saving...' : 'Save All'}
              </Button>
              <Button variant="outline">Print</Button>
              <Button variant="outline">Rej</Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={onlineMode ? "default" : "outline"}
                onClick={() => toggleOnlineMode(true)}
              >
                ONLINE
              </Button>
              <Button 
                variant={!onlineMode ? "default" : "outline"}
                onClick={() => toggleOnlineMode(false)}
              >
                OFFLINE
              </Button>
            </div>
            <div className="text-3xl font-bold text-green-600">2500</div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form Section */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <Label>Slip No</Label>
                <Input
                  value={formData.slipNo}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              
              <div>
                <Label>Net Weight</Label>
                <Input
                  value={formData.netWeight}
                  onChange={(e) => handleChange('netWeight', e.target.value)}
                  className="bg-yellow-100"
                />
              </div>
              
              <div>
                <Label>Freight</Label>
                <Input
                  value={formData.freight}
                  onChange={(e) => handleChange('freight', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  placeholder="Add remarks"
                  className="h-20"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <Label>First Weight</Label>
                <Input
                  value={formData.firstWeight}
                  onChange={(e) => handleChange('firstWeight', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Second Weight</Label>
                <Input
                  value={formData.secondWeight}
                  onChange={(e) => handleChange('secondWeight', e.target.value)}
                  className="text-green-600"
                />
              </div>
              
              <div>
                <Label>Bardana Weight</Label>
                <Input
                  value={formData.bardanaWeight}
                  onChange={(e) => handleChange('bardanaWeight', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Gross Weight</Label>
                <Input
                  value={formData.grossWeight}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4">
              <div>
                <Label>Branch</Label>
                <Select value={formData.branchId} onValueChange={(value) => handleChange('branchId', value)}>
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
                <Label>Driver Name</Label>
                <Input
                  value={formData.driverName}
                  onChange={(e) => handleChange('driverName', e.target.value)}
                  placeholder="Enter driver name"
                />
              </div>
              
              <div>
                <Label>Vendor</Label>
                <Input
                  value={formData.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  placeholder="Enter vendor"
                />
              </div>
              
              <div>
                <Label>Vehicle No</Label>
                <Input
                  value={formData.vehicleNo}
                  onChange={(e) => handleChange('vehicleNo', e.target.value)}
                  placeholder="Enter vehicle number"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* IGP Section */}
      <Card>
        <CardHeader>
          <CardTitle>IGP Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Label>IGP No</Label>
              <Input
                value={formData.igpNo}
                onChange={(e) => handleChange('igpNo', e.target.value)}
                placeholder="Enter IGP No"
              />
            </div>
            <Button className="mt-6">Fetch IGP Data</Button>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Tab */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="purchase" className="w-full">
            <TabsList>
              <TabsTrigger value="purchase">Purchase</TabsTrigger>
            </TabsList>
            <TabsContent value="purchase" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>PO No</Label>
                  <Input
                    value={formData.po_no}
                    onChange={(e) => handleChange('po_no', e.target.value)}
                    placeholder="Enter PO No"
                  />
                </div>
                <div>
                  <Label>Item Code</Label>
                  <Input
                    value={itemData.item_code}
                    onChange={(e) => handleItemChange('item_code', e.target.value)}
                    placeholder="Enter item code"
                  />
                </div>
                <div>
                  <Label>Item Description</Label>
                  <Input
                    value={itemData.item_desc}
                    onChange={(e) => handleItemChange('item_desc', e.target.value)}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    value={itemData.po_qty}
                    onChange={(e) => handleItemChange('po_qty', e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
              </div>
              <Button variant="outline">Add Item</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseForm;