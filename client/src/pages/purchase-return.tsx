import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WeightIndicator from '@/components/weight-indicator';
import WeightDisplayTable from '@/components/weight-display-table';
import VideoStreamFullscreen from '@/components/video-stream-fullscreen';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

export default function PurchaseReturn() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchSlipNo, setSearchSlipNo] = useState('');
  const [searchVehicleNo, setSearchVehicleNo] = useState('');
  const [type, setType] = useState('');

  // Form state for weighbridge data
  const [formData, setFormData] = useState({
    slipNo: '',
    vehicleNo: '',
    firstWeight: '',
    secondWeight: '',
    netWeight: '',
    bardanaWeight: '',
    grossWeight: '',
    freight: '',
    remarks: '',
    driverName: '',
    slipInTime: '',
    slipOutTime: '',
    entryType: 'PURCHASE_RETURN',
    branch: '',
    branchId: '',
    vendor: '',
    igpNo: '',
    poNo: '',
    itemCode: '',
    itemDesc: '',
    poQty: '',
    igpQty: '',
    balanceQty: '',
    bardanaType: '',
    wtPerBag: '',
    noOfBags: '',
    igpDate: '',
    qualityDeduction: '',
    supplierWeight: '',
    returnReason: '',
    returnDate: new Date().toISOString().split('T')[0],
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
  });

  // Fetch purchase return records
  const { data: purchaseReturnRecords = [] } = useQuery({
    queryKey: ['/api/purchase-return/records'],
    refetchInterval: 3000,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const currentType = searchParams.get('type');
    setType(currentType ?? "");
  }, [location]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Get next slip number for purchase return
      const slipResponse = await fetch('/api/purchase/next-slip-number?entry_type=PURCHASE_RETURN');
      const slipData = await slipResponse.json();
      
      if (!slipData.nextSlipNo) {
        throw new Error('Failed to generate slip number');
      }

      const updatedFormData = {
        ...formData,
        slipNo: slipData.nextSlipNo,
        entryType: 'PURCHASE_RETURN'
      };

      // Save main weighbridge record
      const response = await fetch('/api/purchase/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to save purchase return record');
      }

      const result = await response.json();

      // Save purchase return details
      const purchaseReturnResponse = await fetch('/api/purchase-items/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wbId: result.wbId,
          ...formData,
          entryType: 'PURCHASE_RETURN'
        }),
      });

      if (!purchaseReturnResponse.ok) {
        throw new Error('Failed to save purchase return details');
      }

      alert('Purchase return record saved successfully!');
      
      // Reset form
      setFormData({
        slipNo: '',
        vehicleNo: '',
        firstWeight: '',
        secondWeight: '',
        netWeight: '',
        bardanaWeight: '',
        grossWeight: '',
        freight: '',
        remarks: '',
        driverName: '',
        slipInTime: '',
        slipOutTime: '',
        entryType: 'PURCHASE_RETURN',
        branch: '',
        branchId: '',
        vendor: '',
        igpNo: '',
        poNo: '',
        itemCode: '',
        itemDesc: '',
        poQty: '',
        igpQty: '',
        balanceQty: '',
        bardanaType: '',
        wtPerBag: '',
        noOfBags: '',
        igpDate: '',
        qualityDeduction: '',
        supplierWeight: '',
        returnReason: '',
        returnDate: new Date().toISOString().split('T')[0],
      });

    } catch (error) {
      console.error('Error saving purchase return:', error);
      alert('Failed to save purchase return record');
    }
  };

  const filteredRecords = (purchaseReturnRecords || []).filter((record: any) => {
    const matchesSlipNo = !searchSlipNo || (record.slip_no || '').toString().toLowerCase().includes(searchSlipNo.toLowerCase());
    const matchesVehicleNo = !searchVehicleNo || (record.vehicle_no || '').toString().toLowerCase().includes(searchVehicleNo.toLowerCase());
    return matchesSlipNo && matchesVehicleNo;
  });

  return (
    <div className="bg-slate-900 min-h-screen p-1">
      <div className="bg-white p-1 rounded border">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-gray-800">Purchase Return Form</h1>
          <div className="flex gap-2">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSave}
            >
              Save
            </Button>
            <Button 
              className="bg-gray-600 hover:bg-gray-700 text-white"
              onClick={() => setLocation('/')}
            >
              Exit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          {/* Left Side - Main Form */}
          <div className="col-span-8">
            {/* Master Table Section */}
            <div className="bg-blue-50 p-2 rounded border mb-2">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <Label className="text-xs">Slip No</Label>
                  <Input 
                    name="slipNo" 
                    value={formData.slipNo} 
                    readOnly 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Vehicle No</Label>
                  <Input 
                    name="vehicleNo" 
                    value={formData.vehicleNo} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Branch</Label>
                  <Select 
                    value={formData.branch} 
                    onValueChange={(value) => setFormData(prev => ({...prev, branch: value, branchId: value}))}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch: any) => (
                        <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                          {branch.branch_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">First Weight</Label>
                  <Input 
                    name="firstWeight" 
                    value={formData.firstWeight} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Second Weight</Label>
                  <Input 
                    name="secondWeight" 
                    value={formData.secondWeight} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Net Weight</Label>
                  <Input 
                    name="netWeight" 
                    value={formData.netWeight} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Driver Name</Label>
                  <Input 
                    name="driverName" 
                    value={formData.driverName} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Vendor</Label>
                  <Input 
                    name="vendor" 
                    value={formData.vendor} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
              </div>
            </div>

            {/* Purchase Return Details Section */}
            <div className="bg-red-50 p-2 rounded border mb-2">
              <h3 className="text-sm font-semibold mb-2 text-red-600">Purchase Return Details</h3>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div>
                  <Label className="text-xs">IGP No</Label>
                  <Input 
                    name="igpNo" 
                    value={formData.igpNo} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">PO No</Label>
                  <Input 
                    name="poNo" 
                    value={formData.poNo} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Item Code</Label>
                  <Input 
                    name="itemCode" 
                    value={formData.itemCode} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">Item Description</Label>
                  <Input 
                    name="itemDesc" 
                    value={formData.itemDesc} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs">PO Qty</Label>
                  <Input 
                    name="poQty" 
                    value={formData.poQty} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                    type="number"
                  />
                </div>
                <div>
                  <Label className="text-xs">IGP Qty</Label>
                  <Input 
                    name="igpQty" 
                    value={formData.igpQty} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                    type="number"
                  />
                </div>
                <div>
                  <Label className="text-xs">Bardana Type</Label>
                  <Select 
                    value={formData.bardanaType} 
                    onValueChange={(value) => setFormData(prev => ({...prev, bardanaType: value}))}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PP BAGS 100 GR">PP BAGS 100 GR</SelectItem>
                      <SelectItem value="PP BAGS 50 GR">PP BAGS 50 GR</SelectItem>
                      <SelectItem value="JUTE BAGS">JUTE BAGS</SelectItem>
                      <SelectItem value="HDPE BAGS">HDPE BAGS</SelectItem>
                      <SelectItem value="PLASTIC BAGS">PLASTIC BAGS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Weight per Bag</Label>
                  <Input 
                    name="wtPerBag" 
                    value={formData.wtPerBag} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                    type="number"
                  />
                </div>
                <div>
                  <Label className="text-xs">No of Bags</Label>
                  <Input 
                    name="noOfBags" 
                    value={formData.noOfBags} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                    type="number"
                  />
                </div>
                <div>
                  <Label className="text-xs">Return Reason</Label>
                  <Input 
                    name="returnReason" 
                    value={formData.returnReason} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                    placeholder="Reason for return"
                  />
                </div>
                <div>
                  <Label className="text-xs">Return Date</Label>
                  <Input 
                    name="returnDate" 
                    value={formData.returnDate} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs" 
                    type="date"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Remarks</Label>
                <Textarea 
                  name="remarks" 
                  value={formData.remarks} 
                  onChange={handleFormChange} 
                  className="h-12 text-xs resize-none" 
                  placeholder="Additional remarks for return"
                />
              </div>
            </div>
          </div>

          {/* Right Side - Records Display */}
          <div className="col-span-4">
            {/* Search Section */}
            <div className="bg-gray-50 p-2 rounded border mb-2">
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Search Slip No</Label>
                  <Input
                    value={searchSlipNo}
                    onChange={(e) => setSearchSlipNo(e.target.value)}
                    className="h-6 text-xs"
                    placeholder="Enter slip number"
                  />
                </div>
                <div>
                  <Label className="text-xs">Search Vehicle No</Label>
                  <Input
                    value={searchVehicleNo}
                    onChange={(e) => setSearchVehicleNo(e.target.value)}
                    className="h-6 text-xs"
                    placeholder="Enter vehicle number"
                  />
                </div>
              </div>
            </div>

            {/* Records Display */}
            <div className="bg-white border rounded">
              <div className="p-2 bg-red-100 border-b">
                <h3 className="text-sm font-semibold text-red-800">Purchase Return Records</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredRecords.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-1 border text-left">Slip No</th>
                        <th className="p-1 border text-left">Vehicle No</th>
                        <th className="p-1 border text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-1 border">{record.slip_no}</td>
                          <td className="p-1 border">{record.vehicle_no}</td>
                          <td className="p-1 border">{record.slip_in_time ? new Date(record.slip_in_time).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No purchase return records found
                  </div>
                )}
              </div>
            </div>

            {/* Weight Indicator */}
            <div className="mt-2">
              <WeightIndicator comPort="COM6" />
            </div>

            {/* Camera Feed */}
            <div className="mt-2">
              <VideoStreamFullscreen
                camera={{ id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }}
                isConnected={true}
                isStreaming={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}