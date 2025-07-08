import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PurchaseRecord {
  wb_id: number;
  slip_no: string;
  slip_in_time: string;
  slip_out_time: string;
  entry_type: string;
  vehicle_no: string;
  vendor_name: string;
  branch_id: number;
  online_entry: string;
  offline_entry: string;

  igp_no: string;
  freight: string;
  item_desc: string;
 no_of_bags: string;
  bag_condition: string;
  bardana_type: string;
  wt_per_bag: string;
  remarks: string;

  first_weight: string;
  second_weight: string;
  gross_weight: string;
  bardana_weight: string;
  quality_deduction: string;
  net_weight: string;

}

interface SaleRecord {
  wb_id: number;
  slip_no: string;
  slip_in_time: string;
  slip_out_time: string;
  entry_type: string;
  customer_name: string;
  vehicle_no: string;
  branch_id: number;
}

export default function Reports() {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [activeTab, setActiveTab] = useState('purchase');
  const [location, setLocation] = useLocation();

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
  });

  // Fetch purchase records
  const { data: purchaseData, refetch: refetchPurchase, error: purchaseError } = useQuery({
    queryKey: ['/api/purchases', selectedBranch],
    queryFn: async () => {
      const url = (selectedBranch && selectedBranch !== 'all') 
        ? `/api/purchases?branch_id=${selectedBranch}` 
        : '/api/purchases';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch purchase data');
      }
      return data;
    },
  });

  // Ensure purchaseRecords is always an array
  const purchaseRecords = Array.isArray(purchaseData) ? purchaseData : [];

  // Fetch sales records
  const { data: salesData, refetch: refetchSales, error: salesError } = useQuery({
  queryKey: ['/api/sales', selectedBranch],
  });

  // Ensure salesRecords is always an array
  const salesRecords = Array.isArray(salesData) ? salesData : [];

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const branchParam = searchParams.get('branch');
    setSelectedBranch(branchParam || 'all'); // Default to 'all' if no branch is specified
  }, [location]);

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = event.target.value;
    setSelectedBranch(branchId);
    setLocation(`?branch=${branchId}`); // Update URL to reflect selected branch
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>

      {/* Branch Selection */}
      <div className="mb-4">
        <label htmlFor="branch" className="mr-2">Select Branch:</label>
        <Select id="branch" value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((branch: any) => (
              <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                {branch.branch_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>
        <TabsContent value="purchase">
          <h2 className="text-xl font-semibold mb-2">Purchase Records</h2>
          {purchaseError && <div className="text-red-500">Error: {purchaseError.message}</div>}
          {purchaseRecords.length === 0 ? (
            <div>No purchase records found.</div>
          ) : (
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Slip No</th>
                  <th className="px-4 py-2">Vehicle No</th>
                  <th className="px-4 py-2">Vendor Name</th>
                  <th className="px-4 py-2">Net Weight</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRecords.map((record: PurchaseRecord) => (
                  <tr key={record.wb_id}>
                    <td className="border px-4 py-2">{record.slip_no}</td>
                    <td className="border px-4 py-2">{record.vehicle_no}</td>
                    <td className="border px-4 py-2">{record.vendor_name}</td>
                    <td className="border px-4 py-2">{record.net_weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>
        <TabsContent value="sales">
          <h2 className="text-xl font-semibold mb-2">Sales Records</h2>
          {salesError && <div className="text-red-500">Error: {salesError.message}</div>}
          {salesRecords.length === 0 ? (
            <div>No sales records found.</div>
          ) : (
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Slip No</th>
                  <th className="px-4 py-2">Vehicle No</th>
                  <th className="px-4 py-2">Customer Name</th>
                </tr>
              </thead>
              <tbody>
                {salesRecords.map((record: SaleRecord) => (
                  <tr key={record.wb_id}>
                    <td className="border px-4 py-2">{record.slip_no}</td>
                    <td className="border px-4 py-2">{record.vehicle_no}</td>
                    <td className="border px-4 py-2">{record.customer_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}