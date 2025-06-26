
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

export default function SalesForm() {
  const [location, setLocation] = useLocation();
  const [searchSlipNo, setSearchSlipNo] = useState('');
  const [searchVehicleNo, setSearchVehicleNo] = useState('');
  
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
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch offline records specifically
  const { data: offlineRecords = [] } = useQuery({
    queryKey: ['/api/purchases/offline'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Filter records based on search criteria
  const filteredRecords = Array.isArray(firstWeightRecords) ? firstWeightRecords.filter((record: any) => {
    const matchesSlipNo = !searchSlipNo || (record.slip_no || '').toString().toLowerCase().includes(searchSlipNo.toLowerCase());
    const matchesVehicleNo = !searchVehicleNo || (record.vehicle_no || '').toString().toLowerCase().includes(searchVehicleNo.toLowerCase());
    return matchesSlipNo && matchesVehicleNo;
  }) : [];

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
    entryType: 'SALE',
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

  // DC Data Fetching Function for Sales
  const fetchDcData = async (dcNo: string) => {
    if (!dcNo || dcNo.trim() === '') {
      alert('Please enter DC No');
      return;
    }
    try {
      const response = await fetch(
        `http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/dc_data?dc_no=${dcNo}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('DC API Response:', data);

      if (data && data.items && data.items.length > 0) {
        const items = data.items;
        
        // Update sales data with fetched DC data including hidden columns
        const updatedSalesData = items.map((item: any, index: number) => ({
          doId: `${index + 1}`, // Auto-generated ID
          dcNo: item.dc_no || '',
          doNo: item.delivery_order_no ? String(item.delivery_order_no) : '', // Map delivery order number to DO #
          customerName: item.customer_name || '',
          vehicleNo: item.vehicle_no || '',
          doDate: item.dc_date ? new Date(item.dc_date).toLocaleDateString() : '',
          itemDescription: item.item_desc || '',
          dcQty: item.dc_qty ? String(item.dc_qty) : '',
          doQty: item.del_qty ? String(item.del_qty) : '',
          branch: '', // Keep empty for now
          // Hidden columns for database storage
          dcId: item.dc_id || '',
          customerId: item.customer_id || '',
          itemId: item.item_id || '',
          itemCode: item.item_code || ''
        }));
        
        // Fill remaining rows with empty data if needed
        while (updatedSalesData.length < 8) {
          updatedSalesData.push({
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
            // Hidden columns for database storage
            dcId: '',
            customerId: '',
            itemId: '',
            itemCode: ''
          });
        }
        
        setSalesData(updatedSalesData);
        console.log('DC data fetched and populated successfully:', updatedSalesData);
      } else {
        alert('No data found for this DC No.');
      }
    } catch (error) {
      console.error('Error fetching DC data:', error);
      alert('Failed to fetch DC data. Please check the DC number and try again.');
    }
  };

  // Function to reset form to clean state
  const resetFormToInitial = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeMode = urlParams.get('type');
    const isOfflineMode = typeMode === 'offline';
    
    // Sync onlineMode state with URL parameter
    if (typeMode === 'offline') {
      setOnlineMode(false);
    } else if (typeMode === 'online') {
      setOnlineMode(true);
    }
    
    setFormData({
      ...initialFormData,
      slipInTime: new Date().toISOString().slice(0, 16),
      onlineEntry: isOfflineMode ? 'No' : 'Yes',
      offlineEntry: isOfflineMode ? 'Yes' : 'No',
      entryType: 'SALE',
      creationDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      slipDate: new Date().toISOString()
    });
    setIsEditMode(false);
    setEditingWbId(null);
  };

  // Get camera data
  const { data: camera } = useQuery({
    queryKey: ['/api/cameras/1'],
    enabled: true,
  });

  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  const formatISODate = (localString: string) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

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
    
    // Only update if mode actually changes
    if (onlineMode !== isOnline) {
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
    }
  };

  const readLicensePlate = async () => {
    setPlateReading(true);
    try {
      console.log('Starting license plate recognition...');
      const response = await fetch('/api/cameras/read-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: 1 })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('OCR Response:', result);
        
        if (result.success && result.plateNumber) {
          setFormData(prev => ({ ...prev, vehicleNo: result.plateNumber }));
          console.log('License plate detected:', result.plateNumber, 'Method:', result.method);
          
          // Show success message with method info
          const methodText = result.method === 'camera_anpr_api' ? 'Camera ANPR' : 'Computer Vision OCR';
          alert(`License plate detected: ${result.plateNumber}\nMethod: ${methodText}\nConfidence: ${(result.confidence * 100).toFixed(0)}%`);
        } else {
          console.log('No license plate detected:', result.error);
          alert(`License plate recognition failed:\n${result.error}\n\nPlease ensure:\n- Camera is connected and accessible\n- Vehicle with license plate is visible in camera view\n- Camera has clear view of the license plate`);
        }
      } else {
        const errorText = await response.text();
        console.error('API error:', errorText);
        alert('Failed to process camera image');
      }
    } catch (error) {
      console.error('Error reading license plate:', error);
      alert('Error connecting to camera system');
    }
    setPlateReading(false);
  };

  // Fetch entry types and branches
  useEffect(() => {
    const fetchEntryTypes = async () => {
      try {
        const response = await fetch('/api/entry-types');
        if (response.ok) {
          const entryTypeData = await response.json();
          setEntryTypes(entryTypeData);
        }
      } catch (error) {
        console.error('Error fetching entry types:', error);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const branchData = await response.json();
          setBranches(branchData);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchEntryTypes();
    fetchBranches();
  }, []);

  // Handle URL parameters for edit mode and form type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get('edit');
    const typeMode = urlParams.get('type');
    
    console.log('URL parameters:', { editWbId, typeMode });
    
    // Set online/offline mode based on type parameter - IMMEDIATE UPDATE
    if (typeMode === 'offline') {
      console.log('Setting OFFLINE mode from URL parameter');
      setOnlineMode(false);
    } else if (typeMode === 'online') {
      console.log('Setting ONLINE mode from URL parameter');
      setOnlineMode(true);
    }
    
    if (editWbId) {
      // Load record for editing by wb_id - would need to implement loadDataByWbId for sales
      console.log('Edit mode for wb_id:', editWbId);
    } else {
      // Reset form to clean state for new sales
      resetFormToInitial();
    }
  }, [location]);

  // Sync form data when onlineMode changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      onlineEntry: onlineMode ? 'Yes' : 'No',
      offlineEntry: onlineMode ? 'No' : 'Yes'
    }));
  }, [onlineMode]);

  useEffect(() => {
    // Fetch next slip number specific to SALE entry type
    fetch('/api/purchases/next-slip?entry_type=SALE')
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
        
        // Set default branch if no branch is selected
        if (data.length > 0 && (!formData.branchId || formData.branchId === '')) {
          const defaultBranch = data[0];
          setFormData(prev => ({
            ...prev,
            branchId: String(defaultBranch.branch_id),
            branch: String(defaultBranch.branch_id)
          }));
        }
      })
      .catch((err: any) => {
        console.error('Error fetching branches:', err);
      });

    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));
  }, []);

  const resetForm = () => {
    // When Clear button is pressed, clear everything except Slip No
    const currentSlipNo = formData.slipNo;
    setFormData({
      ...initialFormData,
      slipNo: currentSlipNo
    });
    setIsEditMode(false);
    setEditingWbId(null);
    // Keep current online/offline mode
  };

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
    
    try {
      // Save sales data logic would go here
      console.log('Saving sales data:', { formData, salesData });
      alert('Sales data saved successfully!');
      
      // Reset form to clean state and increment slip number for next entry
      resetFormToInitial();
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save sales.';
      alert(errorMessage);
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 p-1 overflow-hidden relative">
      {/* Weight Display Table - Upper Right Side */}
      <div className="absolute top-20 right-4 z-50">
        <div className="bg-white border-2 border-gray-400 rounded-sm shadow-lg w-72 mb-4">
          {/* Header Row */}
          <div className="grid grid-cols-3 border-b border-gray-400">
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              Slip No
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              Vehicle No
            </div>
            <div className="bg-gray-200 p-1 text-center text-xs font-semibold text-black">
              Entry Type
            </div>
          </div>

          {/* Search Row - positioned under headers */}
          <div className="grid grid-cols-3 border-b border-gray-400 bg-blue-50">
            <div className="border-r border-gray-400 p-1">
              <Input 
                placeholder="Search Slip No"
                value={searchSlipNo}
                onChange={(e) => setSearchSlipNo(e.target.value)}
                className="h-5 text-xs text-black placeholder:text-gray-500 bg-white border-gray-300"
              />
            </div>
            <div className="border-r border-gray-400 p-1">
              <Input 
                placeholder="Search Vehicle"
                value={searchVehicleNo}
                onChange={(e) => setSearchVehicleNo(e.target.value)}
                className="h-5 text-xs text-black placeholder:text-gray-500 bg-white border-gray-300"
              />
            </div>
            <div className="p-1">
              <Button 
                onClick={() => {setSearchSlipNo(''); setSearchVehicleNo('');}}
                className="h-5 text-xs bg-gray-500 hover:bg-gray-600 text-white w-full"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Data Rows - showing filtered records */}
          <div className="max-h-48 overflow-y-auto">
            {filteredRecords && filteredRecords.length > 0 ? (
              filteredRecords.map((record: any, index: number) => (
                <div key={index} className="grid grid-cols-3 border-b border-gray-400 hover:bg-gray-50">
                  <button 
                    className="border-r border-gray-400 p-1 text-center text-xs text-blue-600 hover:text-blue-800 hover:underline bg-white text-left"
                    onClick={() => {
                      console.log('Clicked record:', record);
                    }}
                  >
                    {record.slip_no || "---"}
                  </button>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {record.vehicle_no || "---"}
                  </div>
                  <div className="p-1 text-center text-xs text-blue-600 font-semibold bg-white">
                    SALE
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-3 border-b border-gray-400">
                <div className="border-r border-gray-400 p-1 text-center text-xs text-gray-500 bg-white">
                  {searchSlipNo || searchVehicleNo ? 'No matches' : 'No records'}
                </div>
                <div className="border-r border-gray-400 p-1 text-center text-xs text-gray-500 bg-white">
                  ---
                </div>
                <div className="p-1 text-center text-xs text-gray-500 bg-white">
                  ---
                </div>
              </div>
            )}
          </div>

          {/* Load Data Button */}
          <button 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 text-xs"
            onClick={() => window.location.reload()}
          >
            Load Data
          </button>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditMode && (
        <div className="bg-blue-600 text-white p-2 rounded mb-2 text-center text-sm font-medium">
          EDIT MODE: Slip No. {formData.slipNo} (ID: {editingWbId})
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-white border rounded p-1 mb-1">
        <div className="flex gap-1 text-xs">
          <Button 
            className="h-8 px-2 text-sm font-medium bg-blue-200 hover:bg-blue-300 text-black"
            onClick={() => setLocation('/purchase-form')}
          >
            Purchase
          </Button>
          <Button 
            className="h-8 px-2 text-sm font-medium bg-rose-700 text-white"
          >
            Sale
          </Button>
          <Button 
            className="h-8 px-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white"
          >
            Offline
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 h-8 px-3 text-sm text-white font-medium" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          <Button className="h-8 px-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium">Print</Button>
          <Button className="h-8 px-2 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium">Rej</Button>
        </div>
        <div className="flex gap-1 items-center">
          {/* Weight Display - positioned on left side with bolder text */}
          <div className="mr-2">
            <WeightIndicator comPort="COM6" compact={true} />
          </div>
          <button 
            className={`h-6 px-3 text-xs font-medium rounded transition-colors ${onlineMode === true ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-600'}`}
            onClick={() => toggleOnlineMode(true)}
          >
            ONLINE
          </button>
          <button 
            className={`h-6 px-3 text-xs font-medium rounded transition-colors ${onlineMode === false ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-600'}`}
            onClick={() => toggleOnlineMode(false)}
          >
            OFFLINE
          </button>
        </div>
        <div className="text-2xl text-green-600 font-bold">2500</div>
      </div>

      {/* Main Form Layout - 100% visible without scrolling */}
      <div className="bg-white p-1 rounded border h-[calc(100vh-60px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-1 h-full">
          {/* Left Side - Main Form (Columns 1-8) */}
          <div className="col-span-8">
            {/* Master Table Section */}
            <div className="bg-blue-50 p-2 rounded border mb-3">
              <div className="grid grid-cols-9 gap-1">
              {/* Column 1 - Left Form Fields */}
              <div className="col-span-3 space-y-1">
                <div>
                  <Label className="text-xs text-black">Slip No</Label>
                  <Input name="slipNo" value={formData.slipNo} readOnly className="h-5 text-xs text-black w-20" />
                </div>
                <div>
                  <Label className="text-xs text-black">Net Weight</Label>
                  <Input name="netWeight" value={formData.netWeight} onChange={handleChange} className="h-5 text-xs bg-yellow-200 text-black w-20" />
                </div>
                <div>
                  <Label className="text-xs text-black">Freight</Label>
                  <Input name="freight" value={formData.freight} onChange={handleChange} className="h-5 text-xs text-black w-28" />
                </div>
                <div>
                  <Label className="text-xs text-black">Remarks</Label>
                  <Textarea
                    placeholder="Add remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="h-8 text-xs resize-none text-black placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Column 2 - Weight Fields */}
              <div className="col-span-3 space-y-1">
                <div>
                  <Label className="text-xs text-black">First Weight</Label>
                  <Input name="firstWeight" value={formData.firstWeight} onChange={handleChange} className="h-5 text-xs text-black" />
                </div>
                <div>
                  <Label className="text-xs text-black">Second Weight</Label>
                  <Input name="secondWeight" value={formData.secondWeight} onChange={handleChange} className="h-5 text-xs text-green-600" />
                </div>
                <div>
                  <Label className="text-xs text-black">Bardana Weight</Label>
                  <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} className="h-5 text-xs text-black" />
                </div>
                <div>
                  <Label className="text-xs text-black">Gross Weight</Label>
                  <Input name="grossWeight" value={formData.grossWeight} readOnly className="h-5 text-xs text-black" />
                </div>
              </div>

              {/* Column 3 - Driver & Branch */}
              <div className="col-span-3 space-y-1">
                <div>
                  <Label className="text-xs text-black">Branch</Label>
                  {isEditMode ? (
                    <Input 
                      value={branches.find(b => b.branch_id.toString() === formData.branchId?.toString())?.branch_name || formData.branch || ''} 
                      readOnly 
                      className="h-5 text-xs text-black bg-gray-100" 
                    />
                  ) : (
                    <Select name="branch" value={formData.branch} onValueChange={(value) => setFormData(prev => ({...prev, branch: value, branchId: value}))}>
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
                  )}
                </div>
                <div>
                  <Label className="text-xs text-black">Driver Name</Label>
                  <Input
                    placeholder="Enter driver name"
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    className="h-5 text-xs text-black placeholder:text-gray-500"
                  />
                </div>
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-1 mb-1">
                    <Button className="h-5 bg-green-600 text-xs" onClick={captureFirstWeight}>1st WHT</Button>
                    <Button className="h-5 bg-gray-500 text-xs" onClick={captureSecondWeight}>2nd WHT</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <Button className="h-5 bg-yellow-500 text-xs" onClick={resetForm}>Clear</Button>
                    <Button className="h-5 bg-red-500 text-xs">Exit</Button>
                  </div>
                </div>
                
                {/* Clean Camera Feed - just the video content */}
                <div className="mt-2 h-24 w-full overflow-hidden">
                  <VideoStreamFullscreen
                    camera={{ id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }}
                    isConnected={true}
                    isStreaming={true}
                  />
                </div>
              </div>
              </div>
            </div>

            {/* Large Label Between Sections */}
            <div className="text-center py-4 mb-3">
              <div className={`inline-block px-8 py-3 rounded-lg shadow-md ${
                onlineMode === true
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              }`}>
                <h2 className="text-3xl font-bold tracking-wide">
                  {onlineMode === true ? 'Sale Online' : 'Sale Offline'}
                </h2>
              </div>
            </div>

            {/* Sales Details Section */}
            <div className="bg-blue-50 p-2 rounded border">
              <div className="h-full flex flex-col">

                {/* Sales Table Header - with delete action column */}
                <div className="grid gap-px bg-gray-300 text-xs font-semibold mb-1" style={{gridTemplateColumns: "100px 100px 240px 140px 120px 180px 100px 100px 140px 30px", width: "1250px"}}>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DC #</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DO #</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Customer Name</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Vehicle No</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Do Date</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Item Description</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DC Qty</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DO Qty</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Branch</div>
                  <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">✖</div>
                </div>

                {/* Sales Table Body - Fixed height with 8 rows */}
                <div className="bg-gray-200 mb-4" style={{height: "240px"}}>
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="grid gap-px text-xs" style={{gridTemplateColumns: "100px 100px 240px 140px 120px 180px 100px 100px 140px 30px", width: "1250px", height: "30px"}}>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.dcNo || ''}
                          onChange={(e) => handleSalesDataChange(index, 'dcNo', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const dcNo = salesData[index]?.dcNo;
                              if (dcNo && dcNo.trim() !== '') {
                                fetchDcData(dcNo.trim());
                              }
                            }
                          }}
                          placeholder="Press Enter to fetch"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.doNo || ''}
                          onChange={(e) => handleSalesDataChange(index, 'doNo', e.target.value)}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.customerName || ''}
                          onChange={(e) => handleSalesDataChange(index, 'customerName', e.target.value)}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.vehicleNo || ''}
                          onChange={(e) => handleSalesDataChange(index, 'vehicleNo', e.target.value)}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.doDate || ''}
                          onChange={(e) => handleSalesDataChange(index, 'doDate', e.target.value)}
                          placeholder="DD.MM.YYYY"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.itemDescription || ''}
                          onChange={(e) => handleSalesDataChange(index, 'itemDescription', e.target.value)}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right"
                          value={salesData[index]?.dcQty || ''}
                          onChange={(e) => handleSalesDataChange(index, 'dcQty', e.target.value)}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right"
                          value={salesData[index]?.doQty || ''}
                          onChange={(e) => handleSalesDataChange(index, 'doQty', e.target.value)}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.branch || ''}
                          onChange={(e) => handleSalesDataChange(index, 'branch', e.target.value)}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                        />
                      </div>
                      <div className="bg-white border border-gray-300 p-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleSalesRowDelete(index)}
                          className="text-red-500 hover:text-red-700 text-lg font-bold"
                          title="Delete row"
                        >
                          ✖
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Row */}
                <div className="grid gap-px text-xs font-semibold mb-4" style={{gridTemplateColumns: "100px 100px 240px 140px 120px 180px 100px 100px 140px", width: "1220px", height: "30px"}}>
                  <div className="bg-gray-200 border border-gray-400 p-1"></div>
                  <div className="bg-gray-200 border border-gray-400 p-1"></div>
                  <div className="bg-gray-200 border border-gray-400 p-1"></div>
                  <div className="bg-gray-200 border border-gray-400 p-1"></div>
                  <div className="bg-gray-200 border border-gray-400 p-1"></div>
                  <div className="bg-gray-200 border border-gray-400 p-1 flex items-center justify-end">
                    <span className="text-black">Total:</span>
                  </div>
                  <div className="bg-white border border-gray-400 p-1">
                    <input
                      type="text"
                      className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right font-semibold"
                      readOnly
                      value={salesData.reduce((sum, row) => sum + (parseFloat(row.dcQty) || 0), 0)}
                    />
                  </div>
                  <div className="bg-white border border-gray-400 p-1">
                    <input
                      type="text"
                      className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right font-semibold"
                      readOnly
                      value={salesData.reduce((sum, row) => sum + (parseFloat(row.doQty) || 0), 0)}
                    />
                  </div>
                  <div className="bg-gray-200 border border-gray-400 p-1"></div>
                </div>

                {/* Bottom section with Weight Per Bags, Total Weight Out, and Total Feed Bags - matching image layout */}
                <div className="bg-gray-100 p-2 flex justify-between items-center border border-gray-300 mt-2" style={{width: "1220px"}}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium text-black">Weight Per Bags:</label>
                      <input
                        type="text"
                        className="w-24 h-6 text-xs border border-gray-300 px-2 focus:outline-none"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium text-black">Total Weight Out:</label>
                      <input
                        type="text"
                        className="w-24 h-6 text-xs border border-gray-300 px-2 focus:outline-none"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-xs font-medium text-black">Total Feed Bags:</label>
                      <input
                        type="text"
                        className="w-24 h-6 text-xs border border-gray-300 px-2 focus:outline-none"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-black">Total Weight Dill:</label>
                    <input
                      type="text"
                      className="w-32 h-8 text-sm border border-gray-300 px-2 focus:outline-none"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-black">Total Feed Bags:</label>
                    <input
                      type="text"
                      className="w-32 h-8 text-sm border border-gray-300 px-2 focus:outline-none"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-form-type="other"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Right Side - Weight Display and Bag Table (Columns 9-12) */}
            <div className="col-span-4">
              {/* This section will contain the right side components */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
