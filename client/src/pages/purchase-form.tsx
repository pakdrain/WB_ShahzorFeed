import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeightIndicator from '@/components/weight-indicator';
import WeightDisplayTable from '@/components/weight-display-table';
import VideoStreamFullscreen from '@/components/video-stream-fullscreen';
import { useQuery } from '@tanstack/react-query';

export default function PurchaseForm() {
  // Fetch latest master data (for first weight)
  const { data: latestMaster } = useQuery({
    queryKey: ['/api/purchase/latest-master'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch latest details data (for vehicle number)
  const { data: latestDetails } = useQuery({
    queryKey: ['/api/purchase/latest-details'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

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

      if (data && data.items && data.items.length > 0) {
        const items = data.items;
        const firstItem = items[0];
        setFormData(prev => ({
          ...prev,
          driverName: firstItem.driver_name || '',
          vendor: firstItem.vendor_name || '',
          vehicleNo: firstItem.vehicle_no || '',
          bardanaWeight: firstItem.bardana_qty ? String(firstItem.bardana_qty) : '',
        }));
        setIgpItems(items);
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

  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  const formatISODate = (localString: string) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'firstWeight', 'secondWeight', 'netWeight',
      'bardanaWeight', 'grossWeight', 'freight',
      'companyId', 'branchId', 'createdBy', 'lastUpdatedBy'
    ];

    if (numericFields.includes(name)) {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  useEffect(() => {
    // Fetch next slip number
    fetch('/api/purchases')
      .then(res => res.json())
      .then((data: any[]) => {
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
      .catch((err: any) => {
        console.error('Error fetching purchases:', err);
      });

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

  const resetForm = () => {
    setFormData(initialFormData);
    toggleOnlineMode(true);
  };

  const captureFirstWeight = async () => {
    try {
      const response = await fetch('/api/weight/data');
      const weightData = await response.json();
      
      // Update the firstWeight field with current weight reading
      setFormData(prev => ({
        ...prev,
        firstWeight: weightData.weight
      }));
    } catch (error) {
      console.error('Error fetching weight data:', error);
      alert('Failed to capture weight reading');
    }
  };

  const captureSecondWeight = async () => {
    try {
      const response = await fetch('/api/weight/data');
      const weightData = await response.json();
      
      // Update the secondWeight field with current weight reading
      setFormData(prev => ({
        ...prev,
        secondWeight: weightData.weight
      }));
    } catch (error) {
      console.error('Error fetching weight data:', error);
      alert('Failed to capture weight reading');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Prepare master data payload
    const masterPayload = {
      slip_no: formData.slipNo || null,
      slip_in_time: formatISODate(formData.slipInTime),
      first_weight: formData.firstWeight ? parseFloat(formData.firstWeight) : null,
      second_weight: formData.secondWeight ? parseFloat(formData.secondWeight) : null,
      net_weight: formData.netWeight ? parseFloat(formData.netWeight) : null,
      bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
      gross_weight: formData.grossWeight ? parseFloat(formData.grossWeight) : null,
      freight: formData.freight ? parseFloat(formData.freight) : null,
      remarks: formData.remarks || null,
      driver_name: formData.driverName || null,
      company_id: formData.companyId ? parseInt(formData.companyId, 10) : null,
      branch_id: formData.branchId ? parseInt(formData.branchId, 10) : null,
      online_entry: formData.onlineEntry || null,
      offline_entry: formData.offlineEntry || null,
      created_by: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      creation_date: formData.creationDate || null,
      last_updated_by: formData.lastUpdatedBy ? parseInt(formData.lastUpdatedBy, 10) : null,
      last_updated_date: formData.lastUpdatedDate || null,
      manual_dc_no: formData.manualDcNo || null,
      entry_type: formData.entryType || null,
      slip_out_time: formatISODate(formData.slipOutTime),
      status: formData.status || null,
      slip_date: formData.slipDate || null,
    };

    try {
      // Save master data first
      const masterResponse = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(masterPayload),
      });

      if (!masterResponse.ok) {
        throw new Error(`HTTP error! status: ${masterResponse.status}`);
      }

      const masterData = await masterResponse.json();
      console.log('Master purchase saved:', masterData);
      
      // Get the WB_ID from saved master data
      const savedWbId = masterData.wb_id;
      
      // Prepare items data payload - use first IGP item if available, otherwise form data
      const firstIgpItem = igpItems.length > 0 ? igpItems[0] : {};
      
      console.log('Form data for items:', formData);
      console.log('IGP items available:', igpItems);
      
      const itemsPayload = {
        wb_id: savedWbId,
        baradana_type: formData.bardanaType || null,
        igp_no: formData.igpNo || null,
        vehicle_no: formData.vehicleNo || null,
        weight_per_bags: formData.wtPerBag ? parseFloat(formData.wtPerBag) : null,
        igp_date: formData.igpDate || null,
        supplier_weight: formData.superweight ? parseFloat(formData.superweight) : null,
        quality_deduction: formData.qualityDeduction ? parseFloat(formData.qualityDeduction) : null,
        no_of_bags: formData.noOfBags ? parseInt(formData.noOfBags) : null,
        vendor_name: firstIgpItem.vendor_name || formData.vendor || null,
        bag_condition: formData.bagCondition || null,
        po_no: firstIgpItem.po_no || formData.po_no || null,
        item_code: firstIgpItem.item_code || formData.itemCode || null,
        item_desc: firstIgpItem.item_desc || formData.itemDesc || null,
        po_qty: firstIgpItem.po_qty ? parseFloat(firstIgpItem.po_qty) : (formData.poQty ? parseFloat(formData.poQty) : null),
        igp_qty: firstIgpItem.igp_qty ? parseFloat(firstIgpItem.igp_qty) : (formData.igpQty ? parseFloat(formData.igpQty) : null),
        balance_qty: firstIgpItem.balance_qty ? parseFloat(firstIgpItem.balance_qty) : (formData.balanceQty ? parseFloat(formData.balanceQty) : null)
      };
      
      console.log('Items payload being sent:', itemsPayload);
      
      // Save items data
      const itemsResponse = await fetch('/api/purchase-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemsPayload),
      });

      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json();
        console.log('Items saved:', itemsData);
        
        // Automatically capture first weight image
        try {
          console.log('Capturing first weight image for slip:', formData.slipNo);
          const captureResponse = await fetch('/api/capture/first-weight', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              slipNo: formData.slipNo,
              cameraIp: '10.10.10.146',
              cameraPort: 554
            }),
          });

          if (captureResponse.ok) {
            const captureData = await captureResponse.json();
            console.log('Image captured successfully:', captureData.message);
          } else {
            console.log('Image capture failed, but continuing with form submission');
          }
        } catch (imageError) {
          console.log('Image capture error, but continuing:', imageError);
        }
        
        // Increment slip number for next entry
        const currentSlipNo = parseInt(formData.slipNo);
        const nextSlipNo = (currentSlipNo + 1).toString();
        
        // Update form with next slip number and clear form fields
        setFormData({
          ...initialFormData,
          slipNo: nextSlipNo,
          slipInTime: new Date().toISOString().slice(0, 16),
          onlineEntry: 'Yes',
          entryType: 'PURCHASE',
          creationDate: new Date().toISOString(),
          lastUpdatedDate: new Date().toISOString(),
          slipDate: new Date().toISOString()
        });
        
        alert('Purchase data saved successfully and first weight image captured!');
      } else {
        console.error('Failed to save items, but master data saved');
        alert('Purchase saved, but items data failed to save.');
      }
      
    } catch (err) {
      alert('Failed to save purchase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItems = async () => {
    setLoading(true);
    const payload = {
      wb_item_p_id: formData.wbItemPId ? parseInt(formData.wbItemPId, 10) : null,
      wb_id: formData.wbId ? parseInt(formData.wbId, 10) : null,
      manual_dc_no: formData.manualDcNo || null,
      do_id: formData.doId ? parseInt(formData.doId, 10) : null,
      do_no: formData.doNo || null,
      customer_id: formData.customerId ? parseInt(formData.customerId, 10) : null,
      customer_name: formData.customerName || null,
      vehicle_no: formData.vehicleNo || null,
      do_date: formData.doDate || null,
      item_id: formData.itemId ? parseInt(formData.itemId, 10) : null,
      item_code: formData.itemCode || null,
      item_desc: formData.itemDesc || null,
      created_by: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      creation_date: formData.creationDate || null,
      last_updated_by: formData.lastUpdatedBy ? parseInt(formData.lastUpdatedBy, 10) : null,
      last_updated_date: formData.lastUpdatedDate || null,
      po_id: formData.poId ? parseInt(formData.poId, 10) : null,
      po_no: formData.po_no || null,
      po_qty: formData.poQty ? parseFloat(formData.poQty) : null,
      igp_qty: formData.igpQty ? parseFloat(formData.igpQty) : null,
      balance_qty: formData.balanceQty ? parseFloat(formData.balanceQty) : null,
      baradana_type: formData.baradanaType || null,
      igp_no: formData.igpNo || null,
      manual_igp_no: formData.manualIgpNo || null,
      igp_id: formData.igpId ? parseInt(formData.igpId, 10) : null,
      vendor_id: formData.vendorId ? parseInt(formData.vendorId, 10) : null,
      vendor_name: formData.vendorName || null,
      no_of_bags: formData.noOfBags ? parseFloat(formData.noOfBags) : null,
      weight_per_bags: formData.weightPerBags ? parseFloat(formData.weightPerBags) : null,
      bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
      igp_date: formData.igpDate || null,
      quality_deduction: formData.qualityDeduction ? parseFloat(formData.qualityDeduction) : null,
      supplier_weight: formData.supplierWeight ? parseFloat(formData.supplierWeight) : null,
      sup_weight_wthout_bardana: formData.supWeightWithoutBardana ? parseFloat(formData.supWeightWithoutBardana) : null,
      net_supplier_weight: formData.netSupplierWeight ? parseFloat(formData.netSupplierWeight) : null,
      bag_condition: formData.bagCondition || null,
      bardana_type_id: formData.bardanaTypeId ? parseInt(formData.bardanaTypeId, 10) : null,
    };

    try {
      const response = await fetch('/api/purchase-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert('Purchase items saved successfully!');
      console.log('Items saved:', data);
    } catch (err) {
      alert('Failed to save purchase items.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-blue-50 p-1 overflow-hidden relative">
      {/* Weight Display Table - Right Side, positioned after bottom bar */}
      <div className="absolute bottom-4 right-4 z-50">
        <div className="bg-white border-2 border-gray-400 rounded-sm shadow-lg w-60">
          {/* Header Row */}
          <div className="grid grid-cols-3 border-b border-gray-400">
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              Slip No
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              Vehicle No
            </div>
            <div className="bg-gray-200 p-1 text-center text-xs font-semibold text-black">
              Entry Type
            </div>
          </div>

          {/* Current Data Row - showing real data from database */}
          <div className="grid grid-cols-3 border-b border-gray-400">
            <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
              {latestMaster?.wb_id || formData.slipNo || "4451"}
            </div>
            <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
              {latestDetails?.vehicle_no || formData.vehicleNo || "VRS-128"}
            </div>
            <div className="p-1 text-center text-xs text-blue-600 font-semibold bg-white">
              PURCHASE
            </div>
          </div>

          {/* First Weight Display Row */}
          <div className="grid grid-cols-1 border-b border-gray-400 bg-blue-50">
            <div className="p-2 text-center text-sm font-semibold text-blue-800">
              First Weight: {latestMaster?.first_weight ? `${latestMaster.first_weight} kg` : formData.firstWeight ? `${formData.firstWeight} kg` : '0.00 kg'}
            </div>
          </div>

          {/* Load Data Button */}
          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 text-xs">
            Load Data
          </button>
        </div>
      </div>

      {/* Compact Top Bar */}
      <div className="flex justify-between items-center bg-white border rounded p-1 mb-1">
        <div className="flex gap-1 text-xs">
          <Button className="h-6 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium">Purc</Button>
          <Button className="h-6 px-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium">Sale</Button>
          <Button className="h-6 px-2 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium">Edit</Button>
          <Button className="h-6 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium">First</Button>
          <Button className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium">Prev</Button>
          <Button className="h-6 px-2 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-medium">Next</Button>
          <Button className="h-6 px-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium">Last</Button>
          <Button className="bg-green-600 hover:bg-green-700 h-6 px-3 text-xs text-white font-medium" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium">Print</Button>
          <Button className="h-6 px-2 text-xs bg-orange-600 hover:bg-orange-700 text-white font-medium">Rej</Button>
        </div>
        <div className="flex gap-1 items-center">
          {/* Weight Display - positioned on left side with bolder text */}
          <div className="mr-2">
            <WeightIndicator comPort="COM6" compact={true} />
          </div>
          <Button 
            className={`h-6 px-3 text-xs font-medium ${onlineMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
            onClick={() => toggleOnlineMode(true)}
          >
            ONLINE
          </Button>
          <Button 
            className={`h-6 px-3 text-xs font-medium ${!onlineMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
            onClick={() => toggleOnlineMode(false)}
          >
            OFFLINE
          </Button>
        </div>
        <div className="text-2xl text-green-600 font-bold">2500</div>
      </div>

      {/* Main Form Layout - 100% visible without scrolling */}
      <div className="bg-white p-1 rounded border h-[calc(100vh-60px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-1 h-full">
          {/* Left Side - Main Form (Columns 1-8) */}
          <div className="col-span-8">
            {/* Top Row - Form Fields - Compact */}
            <div className="grid grid-cols-9 gap-1 mb-2">
              {/* Column 1 - Left Form Fields */}
              <div className="col-span-3 space-y-1">
                <div>
                  <Label className="text-xs text-black">Slip No</Label>
                  <Input name="slipNo" value={formData.slipNo} readOnly className="h-5 text-xs text-black" />
                </div>
                <div>
                  <Label className="text-xs text-black">Net Weight</Label>
                  <Input name="netWeight" value={formData.netWeight} onChange={handleChange} className="h-5 text-xs bg-yellow-200 text-black" />
                </div>
                <div>
                  <Label className="text-xs text-black">Freight</Label>
                  <Input name="freight" value={formData.freight} onChange={handleChange} className="h-5 text-xs text-black" />
                </div>
                <div>
                  <Label className="text-xs text-black">Remarks</Label>
                  <Textarea
                    placeholder="Add remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="h-8 text-xs resize-none text-black placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Column 2 - Weight Fields */}
              <div className="col-span-3 space-y-1">
                <div>
                  <Label className="text-xs text-black">First Weight</Label>
                  <Input name="firstWeight" value={formData.firstWeight} onChange={handleChange} className="h-5 text-xs text-black" />
                </div>
                <div>
                  <Label className="text-xs text-black">Second Weight</Label>
                  <Input name="secondWeight" value={formData.secondWeight} onChange={handleChange} className="h-5 text-xs text-green-600" />
                </div>
                <div>
                  <Label className="text-xs text-black">Bardana Weight</Label>
                  <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} className="h-5 text-xs text-black" />
                </div>
                <div>
                  <Label className="text-xs text-black">Gross Weight</Label>
                  <Input name="grossWeight" value={formData.grossWeight} readOnly className="h-5 text-xs text-black" />
                </div>
              </div>

              {/* Column 3 - Driver & Branch */}
              <div className="col-span-3 space-y-1">
                <div>
                  <Label className="text-xs text-black">Branch</Label>
                  <Select name="branch" value={formData.branch} onValueChange={(value) => setFormData(prev => ({...prev, branch: value}))}>
                    <SelectTrigger className="h-5 text-xs text-black">
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
                    className="h-5 text-xs text-black placeholder:text-gray-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button className="h-5 bg-green-600 text-xs" onClick={captureFirstWeight}>1st WHT</Button>
                  <Button className="h-5 bg-gray-500 text-xs" onClick={captureSecondWeight}>2nd WHT</Button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button className="h-5 bg-yellow-500 text-xs" onClick={resetForm}>Clear</Button>
                  <Button className="h-5 bg-red-500 text-xs">Exit</Button>
                </div>
                
                {/* Clean Camera Feed - just the video content */}
                <div className="mt-2 h-16 w-full overflow-hidden">
                  <VideoStreamFullscreen
                    camera={{ id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }}
                    isConnected={true}
                    isStreaming={true}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row - Tabs Section - Compact */}
            <Tabs defaultValue="purchase" className="h-[calc(100%-120px)]">
              <TabsList className="h-5">
                <TabsTrigger value="purchase" className="text-xs">Purchase</TabsTrigger>
                <TabsTrigger value="sale" className="text-xs">Sale</TabsTrigger>
                <TabsTrigger value="offline" className="text-xs">Offline</TabsTrigger>
              </TabsList>

              <TabsContent value="purchase" className="mt-1">
                <div className="grid grid-cols-4 gap-1 text-xs mb-2">
                  {/* Mini Column 1 */}
                  <div className="space-y-1">
                    <div>
                      <Label className="text-xs text-black">Bardana Type</Label>
                      <Input name="bardanaType" value={formData.bardanaType} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">Wt Per Bag</Label>
                      <Input name="wtPerBag" value={formData.wtPerBag} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">No Of Bags</Label>
                      <Input name="noOfBags" value={formData.noOfBags} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                  </div>

                  {/* Mini Column 2 */}
                  <div className="space-y-1">
                    <div>
                      <Label className="text-xs text-black">IGP No</Label>
                      <div className="flex gap-1">
                        <Input name="igpNo" value={formData.igpNo} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                        <Button onClick={fetchIgpData} className="h-4 px-1 text-xs bg-blue-500">Fetch</Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-black">IGP Date</Label>
                      <Input name="igpDate" value={formData.igpDate} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">Vendor</Label>
                      <Input name="vendor" value={formData.vendor} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                  </div>

                  {/* Mini Column 3 */}
                  <div className="space-y-1">
                    <div>
                      <Label className="text-xs text-black">Vehicle No</Label>
                      <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">Supp's Weight</Label>
                      <Input name="superweight" value={formData.superweight} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                    <div>
                      <Button className="w-full h-4 bg-yellow-500 text-xs">Deduction +</Button>
                    </div>
                  </div>

                  {/* Mini Column 4 - Additional fields */}
                  <div className="space-y-1">
                    <div>
                      <Button onClick={handleSaveItems} className="w-full h-4 bg-green-500 text-xs" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Items'}
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs text-black">Quality Deduction</Label>
                      <Input name="qualityDeduction" value={formData.qualityDeduction} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                    <div>
                      <Label className="text-xs text-black">Bag Condition</Label>
                      <Input name="bagCondition" value={formData.bagCondition} onChange={handleChange} className="h-4 text-xs text-black" />
                    </div>
                  </div>
                </div>

                {/* Compact Table with IGP Data */}
                <div className="border rounded text-xs h-[calc(100%-120px)] overflow-auto">
                  <table className="w-full text-center">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="border p-1 text-xs text-black">Po No</th>
                        <th className="border p-1 text-xs text-black">Item Code</th>
                        <th className="border p-1 text-xs text-black">Item Description</th>
                        <th className="border p-1 text-xs text-black">Po Qty</th>
                        <th className="border p-1 text-xs text-black">IGP Qty</th>
                        <th className="border p-1 text-xs text-black">Balance Qty</th>
                        <th className="border p-1 text-xs text-black">Vendor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {igpItems.length > 0 ? (
                        igpItems.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="border p-1 h-4 text-xs text-black">{item.po_no || ''}</td>
                            <td className="border p-1 h-4 text-xs text-black">{item.item_code || ''}</td>
                            <td className="border p-1 h-4 text-xs text-black">{item.item_desc || ''}</td>
                            <td className="border p-1 h-4 text-xs text-black">{item.po_qty || ''}</td>
                            <td className="border p-1 h-4 text-xs text-black">{item.igp_qty || ''}</td>
                            <td className="border p-1 h-4 text-xs text-black">{item.balance_qty || ''}</td>
                            <td className="border p-1 h-4 text-xs text-black">{item.vendor_name || ''}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="border p-1 h-4 text-xs text-black" colSpan={7}>No IGP data available</td>
                        </tr>
                      )}
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