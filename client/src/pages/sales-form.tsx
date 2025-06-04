import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SalesRowData {
  dcNo: string;
  doNo: string;
  customerName: string;
  vehicleNo: string;
  coDate: string;
  itemDescription: string;
  dcQty: string;
  doQty: string;
  branch: string;
}

export default function SalesForm() {
  const [salesData, setSalesData] = useState<SalesRowData[]>(
    Array.from({ length: 15 }, () => ({
      dcNo: "",
      doNo: "",
      customerName: "",
      vehicleNo: "",
      coDate: "",
      itemDescription: "",
      dcQty: "",
      doQty: "",
      branch: ""
    }))
  );

  const [summaryData, setSummaryData] = useState({
    weightPerBags: "",
    totalWeightQty: "",
    total: "",
    totalFeedBags: ""
  });

  const handleRowChange = (rowIndex: number, field: keyof SalesRowData, value: string) => {
    const newSalesData = [...salesData];
    newSalesData[rowIndex][field] = value;
    setSalesData(newSalesData);
  };

  const handleSummaryChange = (field: string, value: string) => {
    setSummaryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="h-screen bg-gray-100 p-2 overflow-hidden">
      <div className="bg-white p-2 rounded border h-full overflow-hidden flex flex-col">
        
        {/* Header Tabs */}
        <div className="flex mb-2">
          <div className="flex border-b">
            <div className="px-4 py-1 bg-blue-200 border border-gray-400 text-xs font-medium">Purchase</div>
            <div className="px-4 py-1 bg-blue-500 text-white border border-gray-400 text-xs font-medium">Sale</div>
            <div className="px-4 py-1 bg-blue-200 border border-gray-400 text-xs font-medium">Offline</div>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="grid grid-cols-9 gap-px bg-gray-300 text-xs font-semibold">
            <div className="bg-blue-100 p-1 text-center border border-gray-400">DC #</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">DO #</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">Customer Name</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">Vehicle No</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">Co Date</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">Item Description</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">DC Qty</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">DO Qty</div>
            <div className="bg-blue-100 p-1 text-center border border-gray-400">Branch</div>
          </div>

          {/* Table Body - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-gray-200">
            {salesData.map((row, index) => (
              <div key={index} className="grid grid-cols-9 gap-px text-xs">
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.doId}
                    readOnly
                    className="h-6 text-xs border-0 rounded-none bg-gray-100"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.doNo}
                    onChange={(e) => handleRowChange(index, 'doNo', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.customerName}
                    onChange={(e) => handleRowChange(index, 'customerName', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.vehicleNo}
                    onChange={(e) => handleRowChange(index, 'vehicleNo', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.coDate}
                    onChange={(e) => handleRowChange(index, 'coDate', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none"
                    placeholder="DD.MM.YYYY"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.itemDescription}
                    onChange={(e) => handleRowChange(index, 'itemDescription', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.dcQty}
                    onChange={(e) => handleRowChange(index, 'dcQty', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none text-right"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.doQty}
                    onChange={(e) => handleRowChange(index, 'doQty', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none text-right"
                  />
                </div>
                <div className="bg-white border border-gray-300">
                  <Input
                    value={row.branch}
                    onChange={(e) => handleRowChange(index, 'branch', e.target.value)}
                    className="h-6 text-xs border-0 rounded-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Summary Section */}
          <div className="bg-blue-100 border-t border-gray-400 p-2">
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">Weight Per Bags:</Label>
                <Input
                  value={summaryData.weightPerBags}
                  onChange={(e) => handleSummaryChange('weightPerBags', e.target.value)}
                  className="h-6 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">Total Weight Qty:</Label>
                <Input
                  value={summaryData.totalWeightQty}
                  onChange={(e) => handleSummaryChange('totalWeightQty', e.target.value)}
                  className="h-6 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">Total:</Label>
                <Input
                  value={summaryData.total}
                  onChange={(e) => handleSummaryChange('total', e.target.value)}
                  className="h-6 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium">Total Feed Bags:</Label>
                <Input
                  value={summaryData.totalFeedBags}
                  onChange={(e) => handleSummaryChange('totalFeedBags', e.target.value)}
                  className="h-6 text-xs flex-1"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}