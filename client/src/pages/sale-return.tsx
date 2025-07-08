import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WeightIndicator from "@/components/weight-indicator";
import WeightDisplayTable from "@/components/weight-display-table";
import VideoStreamFullscreen from "@/components/video-stream-fullscreen";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function SaleReturn() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchSlipNo, setSearchSlipNo] = useState("");
  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [type, setType] = useState("");

  // Sales return data state - mapped to database columns
  const [salesReturnData, setSalesReturnData] = useState<any[]>(
    Array.from({ length: 8 }, (_, index) => ({
      doId: "", // Will be auto-generated as maximum number
      dcNo: "",
      doNo: "",
      customerName: "", // Maps to customer_name
      vehicleNo: "", // Maps to vehicle_no
      doDate: "", // Maps to do_date (will be null for now)
      itemDescription: "", // Maps to item_description
      dcQty: "",
      doQty: "",
      branch: "",
      returnReason: "", // Additional field for return reason
      returnDate: new Date().toISOString().split('T')[0], // Default to today
    })),
  );

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
    entryType: 'SALE_RETURN',
    branch: '',
    branchId: '',
  });

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
  });

  // Fetch sale return records
  const { data: saleReturnRecords = [] } = useQuery({
    queryKey: ['/api/sale-return/records'],
    refetchInterval: 3000,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const currentType = searchParams.get('type');
    setType(currentType ?? "");
  }, [location]);

  const nonEmptyRows = salesReturnData.filter(
    (row) =>
      row.dcNo ||
      row.doNo ||
      row.customerName ||
      row.vehicleNo ||
      row.itemDescription ||
      row.dcQty ||
      row.doQty ||
      row.returnReason,
  );

  const handleSalesReturnDataChange = (index: number, field: string, value: string) => {
    const newData = [...salesReturnData];
    newData[index] = { ...newData[index], [field]: value };
    setSalesReturnData(newData);
  };

  const handleSalesReturnRowDelete = (index: number) => {
    setSalesReturnData(prevData => {
      const newData = [...prevData];
      newData[index] = {
        doId: '',
        dcNo: '',
        doNo: '',
        customerName: '',
        vehicleNo: '',
        doDate: '',
        itemDescription: '',
        dcQty: '',
        doQty: '',
        branch: '',
        returnReason: '',
        returnDate: new Date().toISOString().split('T')[0],
      };
      return newData;
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Get next slip number for sale return
      const slipResponse = await fetch('/api/purchase/next-slip-number?entry_type=SALE_RETURN');
      const slipData = await slipResponse.json();
      
      if (!slipData.nextSlipNo) {
        throw new Error('Failed to generate slip number');
      }

      const updatedFormData = {
        ...formData,
        slipNo: slipData.nextSlipNo,
        entryType: 'SALE_RETURN'
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
        throw new Error('Failed to save sale return record');
      }

      const result = await response.json();

      // Save sales return details if there are non-empty rows
      if (nonEmptyRows.length > 0) {
        const salesReturnResponse = await fetch('/api/sales-details/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wbId: result.wbId,
            salesData: nonEmptyRows.map(row => ({
              ...row,
              wbId: result.wbId,
              entryType: 'SALE_RETURN'
            }))
          }),
        });

        if (!salesReturnResponse.ok) {
          throw new Error('Failed to save sales return details');
        }
      }

      alert('Sale return record saved successfully!');
      
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
        entryType: 'SALE_RETURN',
        branch: '',
        branchId: '',
      });

      setSalesReturnData(Array.from({ length: 8 }, (_, index) => ({
        doId: '',
        dcNo: '',
        doNo: '',
        customerName: '',
        vehicleNo: '',
        doDate: '',
        itemDescription: '',
        dcQty: '',
        doQty: '',
        branch: '',
        returnReason: '',
        returnDate: new Date().toISOString().split('T')[0],
      })));

    } catch (error) {
      console.error('Error saving sale return:', error);
      alert('Failed to save sale return record');
    }
  };

  const filteredRecords = (saleReturnRecords || []).filter((record: any) => {
    const matchesSlipNo = !searchSlipNo || (record.slip_no || '').toString().toLowerCase().includes(searchSlipNo.toLowerCase());
    const matchesVehicleNo = !searchVehicleNo || (record.vehicle_no || '').toString().toLowerCase().includes(searchVehicleNo.toLowerCase());
    return matchesSlipNo && matchesVehicleNo;
  });

  return (
    <div className="bg-slate-900 min-h-screen p-1">
      <div className="bg-white p-1 rounded border">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-gray-800">Sale Return Form</h1>
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
              <div className="grid grid-cols-3 gap-2">
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
                  <Label className="text-xs">Remarks</Label>
                  <Textarea 
                    name="remarks" 
                    value={formData.remarks} 
                    onChange={handleFormChange} 
                    className="h-6 text-xs resize-none" 
                  />
                </div>
              </div>
            </div>

            {/* Sale Return Details Section */}
            <div className="bg-gray-50 p-2 rounded border">
              <h3 className="text-sm font-semibold mb-2 text-red-600">Sale Return Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-1 border text-left">DO ID</th>
                      <th className="p-1 border text-left">DC No</th>
                      <th className="p-1 border text-left">DO No</th>
                      <th className="p-1 border text-left">Customer</th>
                      <th className="p-1 border text-left">Vehicle No</th>
                      <th className="p-1 border text-left">Item Description</th>
                      <th className="p-1 border text-left">DC Qty</th>
                      <th className="p-1 border text-left">DO Qty</th>
                      <th className="p-1 border text-left">Return Reason</th>
                      <th className="p-1 border text-left">Return Date</th>
                      <th className="p-1 border text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReturnData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-100">
                        <td className="p-1 border">
                          <Input
                            value={row.doId}
                            onChange={(e) => handleSalesReturnDataChange(index, 'doId', e.target.value)}
                            className="h-6 text-xs"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.dcNo}
                            onChange={(e) => handleSalesReturnDataChange(index, 'dcNo', e.target.value)}
                            className="h-6 text-xs"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.doNo}
                            onChange={(e) => handleSalesReturnDataChange(index, 'doNo', e.target.value)}
                            className="h-6 text-xs"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.customerName}
                            onChange={(e) => handleSalesReturnDataChange(index, 'customerName', e.target.value)}
                            className="h-6 text-xs"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.vehicleNo}
                            onChange={(e) => handleSalesReturnDataChange(index, 'vehicleNo', e.target.value)}
                            className="h-6 text-xs"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.itemDescription}
                            onChange={(e) => handleSalesReturnDataChange(index, 'itemDescription', e.target.value)}
                            className="h-6 text-xs"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.dcQty}
                            onChange={(e) => handleSalesReturnDataChange(index, 'dcQty', e.target.value)}
                            className="h-6 text-xs"
                            type="number"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.doQty}
                            onChange={(e) => handleSalesReturnDataChange(index, 'doQty', e.target.value)}
                            className="h-6 text-xs"
                            type="number"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.returnReason}
                            onChange={(e) => handleSalesReturnDataChange(index, 'returnReason', e.target.value)}
                            className="h-6 text-xs"
                            placeholder="Return reason"
                          />
                        </td>
                        <td className="p-1 border">
                          <Input
                            value={row.returnDate}
                            onChange={(e) => handleSalesReturnDataChange(index, 'returnDate', e.target.value)}
                            className="h-6 text-xs"
                            type="date"
                          />
                        </td>
                        <td className="p-1 border">
                          <Button
                            onClick={() => handleSalesReturnRowDelete(index)}
                            className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white"
                          >
                            ×
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <h3 className="text-sm font-semibold text-red-800">Sale Return Records</h3>
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
                    No sale return records found
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