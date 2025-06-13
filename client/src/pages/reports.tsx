import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['/api/branches'],
  });

  // Fetch purchase records
  const { data: purchaseRecords = [], refetch: refetchPurchase } = useQuery({
    queryKey: ['/api/purchases', selectedBranch],
    queryFn: async () => {
      const url = selectedBranch 
        ? `/api/purchases?branch_id=${selectedBranch}` 
        : '/api/purchases';
      const response = await fetch(url);
      return response.json();
    },
  });

  // Fetch sales records
  const { data: salesRecords = [], refetch: refetchSales } = useQuery({
    queryKey: ['/api/sales', selectedBranch],
    queryFn: async () => {
      const url = selectedBranch 
        ? `/api/sales?branch_id=${selectedBranch}` 
        : '/api/sales';
      const response = await fetch(url);
      return response.json();
    },
  });

  // Refetch data when branch selection changes
  useEffect(() => {
    refetchPurchase();
    refetchSales();
  }, [selectedBranch, refetchPurchase, refetchSales]);

  const handleEdit = (wbId: number) => {
    // Navigate to purchase form with edit mode
    window.location.href = `/purchase-form?edit=${wbId}`;
  };

  const handlePrintRecord = async (record: PurchaseRecord | SaleRecord) => {
    try {
      // Generate print report with images
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the report');
        return;
      }

      const reportHTML = generateDetailedReportHTML(record);
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error('Error printing record:', error);
      alert('Failed to generate print report');
    }
  };

  const generateDetailedReportHTML = (record: PurchaseRecord | SaleRecord) => {
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).toUpperCase().replace(/\s/g, '-');
    
    const currentTime = new Date().toLocaleTimeString('en-GB', {
      hour12: false
    });

    const inTime = record.slip_in_time ? new Date(record.slip_in_time).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).toUpperCase().replace(/,/, '') : '';

    const outTime = record.slip_out_time ? new Date(record.slip_out_time).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: '2-digit', 
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).toUpperCase().replace(/,/, '') : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Weighbridge Slip - ${record.slip_no}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
          .header { text-align: center; margin-bottom: 10px; }
          .slip-section { 
            border: 2px solid #000; 
            margin-bottom: 15px; 
            padding: 10px; 
            box-sizing: border-box;
          }
          .company-name { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
          .slip-title { font-size: 12px; font-weight: bold; margin-bottom: 8px; }
          .two-column { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .left-section, .right-section { 
            width: 45%; 
            border: 1px solid #666; 
            padding: 5px; 
            border-radius: 3px;
          }
          .image-container { 
            border: 2px solid #333; 
            padding: 10px; 
            margin: 10px 0; 
            text-align: center; 
            height: 150px;
            border-radius: 3px;
            background-color: #f9f9f9;
          }
          .signatures { margin-top: 15px; display: flex; justify-content: space-between; }
          .signature-line { border-bottom: 1px solid #000; width: 100px; text-align: center; font-size: 8px; }
          @media print { 
            body { margin: 0; } 
            .slip-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="slip-section">
          <div class="header">
            <div>Print Date: ${currentDate} ${currentTime}</div>
            <div class="company-name">Shahzor Feed Mill</div>
            <div class="slip-title">WEIGH BRIDGE SLIP</div>
          </div>
          
          <div class="two-column">
            <div class="left-section">
              <div>W.B # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${record.slip_no || ''}</div>
              <div style="margin-top: 5px;">Vehicle # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${record.vehicle_no || ''}</div>
              <div style="margin-top: 5px;">Entry Type &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${record.entry_type || ''}</div>
            </div>
            <div class="right-section">
              <div>Time IN: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${inTime}</div>
              <div style="margin-top: 5px;">Time OUT: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${outTime}</div>
              <div style="margin-top: 5px;">Entry Mode: &nbsp;&nbsp;&nbsp; ${('online_entry' in record && record.online_entry) ? 'ONLINE' : 'OFFLINE'}</div>
            </div>
          </div>

          <div class="image-container">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">First Weight Image</div>
            <div style="font-size: 10px;">Slip No: ${record.slip_no}</div>
            <div style="font-size: 10px; margin-top: 5px;">Image captured during first weighing</div>
          </div>

          <div class="image-container">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Second Weight Image</div>
            <div style="font-size: 10px;">Slip No: ${record.slip_no}</div>
            <div style="font-size: 10px; margin-top: 5px;">Image captured during second weighing</div>
          </div>

          <div class="signatures">
            <div>
              <div class="signature-line"></div>
              <div>Weight By:</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div>Checked By:</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div>Production Manager:</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Reports</h1>
        
        {/* Branch Selection */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium">Filter by Branch:</label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Branches</SelectItem>
              {Array.isArray(branches) && branches.map((branch: any) => (
                <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                  {branch.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
        </TabsList>

        {/* Purchase Tab */}
        <TabsContent value="purchase" className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Purchase Entries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Slip No</th>
                    <th className="px-4 py-2 text-left">Vehicle In Time</th>
                    <th className="px-4 py-2 text-left">Vehicle Out Time</th>
                    <th className="px-4 py-2 text-left">Entry Type</th>
                    <th className="px-4 py-2 text-left">Vehicle No</th>
                    <th className="px-4 py-2 text-left">Vendor</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRecords.map((record: PurchaseRecord) => (
                    <tr key={record.wb_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{record.slip_no}</td>
                      <td className="px-4 py-2">
                        {record.slip_in_time ? new Date(record.slip_in_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2">
                        {record.slip_out_time ? new Date(record.slip_out_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          record.online_entry ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.online_entry ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-2">{record.vehicle_no || '---'}</td>
                      <td className="px-4 py-2">{record.vendor_name || '---'}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(record.wb_id)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePrintRecord(record)}
                          >
                            Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {purchaseRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No purchase records found
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Sale Tab */}
        <TabsContent value="sale" className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Sale Entries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Slip No</th>
                    <th className="px-4 py-2 text-left">Vehicle In Time</th>
                    <th className="px-4 py-2 text-left">Vehicle Out Time</th>
                    <th className="px-4 py-2 text-left">Entry Type</th>
                    <th className="px-4 py-2 text-left">Vehicle No</th>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRecords.map((record: SaleRecord) => (
                    <tr key={record.wb_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2">{record.slip_no}</td>
                      <td className="px-4 py-2">
                        {record.slip_in_time ? new Date(record.slip_in_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2">
                        {record.slip_out_time ? new Date(record.slip_out_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          Sale
                        </span>
                      </td>
                      <td className="px-4 py-2">{record.vehicle_no || '---'}</td>
                      <td className="px-4 py-2">{record.customer_name || '---'}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(record.wb_id)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePrintRecord(record)}
                          >
                            Print
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salesRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No sale records found
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}