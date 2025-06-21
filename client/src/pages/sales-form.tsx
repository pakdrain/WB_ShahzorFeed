import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import WeightDisplayTable from '@/components/weight-display-table';

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
  const [onlineMode, setOnlineMode] = useState(true);
  
  // Handle URL parameters for online/offline mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeMode = urlParams.get('type');
    
    if (typeMode === 'online') {
      setOnlineMode(true);
    } else if (typeMode === 'offline') {
      setOnlineMode(false);
    }
  }, []);

  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
  };

  // Disable IGP fetching in offline mode
  const shouldFetchIgp = onlineMode;
  
  // Disable IGP data fetching when in offline mode
  const fetchIgpData = (igpNo: string) => {
    if (!onlineMode) {
      console.log('IGP data fetching disabled in offline mode');
      return;
    }
    // IGP fetching logic would go here in online mode
  };
  
  const [salesData, setSalesData] = useState<SalesRowData[]>([{
    doId: '',
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

  const saveMutation = useMutation({
    mutationFn: async (data: SalesRowData[]) => {
      return apiRequest('/api/sales/save', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales data saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save sales data",
        variant: "destructive"
      });
    }
  });

  const addRow = () => {
    setSalesData([...salesData, {
      doId: '',
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

  const updateRow = (index: number, field: keyof SalesRowData, value: string) => {
    const newData = [...salesData];
    newData[index][field] = value;
    setSalesData(newData);
  };

  const handleSave = () => {
    const validData = salesData.filter(row => 
      row.doId || row.dcNo || row.doNo || row.customerName || row.vehicleNo
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
    <div className="min-h-screen bg-gray-100">
      <div className="p-4">
        {/* Header with Online/Offline Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sales Order Form</h1>
          
          {/* Online/Offline Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              className={`px-4 py-2 rounded text-sm font-medium ${
                onlineMode 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
              onClick={() => setOnlineMode(true)}
            >
              ONLINE
            </button>
            <button
              className={`px-4 py-2 rounded text-sm font-medium ${
                !onlineMode 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
              onClick={() => setOnlineMode(false)}
            >
              OFFLINE
            </button>
          </div>
        </div>

        {/* Master Table */}
        <div className="mb-4">
          <WeightDisplayTable />
        </div>
        
        {/* Sales Form */}
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
            
            {/* Type Indicator - Shows current mode */}
            <div className="flex gap-1">
              <div className={`px-4 py-1 border border-gray-400 text-xs font-medium ${
                onlineMode ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>ONLINE</div>
              <div className={`px-4 py-1 border border-gray-400 text-xs font-medium ${
                !onlineMode ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>OFFLINE</div>
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
                    <Input
                      value={row.doId}
                      onChange={(e) => updateRow(index, 'doId', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="DO ID"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.dcNo}
                      onChange={(e) => updateRow(index, 'dcNo', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="DC #"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.doNo}
                      onChange={(e) => updateRow(index, 'doNo', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="DO #"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.customerName}
                      onChange={(e) => updateRow(index, 'customerName', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="Customer Name"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.vehicleNo}
                      onChange={(e) => updateRow(index, 'vehicleNo', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="Vehicle No"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.doDate}
                      onChange={(e) => updateRow(index, 'doDate', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="DO Date"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.itemDescription}
                      onChange={(e) => updateRow(index, 'itemDescription', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="Item Description"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.dcQty}
                      onChange={(e) => updateRow(index, 'dcQty', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="DC Qty"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.doQty}
                      onChange={(e) => updateRow(index, 'doQty', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="DO Qty"
                    />
                  </div>
                  <div className="bg-white border border-gray-300 p-1">
                    <Input
                      value={row.branch}
                      onChange={(e) => updateRow(index, 'branch', e.target.value)}
                      className="h-4 text-xs text-black border-none p-0"
                      placeholder="Branch"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}