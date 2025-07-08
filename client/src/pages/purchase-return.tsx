
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

export default function PurchaseReturnForm() {
  const [location, setLocation] = useLocation();
  const [type, setType] = useState('');
  const { user } = useAuth();
  const [searchSlipNo, setSearchSlipNo] = useState('');
  const [searchVehicleNo, setSearchVehicleNo] = useState('');
  const [activeTab, setActiveTab] = useState('purchase');
  const [selectedForm, setSelectedForm] = useState<'purchase' | 'sales' | 'offline'>('purchase');
  const [isReturnMode, setIsReturnMode] = useState(true); // Always true for return form

  // Deduction/Bag table state
  const [bagTableData, setBagTableData] = useState<any[]>([]);
  const [percentageMode, setPercentageMode] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const currentType = searchParams.get('type');
    const returnParam = searchParams.get('return');
    console.log('Type param changed:', currentType);
    console.log('Return param:', returnParam);
    setType(currentType ?? "");
    setIsReturnMode(true); // Always true for return form

  }, [location]);

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

  // Filter records based on search criteria and form type
  const filteredRecords = (() => {
    let records = [];
    
    if (selectedForm === 'offline') {
      // Show offline records when offline tab is selected
      records = Array.isArray(offlineRecords) ? offlineRecords : [];
    } else {
      // Show all first weight records for other tabs
      records = Array.isArray(firstWeightRecords) ? firstWeightRecords : [];
    }
    
    return records.filter((record: any) => {
      const matchesSlipNo = !searchSlipNo || (record.slip_no || '').toString().toLowerCase().includes(searchSlipNo.toLowerCase());
      const matchesVehicleNo = !searchVehicleNo || (record.vehicle_no || '').toString().toLowerCase().includes(searchVehicleNo.toLowerCase());
      return matchesSlipNo && matchesVehicleNo;
    });
  })();

  // Print report function
  const handlePrintReport = () => {
    if (!formData.slipNo) {
      alert('Please save the record first or load an existing slip to print');
      return;
    }

    // Create print window with report data
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the report');
      return;
    }

    const reportHTML = generateReportHTML();
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate HTML for the weighbridge report
  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).toUpperCase().replace(/\s/g, '-');

    const currentTime = new Date().toLocaleTimeString('en-GB', {
      hour12: false
    });

    return `
   <!DOCTYPE html>
  <html>
  <head>
    <title>Purchase Return Slip - ${formData.slipNo}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; }
      .page-container { height: 150vh; display: flex; flex-direction: column; }

      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .copy-label { font-weight: bold; }
      .print-date { font-size: 10px; }

      .slip-section { 
        border: 2px solid #000; 
        margin-bottom: 10px; 
        padding: 10px; 
        height: 150vh;
        box-sizing: border-box;
      }

      .image-box {
        border: 1px solid #ccc;
        width: 150px;
        height: 120px;
        display: flex;
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

      .company-name { font-size: 14px; font-weight: bold; margin-bottom: 3px; text-align: center; }
      .slip-title { font-size: 12px; font-weight: bold; margin-bottom: 8px; text-align: center; }

      .two-column { display: flex; justify-content: space-between; margin-bottom: 5px; }
      .left-section, .right-section { 
        width: 45%; 
        border: 1px solid #666; 
        padding: 5px; 
        border-radius: 3px;
      }

      .commodity-gross-row {
        display: flex; 
        justify-content: space-between; 
        gap: 20px; 
        margin: 20px 0;
      }

      .section-box {
        flex: 1;
        border: 1px solid #666;
        padding: 10px;
        border-radius: 3px;
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }

      .fields {
        display: grid; 
        row-gap: 6px;
      }

      .fields div {
        display: flex;
        gap: 4px;
      }

      .label {
        font-weight: bold;
        width: 160px;
      }

      .value {
        font-weight: bold;
      }

      .signatures {
        margin-top: 30px;
        margin-bottom: 30px;
        display: flex;
        justify-content: space-between;
        text-align: center;
      }

      .signature-block {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .signature-line {
        border-bottom: 1px solid #000;
        width: 100px;
        margin-bottom: 5px;
      }

      @media print { 
        body { margin: 0; } 
        .slip-section { page-break-inside: avoid; }
        .page-container { page-break-after: auto; }
      }
    </style>
  </head>
  <body>
    <div class="page-container">

      <!-- Head Office Copy -->
      <div class="slip-section">
        <div class="header">
          <div class="copy-label">Head Office Copy - Purchase Return</div>
          <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
        </div>
        <div class="company-name">Shahzor  Feed  Mill</div>
        <div style="height: 10px;"></div>
        <div class="slip-title">PURCHASE RETURN SLIP</div>

        <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${formData.igpNo || ''}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div style="margin-top: 10px;">W.B # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipNo || ''}</div>
            <div style="margin-top: 10px;">Truck # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.vehicleNo || ''}</div>
            <div style="margin-top: 10px;">Freight Payment &nbsp;&nbsp;&nbsp;&nbsp; ${formData.freight || ''}</div>
          </div>
          <div class="right-section">
            <div>Party: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>${formData.vendor || ''}</b></div>
            <div style="margin-top: 10px;">Time IN: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipInTime ? new Date(formData.slipInTime).toLocaleString('en-GB', {day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}).toUpperCase().replace(/,/, '') : ''}</div>
            <div style="margin-top: 10px;">Time OUT: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipOutTime ? new Date(formData.slipOutTime).toLocaleString('en-GB', {day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}).toUpperCase().replace(/,/, '') : ''}</div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">COMMODITY</span><span class="value">${formData.itemDesc || ''}</span></div>
              <div><span class="label">QUANTITY</span><span class="value">${formData.noOfBags || ''}</span></div>
              <div><span class="label">BAG CONDITION</span><span class="value">${formData.bagCondition || ''}</span></div>
              <div><span class="label">BAG TYPE</span><span class="value">${formData.bardanaType || ''}</span></div>
              <div><span class="label">AVG. WEIGHT</span><span class="value">${formData.wtPerBag || ''}</span></div>
              <div><span class="label">RETURN REASON</span><span class="value">${formData.returnReason || ''}</span></div>
            </div>
            <div class="image-box">
              <img src="/captured_images/first_weight/slip_${formData.slipNo}.jpg"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                   alt="First Weight Image" />
              <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
            </div>
          </div>

          <!-- Gross Weight Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">GROSS WEIGHT</span> ${formData.firstWeight || '0'}</div>
              <div><span class="label">TARE WEIGHT</span> ${formData.secondWeight || '0'}</div>
              <div><span class="label">WITH BARDANA WEIGHT</span> ${formData.grossWeight || '0'}</div>
              <div><span class="label">BARDANA WEIGHT</span> ${formData.bardanaWeight || '0'}</div>
              <div><span class="label">QUALITY DEDUCTION</span> ${formData.qualityDeduction || '0'}</div>
              <div><span class="label">NET WEIGHT</span> ${formData.netWeight || '0'}</div>
            </div>
            <div class="image-box">
              <img src="/captured_images/second_weight/slip_${formData.slipNo}.jpg"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                   alt="Second Weight Image" />
              <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
            </div>
          </div>
        </div>

        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div>Weight By</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div>Checked By</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div>Production Manager</div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
`;
  };

  // Function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const initialFormData = {
    // Basic slip information
    slipNo: '',
    slipInTime: '',
    slipOutTime: '',
    slipDate: '',
    status: '',
    entryType: 'PURCHASE_RETURN',
    // Weight measurements
    firstWeight: '',
    secondWeight: '',
    netWeight: '',
    bardanaWeight: '',
    grossWeight: '',
    supplierWeight: '',
    supplierWeightMinusBardana: '',
    supplierWeightMinusOutWeight: '',
    qualityDeduction: '',
    // Vehicle and driver information
    vehicleNo: '',
    driverName: '',
    // IGP and purchase details
    igpNo: '',
    igpDate: '',
    poNo: '',
    po_no: '',
    itemCode: '',
    itemDesc: '',
    poQty: '',
    igpQty: '',
    balanceQty: '',
    // Bardana information
    bardanaType: '',
    wtPerBag: '',
    noOfBags: '',
    bagCondition: '',
    bardanaTypeId: '',
    // Vendor information
    vendor: '',
    vendorName: '',
    customerId: '',
    customerName: '',
    // Return specific fields
    returnReason: '',
    returnDate: '',
    originalSlipNo: '',
    // System fields
    wbId: '',
    companyId: '',
    branchId: '',
    branch: '',
    onlineEntry: 'Yes',
    offlineEntry: '',
    createdBy: '',
    creationDate: '',
    lastUpdatedBy: '',
    lastUpdatedDate: '',
    manualDcNo: '',
    // Additional fields
    doId: '',
    doNo: '',
    doDate: '',
    freight: '',
    remarks: '',
    // Missing fields that are referenced in the code
    qualityDed: '',
    weight: '',
    bags: '',
    wbItemPId: '',
    itemId: '',
    poId: '',
    baradanaType: '',
    manualIgpNo: '',
    igpId: '',
    vendorId: '',
    weightPerBags: '',
    dcQty: '',
    supWeightWithoutBardana: '',
    netSupplierWeight: '',
    isPercentageMode: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWbId, setEditingWbId] = useState<number | null>(null);

  const [onlineMode, setOnlineMode] = useState(() => {
    // Initialize based on URL parameter immediately
    const urlParams = new URLSearchParams(window.location.search);
    const typeMode = urlParams.get('type');
    console.log('Initial state calculation - typeMode:', typeMode);
    if (typeMode === 'offline') {
      console.log('Setting initial state to OFFLINE');
      return false;
    } else if (typeMode === 'online') {
      console.log('Setting initial state to ONLINE');
      return true;
    }
    // Default to online if no parameter specified
    console.log('No type parameter, defaulting to ONLINE');
    return true;
  });
  const [plateReading, setPlateReading] = useState(false);
  const [igpItems, setIgpItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [entryTypes, setEntryTypes] = useState<any[]>([]);

  // Auto-calculate formulas when relevant fields change
  useEffect(() => {
    const firstWeight = parseFloat(formData.firstWeight) || 0;
    const secondWeight = parseFloat(formData.secondWeight) || 0;
    const wtPerBag = parseFloat(formData.wtPerBag) || 0;
    const noOfBags = parseFloat(formData.noOfBags) || 0;

    // Bardana Weight = weight per bag * number of bags
    const bardanaWeight = wtPerBag * noOfBags;

    // Gross Weight = First Weight - Second Weight
    const grossWeight = firstWeight - secondWeight;

    // Net Weight = First Weight - Second Weight - Bardana Weight
    const netWeight = grossWeight - bardanaWeight;

    setFormData(prev => ({
      ...prev,
      bardanaWeight: bardanaWeight > 0 ? bardanaWeight.toFixed(2) : '0.00',
      grossWeight: grossWeight > 0 ? grossWeight.toFixed(2) : '0.00',
      netWeight: netWeight > 0 ? netWeight.toFixed(2) : '0.00'
    }));
  }, [formData.firstWeight, formData.secondWeight, formData.wtPerBag, formData.noOfBags]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'firstWeight', 'secondWeight', 'netWeight',
      'bardanaWeight', 'grossWeight', 'freight',
      'companyId', 'branchId', 'createdBy', 'lastUpdatedBy',
      'wtPerBag', 'noOfBags'
    ];

    if (numericFields.includes(name)) {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => {
          const newData = { ...prev, [name]: value };

          // Auto-calculate bardana weight when wtPerBag or noOfBags changes
          if (name === 'wtPerBag' || name === 'noOfBags') {
            const wtPerBag = parseFloat(name === 'wtPerBag' ? value : prev.wtPerBag) || 0;
            const noOfBags = parseFloat(name === 'noOfBags' ? value : prev.noOfBags) || 0;
            const calculatedBardanaWeight = wtPerBag * noOfBags;
            newData.bardanaWeight = calculatedBardanaWeight > 0 ? String(calculatedBardanaWeight) : '';
          }

          return newData;
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleOnlineMode = (isOnline: boolean) => {
    console.log('toggleOnlineMode called with:', isOnline, 'Current onlineMode:', onlineMode);

    // Update state immediately
    setOnlineMode(isOnline);

    // Update URL to reflect the current mode
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('type', isOnline ? 'online' : 'offline');
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);

    // Update form data to reflect the mode change
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : 'No',
      offlineEntry: isOnline ? 'No' : 'Yes'
    }));

    console.log('Mode changed to:', isOnline ? 'ONLINE' : 'OFFLINE');
  };

  // Initialize form data
  useEffect(() => {
    // Fetch next slip number based on return mode
    const entryType = 'PURCHASE_RETURN';
    fetch(`/api/purchases/next-slip?entry_type=${entryType}`)
      .then(res => res.json())
      .then((data: any) => {
        setFormData(prev => ({ ...prev, slipNo: data.nextSlipNo }));
      })
      .catch((err: any) => {
        console.error('Error fetching next slip number:', err);
        setFormData(prev => ({ ...prev, slipNo: '1' }));
      });

    // Fetch branches for dropdown
    fetch('/api/branches')
      .then(res => res.json())
      .then((data: any[]) => {
        setBranches(data);
        console.log('Branches fetched:', data);

        // Set default branch based on logged-in user's branch
        if (data.length > 0 && (!formData.branchId || formData.branchId === '')) {
          const userBranchId = user?.branchId;
          const defaultBranch = userBranchId ? 
            data.find(b => b.branch_id === userBranchId) || data[0] : 
            data[0];
          setFormData(prev => ({
            ...prev,
            branchId: String(defaultBranch.branch_id),
            branch: String(defaultBranch.branch_id),
            createdBy: String(user?.userid || '')
          }));
        }
      })
      .catch((err: any) => {
        console.error('Error fetching branches:', err);
      });

    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: now.slice(0, 16),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
      returnDate: now.slice(0, 16)
    }));
  }, []);

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

      const currentTime = new Date().toISOString();

      // Update the secondWeight field with current weight reading and set slip_out_time
      setFormData(prev => ({
        ...prev,
        secondWeight: weightData.weight,
        slipOutTime: currentTime.slice(0, 16) // Format for datetime-local input
      }));
    } catch (error) {
      console.error('Error fetching weight data:', error);
      alert('Failed to capture weight reading');
    }
  };

  const handleSave = async () => {
    setLoading(true);

    // Validate that first weight is not null/empty when saving
    if (!formData.firstWeight || formData.firstWeight.trim() === '' || parseFloat(formData.firstWeight) <= 0) {
      alert('First weight is required and must be greater than 0');
      setLoading(false);
      return;
    }

    if (!formData.vehicleNo || formData.vehicleNo.trim() === '') {
      alert('Vehicle number is required');
      setLoading(false);
      return;
    }

    try {
      alert('Purchase return data saved successfully!');
      console.log('Purchase return form data:', formData);
      
      // Reset form to clean state
      setFormData(initialFormData);
    } catch (error) {
      console.error('Error saving purchase return data:', error);
      alert('Failed to save purchase return data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    // When Clear button is pressed, clear everything except Slip No
    const currentSlipNo = formData.slipNo;
    setFormData({
      ...initialFormData,
      slipNo: currentSlipNo
    });
    setIsEditMode(false);
    setEditingWbId(null);
  };

  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  const formatISODate = (localString: string) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  return (
    <div className="h-screen bg-gray-100 p-1 overflow-hidden relative">
      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="bg-blue-600 text-white p-2 rounded mb-2 text-center text-sm font-medium">
          EDIT MODE: Purchase Return Slip No. {formData.slipNo} (ID: {editingWbId})
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-white border rounded p-1 mb-1">
        <div className="flex gap-1 text-xs">
          <Button
            className="h-8 px-2 text-sm font-medium bg-gray-300 hover:bg-gray-400 text-black"
            onClick={() => {
              // Navigate to purchase form with same type
              const urlParams = new URLSearchParams(window.location.search);
              const typeMode = urlParams.get('type') || 'online';
              const targetUrl = `/purchase-form?type=${typeMode}`;
              window.history.pushState({}, '', targetUrl);
              setLocation(targetUrl);
            }}
          >
            Purchase
          </Button>
          <Button
            className="h-8 px-2 text-sm font-medium bg-gray-300 hover:bg-gray-400 text-black"
            onClick={() => {
              // Navigate to sales form with same type
              const urlParams = new URLSearchParams(window.location.search);
              const typeMode = urlParams.get('type') || 'online';
              const targetUrl = `/sales-form?type=${typeMode}`;
              window.history.pushState({}, '', targetUrl);
              setLocation(targetUrl);
            }}
          >
            Sale
          </Button>
          <Button
            className="h-8 px-2 text-sm font-medium bg-gray-300 hover:bg-gray-400 text-black"
            onClick={() => {
              // Navigate to sales return form with same type
              const urlParams = new URLSearchParams(window.location.search);
              const typeMode = urlParams.get('type') || 'online';
              const targetUrl = `/sales-return?type=${typeMode}`;
              window.history.pushState({}, '', targetUrl);
              setLocation(targetUrl);
            }}
          >
            Sales Return
          </Button>
          <Button className="h-8 px-2 text-sm font-medium bg-orange-700 text-white">
            Purchase Return
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 h-8 px-3 text-sm text-white font-medium"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
          <Button
            className="h-8 px-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium"
            onClick={handlePrintReport}
          >
            Print
          </Button>
          <Button 
            className="h-8 px-2 text-sm bg-yellow-500 text-xs"
            onClick={resetForm}
          >
            Clear
          </Button>
        </div>
        <div className="flex gap-1 items-center">
          {/* Weight Display */}
          <div className="mr-2">
            <WeightIndicator comPort="COM6" compact={true} />
          </div>
          <button
            className={`h-6 px-3 text-xs font-medium rounded transition-colors ${onlineMode === true ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-600"}`}
            onClick={() => toggleOnlineMode(true)}
          >
            ONLINE
          </button>
          <button
            className={`h-6 px-3 text-xs font-medium rounded transition-colors ${onlineMode === false ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-300 hover:bg-gray-400 text-gray-600"}`}
            onClick={() => toggleOnlineMode(false)}
          >
            OFFLINE
          </button>
        </div>
        <div className="text-2xl text-green-600 font-bold">2500</div>
      </div>

      {/* Main Form Layout */}
      <div className="bg-white p-1 rounded border h-[calc(100vh-60px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-1 h-full">
          {/* Left Side - Main Form (Columns 1-8) */}
          <div className="col-span-8">
            {/* Master Table Section */}
            <div className="bg-orange-50 p-2 rounded border mb-3">
              <div className="grid grid-cols-9 gap-1">
                {/* Column 1 - Left Form Fields */}
                <div className="col-span-3 space-y-1">
                  <div>
                    <Label className="text-xs text-black">Slip No</Label>
                    <Input
                      name="slipNo"
                      value={formData.slipNo}
                      readOnly
                      className="h-5 text-xs text-black w-20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Original Slip No</Label>
                    <Input
                      name="originalSlipNo"
                      value={formData.originalSlipNo}
                      onChange={handleChange}
                      className="h-5 text-xs text-black w-20"
                      placeholder="Original slip"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Net Weight</Label>
                    <Input
                      name="netWeight"
                      value={formData.netWeight}
                      onChange={handleChange}
                      className="h-5 text-xs bg-yellow-200 text-black w-20"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Vehicle No</Label>
                    <Input
                      name="vehicleNo"
                      value={formData.vehicleNo}
                      onChange={handleChange}
                      className="h-5 text-xs text-black w-28"
                      placeholder="Vehicle number"
                    />
                  </div>
                </div>

                {/* Column 2 - Weight Fields */}
                <div className="col-span-3 space-y-1">
                  <div>
                    <Label className="text-xs text-black">First Weight</Label>
                    <Input
                      name="firstWeight"
                      value={formData.firstWeight}
                      onChange={handleChange}
                      className="h-5 text-xs text-black"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Second Weight</Label>
                    <Input
                      name="secondWeight"
                      value={formData.secondWeight}
                      onChange={handleChange}
                      className="h-5 text-xs text-green-600"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Bardana Weight</Label>
                    <Input
                      name="bardanaWeight"
                      value={formData.bardanaWeight}
                      onChange={handleChange}
                      className="h-5 text-xs text-black"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Gross Weight</Label>
                    <Input
                      name="grossWeight"
                      value={formData.grossWeight}
                      readOnly
                      className="h-5 text-xs text-black"
                    />
                  </div>
                </div>

                {/* Column 3 - Return Fields */}
                <div className="col-span-3 space-y-1">
                  <div>
                    <Label className="text-xs text-black">Return Date</Label>
                    <Input
                      type="datetime-local"
                      name="returnDate"
                      value={formData.returnDate}
                      onChange={handleChange}
                      className="h-5 text-xs text-black"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Branch</Label>
                    <Select
                      name="branch"
                      value={formData.branch}
                      onValueChange={(value) =>
                        setFormData(prev => ({
                          ...prev,
                          branch: value,
                          branchId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-5 text-xs text-black">
                        <SelectValue placeholder="Select branch" className="text-black" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.branch_id} value={branch.branch_id.toString()}>
                            {branch.branch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-black">Return Reason</Label>
                    <Textarea
                      placeholder="Enter return reason"
                      name="returnReason"
                      value={formData.returnReason}
                      onChange={handleChange}
                      className="h-8 text-xs resize-none text-black placeholder:text-gray-500"
                    />
                  </div>
                  <div className="mt-6">
                    <div className="grid grid-cols-2 gap-1 mb-1">
                      <Button
                        className="h-5 bg-green-600 text-xs"
                        onClick={captureFirstWeight}
                      >
                        1st WHT
                      </Button>
                      <Button
                        className="h-5 bg-gray-500 text-xs"
                        onClick={captureSecondWeight}
                      >
                        2nd WHT
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Large Label Between Sections */}
            <div className="text-center py-4 mb-3">
              <div
                className={`inline-block px-8 py-3 rounded-lg shadow-md ${
                  onlineMode === true
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                    : "bg-gradient-to-r from-orange-700 to-orange-800 text-white"
                }`}
              >
                <h2 className="text-3xl font-bold tracking-wide">
                  {onlineMode === true ? "Purchase Return Online" : "Purchase Return Offline"}
                </h2>
              </div>
            </div>

            {/* Purchase Return Details Section */}
            <div className="bg-orange-50 p-2 rounded border">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-black">IGP No</Label>
                  <Input
                    name="igpNo"
                    value={formData.igpNo}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="IGP number"
                  />
                </div>
                <div>
                  <Label className="text-xs text-black">Vendor</Label>
                  <Input
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="Vendor name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-black">Item Description</Label>
                  <Input
                    name="itemDesc"
                    value={formData.itemDesc}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="Item description"
                  />
                </div>
                <div>
                  <Label className="text-xs text-black">No of Bags</Label>
                  <Input
                    name="noOfBags"
                    value={formData.noOfBags}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="Number of bags"
                  />
                </div>
                <div>
                  <Label className="text-xs text-black">Weight Per Bag</Label>
                  <Input
                    name="wtPerBag"
                    value={formData.wtPerBag}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="Weight per bag"
                  />
                </div>
                <div>
                  <Label className="text-xs text-black">Bardana Type</Label>
                  <Input
                    name="bardanaType"
                    value={formData.bardanaType}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="Bardana type"
                  />
                </div>
                <div>
                  <Label className="text-xs text-black">Driver Name</Label>
                  <Input
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="Driver name"
                  />
                </div>
                <div>
                  <Label className="text-xs text-black">Freight</Label>
                  <Input
                    name="freight"
                    value={formData.freight}
                    onChange={handleChange}
                    className="h-6 text-xs text-black"
                    placeholder="Freight amount"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label className="text-xs text-black">Remarks</Label>
                <Textarea
                  placeholder="Add remarks"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="h-16 text-xs resize-none text-black placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Right Side - Camera Feed */}
          <div className="col-span-4">
            <div className="h-full w-full overflow-hidden rounded">
              <VideoStreamFullscreen
                camera={{
                  id: 1,
                  name: "Camera 01",
                  ip: "10.10.10.146",
                  port: 554,
                }}
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

export default PurchaseReturnForm;
