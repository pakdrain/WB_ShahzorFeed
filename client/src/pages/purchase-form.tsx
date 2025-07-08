
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
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

export default function PurchaseForm() {
  const [location, setLocation] = useLocation();
  const [type, setType] = useState('');
  const { user } = useAuth();
  const [searchSlipNo, setSearchSlipNo] = useState('');
  const [searchVehicleNo, setSearchVehicleNo] = useState('');
  const [activeTab, setActiveTab] = useState('purchase');
  const [selectedForm, setSelectedForm] = useState<'purchase' | 'sales' | 'offline'>('purchase'); // Controls which form section is shown
  
  // Deduction/Bag table state
  const [bagTableData, setBagTableData] = useState<any[]>([]);
  const [percentageMode, setPercentageMode] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const currentType = searchParams.get('type');
    console.log('Type param changed:', currentType);
    setType(currentType ?? "");
  }, [location]); // 👈 Every time URL changes
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formType = params.get('form');

    if (formType === 'sales') {
      setSelectedForm('sales');
    } else if (formType === 'purchase') {
      setSelectedForm('purchase');
    } else if (formType === 'offline') {
      setSelectedForm('offline');
    }
  }, [location]);

  // Sales data state - mapped to database columns
  const [salesData, setSalesData] = useState<any[]>(
    Array.from({ length: 8 }, (_, index) => ({
      doId: '', // Will be auto-generated as maximum number
      dcNo: '',
      doNo: '',
      customerName: '', // Maps to customer_name
      vehicleNo: '', // Maps to vehicle_no
      doDate: '', // Maps to do_date (will be null for now)
      itemDescription: '', // Maps to item_description
      dcQty: '',
      doQty: '',
      branch: ''
    }))
  );
  const [nextBagId, setNextBagId] = useState(1);

  const handleSalesDataChange = (index: number, field: string, value: string) => {
    const newData = [...salesData];
    newData[index] = { ...newData[index], [field]: value };
    setSalesData(newData);
  };

  const handleSalesRowDelete = (index: number) => {
    setSalesData(prevData => {
      const newData = [...prevData];
      // Clear the row data
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
        dcId: '',
        customerId: '',
        itemId: '',
        itemCode: ''
      };
      return newData;
    });
  };
  
  // Fetch all first weight records
  const { data: firstWeightRecords = [] } = useQuery({
    queryKey: ['/api/purchase/first-weight-records'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch offline records specifically
  const { data: offlineRecords = [] } = useQuery({
    queryKey: ['/api/purchases/offline'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Filter records based on search criteria
  const filteredRecords = Array.isArray(firstWeightRecords) ? firstWeightRecords.filter((record: any) => {
    const matchesSlipNo = !searchSlipNo || (record.slip_no || '').toString().toLowerCase().includes(searchSlipNo.toLowerCase());
    const matchesVehicleNo = !searchVehicleNo || (record.vehicle_no || '').toString().toLowerCase().includes(searchVehicleNo.toLowerCase());
    return matchesSlipNo && matchesVehicleNo;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Purchase Form</h1>
        
        {/* Top Navigation Buttons */}
        <div className="flex gap-2 mb-4">
          <Button 
            className={`px-4 py-2 text-sm ${selectedForm === 'purchase' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}
            onClick={() => setSelectedForm('purchase')}
          >
            Purchase
          </Button>
          <Button 
            className={`px-4 py-2 text-sm ${selectedForm === 'sales' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}
            onClick={() => setSelectedForm('sales')}
          >
            Sales
          </Button>
          <Button 
            className={`px-4 py-2 text-sm ${selectedForm === 'offline' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}
            onClick={() => setSelectedForm('offline')}
          >
            Offline
          </Button>
        </div>

        {/* Search Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="searchSlipNo">Search by Slip No</Label>
              <Input
                id="searchSlipNo"
                value={searchSlipNo}
                onChange={(e) => setSearchSlipNo(e.target.value)}
                placeholder="Enter slip number"
              />
            </div>
            <div>
              <Label htmlFor="searchVehicleNo">Search by Vehicle No</Label>
              <Input
                id="searchVehicleNo"
                value={searchVehicleNo}
                onChange={(e) => setSearchVehicleNo(e.target.value)}
                placeholder="Enter vehicle number"
              />
            </div>
          </div>
        </div>

        {/* Content based on selected form */}
        {selectedForm === 'purchase' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Purchase Records</h2>
            <WeightDisplayTable records={filteredRecords} />
          </div>
        )}

        {selectedForm === 'sales' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Sales Form</h2>
            <div className="space-y-4">
              {salesData.map((row, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded">
                  <Input
                    placeholder="Customer Name"
                    value={row.customerName}
                    onChange={(e) => handleSalesDataChange(index, 'customerName', e.target.value)}
                  />
                  <Input
                    placeholder="Vehicle No"
                    value={row.vehicleNo}
                    onChange={(e) => handleSalesDataChange(index, 'vehicleNo', e.target.value)}
                  />
                  <Input
                    placeholder="Item Description"
                    value={row.itemDescription}
                    onChange={(e) => handleSalesDataChange(index, 'itemDescription', e.target.value)}
                  />
                  <Button 
                    variant="destructive" 
                    onClick={() => handleSalesRowDelete(index)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedForm === 'offline' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Offline Records</h2>
            <WeightDisplayTable records={offlineRecords} />
          </div>
        )}

        {/* Weight Indicator and Video Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <WeightIndicator />
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <VideoStreamFullscreen />
          </div>
        </div>
      </div>
    </div>
  );
}
