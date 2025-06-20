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
    queryFn: async () => {
      const url = (selectedBranch && selectedBranch !== 'all') 
        ? `/api/sales?branch_id=${selectedBranch}` 
        : '/api/sales';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sales data');
      }
      return data;
    },
  });

  // Ensure salesRecords is always an array
  const salesRecords = Array.isArray(salesData) ? salesData : [];

  // Fetch offline entries
  const { data: offlineData, refetch: refetchOffline, error: offlineError } = useQuery({
    queryKey: ['/api/purchases/offline', selectedBranch],
    queryFn: async () => {
      const url = (selectedBranch && selectedBranch !== 'all') 
        ? `/api/purchases/offline?branch_id=${selectedBranch}` 
        : '/api/purchases/offline';
      console.log('Fetching offline data from URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Offline API response:', data);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch offline data');
      }
      return data;
    },
    refetchOnMount: true, // Always fetch fresh data
  });

  // Ensure offlineRecords is always an array
  const offlineRecords = Array.isArray(offlineData) ? offlineData : [];

  // Refetch data when branch selection changes
  useEffect(() => {
    refetchPurchase();
    refetchSales();
    refetchOffline();
  }, [selectedBranch, refetchPurchase, refetchSales, refetchOffline]);

  const handleEdit = (wbId: number, entryType?: string) => {
    // Navigate to purchase form with edit mode and proper form type
    if (entryType === 'SALE') {
      setLocation(`/purchase-form?form=sales&edit=${wbId}`);
    } else {
      setLocation(`/purchase-form?form=purchase&edit=${wbId}`);
    }
  };

  const handleOfflineEdit = (record: any) => {
    // Navigate to purchase form with proper form type based on entry type
    if (record.entry_type === 'SALE') {
      setLocation(`/purchase-form?form=sales&edit=${record.wb_id}`);
    } else {
      setLocation(`/purchase-form?form=purchase&edit=${record.wb_id}`);
    }
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
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 5mm; 
            font-size: 11px;
            line-height: 1.2;
          }
          .page-container {
            width: 210mm;
            margin: 0 auto;
            border: 3px solid #000;
          }
          .slip { 
            border-bottom: 2px solid #000; 
            padding: 8mm; 
            height: 90mm;
            position: relative;
            box-sizing: border-box;
          }
          .slip:last-child { 
            border-bottom: none; 
          }
          .slip-header { 
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
          }
          .header-left {
            font-weight: bold;
            font-size: 12px;
          }
          .header-center {
            text-align: center;
            flex: 1;
          }
          .header-right {
            font-size: 10px;
            text-align: right;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin: 2px 0;
          }
          .slip-title {
            font-size: 13px;
            font-weight: bold;
            text-decoration: underline;
          }
          .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8mm;
            margin-bottom: 8mm;
          }
          .images-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8mm;
            margin-bottom: 35mm;
          }
          .image-title {
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            padding: 4px;
            background-color: #f0f0f0;
            border-bottom: 2px solid #000;
          }
          .left-panel, .right-panel {
            border: 2px solid #000;
            padding: 4mm;
            display: flex;
            flex-direction: column;
          }
          .field-group {
            margin-bottom: 6px;
          }
          .field-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            padding: 1px 0;
            border-bottom: 1px dotted #999;
          }
          .field-label {
            font-weight: bold;
            min-width: 50px;
          }
          .field-value {
            flex: 1;
            text-align: right;
            font-weight: bold;
          }
          .commodity-section {
            border: 2px solid #000;
            padding: 3mm;
            margin: 4mm 0;
            flex: 1;
          }
          .commodity-header {
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 4px;
          }
          .weight-section {
            border: 2px solid #000;
            padding: 3mm;
            margin: 4mm 0;
            flex: 1;
          }
          .weight-header {
            font-weight: bold;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 4px;
          }
          .image-box {
            border: 3px solid #000;
            height: 25mm;
            margin: 3mm 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: #f8f8f8;
            font-size: 10px;
            font-weight: bold;
            text-align: center;
            overflow: hidden;
            position: relative;
          }
          .image-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }
          .image-fallback {
            display: none;
            text-align: center;
            padding: 20px;
            font-weight: bold;
            color: #666;
          }
          .signatures {
            position: absolute;
            bottom: 8mm;
            left: 8mm;
            right: 8mm;
            display: flex;
            justify-content: space-between;
            border-top: 2px solid #000;
            padding-top: 4mm;
          }
          .signature {
            text-align: center;
            width: 30%;
            font-size: 10px;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            height: 5mm;
            margin-bottom: 2mm;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .page-container { width: 100%; }
            .slip { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Head Office Copy -->
          <div class="slip">
            <div class="slip-header">
              <div class="header-left">Head Office Copy</div>
              <div class="header-center">
                <div class="company-name">Shahzor Feed Mill</div>
                <div class="slip-title">WEIGH BRIDGE SLIP</div>
              </div>
              <div class="header-right">Print Date: ${currentDate}<br>${currentTime}</div>
            </div>
            
            <div class="content-grid">
              <div class="left-panel">
                <div class="field-group">
                  <div class="field-row">
                    <span class="field-label">IGP #</span>
                    <span class="field-value">${record.slip_no || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">W.B #</span>
                    <span class="field-value">${record.wb_id || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Truck #</span>
                    <span class="field-value">${record.vehicle_no || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Freight Payment</span>
                    <span class="field-value"></span>
                  </div>
                </div>
                
                <div class="commodity-section">
                  <div class="commodity-header">Commodity</div>
                  <div class="field-row">
                    <span class="field-label">Item</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Quantity</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Bag Condition</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Bag Type</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Avg. Weight</span>
                    <span class="field-value"></span>
                  </div>
                </div>
                
                <div class="field-row">
                  <span class="field-label">Remarks</span>
                  <span class="field-value"></span>
                </div>
                
                <div class="image-box">
                  <div style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">First Weight Image</div>
                  <div style="font-size: 8px; color: #666; margin-bottom: 2px;">C:\\Users\\Wajid Ali\\Downloads\\CameraStreamMonitor\\captured_images\\first_weight</div>
                  <img src="/captured_images/first_weight/slip_${record.slip_no}.jpg" 
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                       style="width: 100%; height: 100%; object-fit: cover;" 
                       alt="First Weight Image" />
                  <div style="display: none; text-align: center; padding: 10px; color: #666; font-size: 10px;">No Image Available</div>
                </div>
              </div>
              
              <div class="right-panel">
                <div class="field-group">
                  <div class="field-row">
                    <span class="field-label">Party</span>
                    <span class="field-value">${'vendor_name' in record ? record.vendor_name || '' : 'customer_name' in record ? record.customer_name || '' : ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Time IN</span>
                    <span class="field-value">${inTime}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Time OUT</span>
                    <span class="field-value">${outTime}</span>
                  </div>
                </div>
                
                <div class="weight-section">
                  <div class="weight-header">WEIGHTS</div>
                  <div class="field-row">
                    <span class="field-label">GROSS WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">TARE WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">WITH BARDANA WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">BARDANA WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">QUALITY DEDUCTION</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">NET WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                </div>
                
                <div class="image-box">
                  <div style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Second Weight Image</div>
                  <div style="font-size: 8px; color: #666; margin-bottom: 2px;">C:\\Users\\Wajid Ali\\Downloads\\CameraStreamMonitor\\captured_images\\second_weight</div>
                  <img src="/captured_images/second_weight/slip_${record.slip_no}.jpg" 
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                       style="width: 100%; height: 100%; object-fit: cover;" 
                       alt="Second Weight Image" />
                  <div style="display: none; text-align: center; padding: 10px; color: #666; font-size: 10px;">No Image Available</div>
                </div>
              </div>
            </div>
            
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <div>Weight By:</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div>Checked By:</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div>Production Manager:</div>
              </div>
            </div>
          </div>

          <!-- Feed Mill Copy -->
          <div class="slip">
            <div class="slip-header">
              <div class="header-left">Feed Mill Copy</div>
              <div class="header-center">
                <div class="company-name">Shahzor Feed Mill</div>
                <div class="slip-title">WEIGH BRIDGE SLIP</div>
              </div>
              <div class="header-right"></div>
            </div>
            
            <div class="content-grid">
              <div class="left-panel">
                <div class="field-group">
                  <div class="field-row">
                    <span class="field-label">IGP #</span>
                    <span class="field-value">${record.slip_no || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">W.B #</span>
                    <span class="field-value">${record.wb_id || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Truck #</span>
                    <span class="field-value">${record.vehicle_no || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Freight Payment</span>
                    <span class="field-value"></span>
                  </div>
                </div>
                
                <div class="commodity-section">
                  <div class="commodity-header">Commodity</div>
                  <div class="field-row">
                    <span class="field-label">Item</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Quantity</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Bag Condition</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Bag Type</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Avg. Weight</span>
                    <span class="field-value"></span>
                  </div>
                </div>
                
                <div class="field-row">
                  <span class="field-label">Remarks</span>
                  <span class="field-value"></span>
                </div>
                
                <div class="image-box">
                  <div style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">First Weight Image</div>
                  <div style="font-size: 8px; color: #666; margin-bottom: 2px;">C:\\Users\\Wajid Ali\\Downloads\\CameraStreamMonitor\\captured_images\\first_weight</div>
                  <img src="/captured_images/first_weight/slip_${record.slip_no}.jpg" 
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                       style="width: 100%; height: 100%; object-fit: cover;" 
                       alt="First Weight Image" />
                  <div style="display: none; text-align: center; padding: 10px; color: #666; font-size: 10px;">No Image Available</div>
                </div>
              </div>
              
              <div class="right-panel">
                <div class="field-group">
                  <div class="field-row">
                    <span class="field-label">Party</span>
                    <span class="field-value">${'vendor_name' in record ? record.vendor_name || '' : 'customer_name' in record ? record.customer_name || '' : ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Time IN</span>
                    <span class="field-value">${inTime}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Time OUT</span>
                    <span class="field-value">${outTime}</span>
                  </div>
                </div>
                
                <div class="weight-section">
                  <div class="weight-header">WEIGHTS</div>
                  <div class="field-row">
                    <span class="field-label">GROSS WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">TARE WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">WITH BARDANA WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">BARDANA WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">QUALITY DEDUCTION</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">NET WEIGHT</span>
                    <span class="field-value"></span>
                  </div>
                </div>
                
                <div class="image-box">
                  <div style="font-weight: bold; font-size: 10px; margin-bottom: 2px;">Second Weight Image</div>
                  <div style="font-size: 8px; color: #666; margin-bottom: 2px;">C:\\Users\\Wajid Ali\\Downloads\\CameraStreamMonitor\\captured_images\\second_weight</div>
                  <img src="/captured_images/second_weight/slip_${record.slip_no}.jpg" 
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                       style="width: 100%; height: 100%; object-fit: cover;" 
                       alt="Second Weight Image" />
                  <div style="display: none; text-align: center; padding: 10px; color: #666; font-size: 10px;">No Image Available</div>
                </div>
              </div>
            </div>
            
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <div>Weight By:</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div>Checked By:</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div>Production Manager:</div>
              </div>
            </div>
          </div>

          <!-- Customer Copy -->
          <div class="slip">
            <div class="slip-header">
              <div class="header-left">Customer Copy</div>
              <div class="header-center">
                <div class="company-name">Shahzor Feed Mill</div>
                <div class="slip-title">IGP SLIP</div>
              </div>
              <div class="header-right">Slip Date:<br>${inTime}</div>
            </div>
            
            <div class="content-grid">
              <div class="left-panel">
                <div class="field-group">
                  <div class="field-row">
                    <span class="field-label">W.B #</span>
                    <span class="field-value">${record.wb_id || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Party</span>
                    <span class="field-value">${'vendor_name' in record ? record.vendor_name || '' : 'customer_name' in record ? record.customer_name || '' : ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Commodity</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Truck #</span>
                    <span class="field-value">${record.vehicle_no || ''}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">Freight Payment</span>
                    <span class="field-value">232</span>
                  </div>
                </div>
                
              </div>
              
              <div class="right-panel">
                <div class="field-group">
                  <div class="field-row">
                    <span class="field-label">Slip Date</span>
                    <span class="field-value">${inTime}</span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">QUANTITY</span>
                    <span class="field-value"></span>
                  </div>
                  <div class="field-row">
                    <span class="field-label">NET WEIGHT</span>
                    <span class="field-value">12110</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="images-section">
              <div class="image-box">
                <div class="image-title">First Weight Image</div>
                <img src="/captured_images/first_weight/slip_${record.slip_no}.jpg" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                     style="width: 100%; height: 100%; object-fit: cover;" 
                     alt="First Weight Image" />
                <div style="display: none; text-align: center; padding: 10px; color: #666; font-size: 10px;">No Image Available</div>
              </div>
              
              <div class="image-box">
                <div class="image-title">Second Weight Image</div>
                <img src="/captured_images/second_weight/slip_${record.slip_no}.jpg" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                     style="width: 100%; height: 100%; object-fit: cover;" 
                     alt="Second Weight Image" />
                <div style="display: none; text-align: center; padding: 10px; color: #666; font-size: 10px;">No Image Available</div>
              </div>
            </div>
            
            <div class="signatures">
              <div class="signature">
                <div class="signature-line"></div>
                <div>Weight By:</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div>Checked By:</div>
              </div>
              <div class="signature">
                <div class="signature-line"></div>
                <div>Production Manager:</div>
              </div>
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
        <h1 className="text-2xl font-bold mb-4 text-black">Reports</h1>
        
        {/* Branch Selection */}
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-black">Filter by Branch:</label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48 border-black">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
          <TabsTrigger value="offline">Offline</TabsTrigger>
        </TabsList>

        {/* Purchase Tab */}
        <TabsContent value="purchase" className="space-y-4">
          <div className="bg-white rounded-lg shadow border-2 border-black">
            <div className="p-4 border-b-2 border-black">
              <h2 className="text-lg font-semibold text-black">Purchase Entries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left border border-black text-black">Slip No</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vehicle In Time</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vehicle Out Time</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Entry Type</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vehicle No</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vendor</th>
                    <th className="px-4 py-2 text-left border border-black text-black">First Weight Image</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Second Weight Image</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRecords.map((record: PurchaseRecord) => (
                    <tr key={record.wb_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-black text-black">{record.slip_no}</td>
                      <td className="px-4 py-2 border border-black text-black">
                        {record.slip_in_time ? new Date(record.slip_in_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2 border border-black text-black">
                        {record.slip_out_time ? new Date(record.slip_out_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2 border border-black text-black">
                        {record.entry_type || 'PURCHASE'}
                      </td>
                      <td className="px-4 py-2 border border-black text-black">{record.vehicle_no || '---'}</td>
                      <td className="px-4 py-2 border border-black text-black">{record.vendor_name || '---'}</td>
                      <td className="px-4 py-2 border border-black text-center">
                        <img 
                          src={`/captured_images/first_weight/slip_${record.slip_no}.jpg`}
                          alt="First Weight"
                          className="w-16 h-12 object-cover mx-auto cursor-pointer"
                          onClick={() => window.open(`/captured_images/first_weight/slip_${record.slip_no}.jpg`, '_blank')}
                          onLoad={() => console.log(`First weight image loaded for slip ${record.slip_no}`)}
                          onError={(e) => {
                            console.log(`First weight image error for slip ${record.slip_no}`);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling!.textContent = 'No Image';
                          }}
                        />
                        <span className="text-xs text-gray-500"></span>
                      </td>
                      <td className="px-4 py-2 border border-black text-center">
                        <img 
                          src={`/captured_images/second_weight/slip_${record.slip_no}.jpg`}
                          alt="Second Weight"
                          className="w-16 h-12 object-cover mx-auto cursor-pointer"
                          onClick={() => window.open(`/captured_images/second_weight/slip_${record.slip_no}.jpg`, '_blank')}
                          onLoad={() => console.log(`Second weight image loaded for slip ${record.slip_no}`)}
                          onError={(e) => {
                            console.log(`Second weight image error for slip ${record.slip_no}`);
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling!.textContent = 'No Image';
                          }}
                        />
                        <span className="text-xs text-gray-500"></span>
                      </td>
                      <td className="px-4 py-2 border border-black">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-black text-black hover:bg-gray-100"
                            onClick={() => handleEdit(record.wb_id)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-black text-black hover:bg-gray-100"
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
              {purchaseError && (
                <div className="text-center py-8 text-red-500 border border-black">
                  Error loading purchase records. Please try again.
                </div>
              )}
              {!purchaseError && purchaseRecords.length === 0 && (
                <div className="text-center py-8 text-black border border-black">
                  No purchase records found
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Sale Tab */}
        <TabsContent value="sale" className="space-y-4">
          <div className="bg-white rounded-lg shadow border-2 border-black">
            <div className="p-4 border-b-2 border-black">
              <h2 className="text-lg font-semibold text-black">Sale Entries</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left border border-black text-black">Slip No</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vehicle In Time</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vehicle Out Time</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Entry Type</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vehicle No</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Customer</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRecords.map((record: SaleRecord) => (
                    <tr key={record.wb_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-black text-black">{record.slip_no}</td>
                      <td className="px-4 py-2 border border-black text-black">
                        {record.slip_in_time ? new Date(record.slip_in_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2 border border-black text-black">
                        {record.slip_out_time ? new Date(record.slip_out_time).toLocaleString() : '---'}
                      </td>
                      <td className="px-4 py-2 border border-black text-black">
                        {record.entry_type || 'SALE'}
                      </td>
                      <td className="px-4 py-2 border border-black text-black">{record.vehicle_no || '---'}</td>
                      <td className="px-4 py-2 border border-black text-black">{record.customer_name || '---'}</td>
                      <td className="px-4 py-2 border border-black">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-black text-black hover:bg-gray-100"
                            onClick={() => handleEdit(record.wb_id)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-black text-black hover:bg-gray-100"
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
              {salesError && (
                <div className="text-center py-8 text-red-500 border border-black">
                  Error loading sales records. Please try again.
                </div>
              )}
              {!salesError && salesRecords.length === 0 && (
                <div className="text-center py-8 text-black border border-black">
                  No sale records found
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Offline Tab */}
        <TabsContent value="offline" className="space-y-4">
          <div className="bg-white rounded-lg shadow border-2 border-black">
            <div className="p-4 border-b-2 border-black">
              <h2 className="text-lg font-semibold text-black">Offline Entries (Click slip number to edit)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left border border-black text-black">Slip No</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Slip Date</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Entry Type</th>
                    <th className="px-4 py-2 text-left border border-black text-black">First Weight</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Second Weight</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Vehicle No</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Company Name</th>
                    <th className="px-4 py-2 text-left border border-black text-black">Manual Trans #</th>
                  </tr>
                </thead>
                <tbody>
                  {offlineRecords.map((record: PurchaseRecord) => (
                    <tr key={record.wb_id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-black text-black">
                        <button 
                          className="text-blue-600 hover:text-blue-800 font-medium underline"
                          onClick={() => handleOfflineEdit(record)}
                        >
                          {record.slip_no}
                        </button>
                      </td>
                      <td className="px-4 py-2 border border-black text-black">
                        {record.slip_in_time ? new Date(record.slip_in_time).toLocaleDateString() : '---'}
                      </td>
                      <td className="px-4 py-2 border border-black text-black">{record.entry_type || 'PURCHASE'}</td>
                      <td className="px-4 py-2 border border-black text-black">---</td>
                      <td className="px-4 py-2 border border-black text-black">---</td>
                      <td className="px-4 py-2 border border-black text-black">{record.vehicle_no || '---'}</td>
                      <td className="px-4 py-2 border border-black text-black">{record.vendor_name || '---'}</td>
                      <td className="px-4 py-2 border border-black text-black">---</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {offlineError && (
                <div className="text-center py-8 text-red-500 border border-black">
                  Error loading offline records. Please try again.
                </div>
              )}
              {!offlineError && offlineRecords.length === 0 && (
                <div className="text-center py-8 text-black border border-black">
                  No offline records found
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}