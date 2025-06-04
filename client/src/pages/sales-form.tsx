import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SalesRowData {
  doId: string;
  dcNo: string;
  doNo: string;
  customerName: string;
  vehicleNo: string;
  doDate: string;
  itemDescription: string;
  dcQty: string;
  doQty: string;
  branch: string;
}

export default function SalesForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [salesData, setSalesData] = useState<SalesRowData[]>([
    {
      doId: 'DO001',
      dcNo: '',
      doNo: '',
      customerName: '',
      vehicleNo: '',
      doDate: '',
      itemDescription: '',
      dcQty: '',
      doQty: '',
      branch: ''
    }
  ]);

  const handleRowChange = (index: number, field: keyof SalesRowData, value: string) => {
    const newData = [...salesData];
    newData[index] = { ...newData[index], [field]: value };
    setSalesData(newData);
  };

  const addRow = () => {
    const nextDoId = `DO${String(salesData.length + 1).padStart(3, '0')}`;
    setSalesData([...salesData, {
      doId: nextDoId,
      dcNo: '',
      doNo: '',
      customerName: '',
      vehicleNo: '',
      doDate: '',
      itemDescription: '',
      dcQty: '',
      doQty: '',
      branch: ''
    }]);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: SalesRowData[]) => {
      // Save sales data to existing purchase/master tables
      const response = await fetch('/api/sales/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salesData: data,
          entryType: 'Sales'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save sales data');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales data saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save sales data",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    const validData = salesData.filter(row => 
      row.dcNo || row.doNo || row.customerName || row.vehicleNo || 
      row.doDate || row.itemDescription || row.dcQty || row.doQty || row.branch
    );
    
    if (validData.length > 0) {
      saveMutation.mutate(validData);
    } else {
      toast({
        title: "Warning",
        description: "Please enter at least one row of data",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-blue-50 p-2">
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
          <Button 
            onClick={addRow}
            className="h-6 text-xs bg-green-600 hover:bg-green-700"
          >
            Add Row
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="h-6 text-xs bg-blue-600 hover:bg-blue-700"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
        
        {/* Type Indicator */}
        <div className="flex gap-1">
          <div className="px-4 py-1 bg-blue-200 border border-gray-400 text-xs font-medium text-black">Purchase</div>
          <div className="px-4 py-1 bg-blue-500 text-white border border-gray-400 text-xs font-medium">Sale</div>
          <div className="px-4 py-1 bg-blue-200 border border-gray-400 text-xs font-medium text-black">Offline</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-hidden flex flex-col border border-gray-300">
        
        {/* Table Header */}
        <div className="grid grid-cols-10 gap-px bg-gray-300 text-xs font-semibold min-w-[1200px]">
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">DO ID</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">DC #</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">DO #</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">Customer Name</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">Vehicle No</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">DO Date</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">Item Description</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">DC Qty</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">DO Qty</div>
          <div className="bg-blue-100 p-2 text-center border border-gray-400 text-black">Branch</div>
        </div>

        {/* Table Body - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-200 overflow-x-auto">
          {salesData.map((row, index) => (
            <div key={index} className="grid grid-cols-10 gap-px text-xs min-w-[1200px]">
              <div className="bg-white border border-gray-300 p-1">
                <div className="h-6 flex items-center text-xs text-black font-medium px-2">
                  {row.doId}
                </div>
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.dcNo}
                  onChange={(e) => handleRowChange(index, 'dcNo', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="DC#"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.doNo}
                  onChange={(e) => handleRowChange(index, 'doNo', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="DO#"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.customerName}
                  onChange={(e) => handleRowChange(index, 'customerName', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="Customer"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.vehicleNo}
                  onChange={(e) => handleRowChange(index, 'vehicleNo', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="Vehicle"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.doDate}
                  onChange={(e) => handleRowChange(index, 'doDate', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="DD.MM.YYYY"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.itemDescription}
                  onChange={(e) => handleRowChange(index, 'itemDescription', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="Item"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.dcQty}
                  onChange={(e) => handleRowChange(index, 'dcQty', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="DC Qty"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.doQty}
                  onChange={(e) => handleRowChange(index, 'doQty', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="DO Qty"
                />
              </div>
              <div className="bg-white border border-gray-300 p-1">
                <Input
                  value={row.branch}
                  onChange={(e) => handleRowChange(index, 'branch', e.target.value)}
                  className="h-6 text-xs text-black placeholder:text-gray-500 border-0 rounded-none focus:ring-0"
                  placeholder="Branch"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}