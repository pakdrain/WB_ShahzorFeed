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

export default function PurchaseForm() {
  const [location, setLocation] = useLocation();
  const [searchSlipNo, setSearchSlipNo] = useState('');
  const [searchVehicleNo, setSearchVehicleNo] = useState('');
  const [activeTab, setActiveTab] = useState('purchase');
  const [selectedForm, setSelectedForm] = useState('purchase'); // Controls which form section is shown
  
  // Deduction/Bag table state
  const [bagTableData, setBagTableData] = useState<any[]>([]);
  
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
  
  // Fetch all first weight records
  const { data: firstWeightRecords = [] } = useQuery({
    queryKey: ['/api/purchase/first-weight-records'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Filter records based on search criteria
  const filteredRecords = firstWeightRecords.filter((record: any) => {
    const matchesSlip = !searchSlipNo || 
      record.slip_no?.toString().toLowerCase().includes(searchSlipNo.toLowerCase());
    const matchesVehicle = !searchVehicleNo || 
      record.vehicle_no?.toLowerCase().includes(searchVehicleNo.toLowerCase());
    return matchesSlip && matchesVehicle;
  });

  // State to manage current WB ID for latest master data
  const [currentWbId, setCurrentWbId] = useState<number | null>(null);

  // Fetch latest master data
  const { data: latestMaster } = useQuery({
    queryKey: ['/api/purchase/latest-master'],
    enabled: true, // Always fetch to get the latest WB_ID
  });

  // Fetch latest details data
  const { data: latestDetails } = useQuery({
    queryKey: ['/api/purchase/latest-details'],
    enabled: true,
  });

  // Update currentWbId when latestMaster data is available
  useEffect(() => {
    if (latestMaster && latestMaster.wb_id) {
      setCurrentWbId(latestMaster.wb_id);
    }
  }, [latestMaster]);

  // Helper function to format datetime-local input
  const formatDatetimeLocal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to format ISO date for database
  const formatISODate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString();
  };

  // Helper function to get next slip number
  const getNextSlipNumber = () => {
    if (latestMaster && latestMaster.slip_no) {
      const currentSlipNo = parseInt(latestMaster.slip_no);
      return String(currentSlipNo + 1);
    }
    return '1'; // Start from 1 if no previous records
  };

  // Enhanced form data state with all fields
  const initialFormData = {
    slipNo: '',
    slipInTime: '',
    slipOutTime: '',
    slipDate: '',
    status: '',
    entryType: 'PURCHASE',
    firstWeight: '',
    secondWeight: '',
    netWeight: '',
    bardanaWeight: '',
    grossWeight: '',
    supplierWeight: '',
    supplierWeightMinusBardana: '',
    supplierWeightMinusOutWeight: '',
    qualityDeduction: '',
    vehicleNo: '',
    driverName: '',
    igpNo: '',
    igpDate: '',
    poNo: '',
    po_no: '',
    itemCode: '',
    itemDesc: '',
    poQty: '',
    igpQty: '',
    balanceQty: '',
    bardanaType: '',
    wtPerBag: '',
    noOfBags: '',
    bagCondition: '',
    bardanaTypeId: '',
    vendor: '',
    vendorName: '',
    customerId: '',
    customerName: '',
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
    doId: '',
    doNo: '',
    doDate: '',
    freight: '',
    remarks: '',
    qualityDed: '',
    weight: '',
    bags: '',
    wbItemPId: '',
    itemId: '',
    manualIgpNo: '',
    igpId: '',
    vendorId: '',
    supWeightWthoutBardana: '',
    netSupplierWeight: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWbId, setEditingWbId] = useState<number | null>(null);
  const [onlineMode, setOnlineMode] = useState(true);
  const [igpItems, setIgpItems] = useState<any[]>([]);

  // Auto-calculate formulas when relevant fields change
  useEffect(() => {
    const supplierWeight = parseFloat(formData.supplierWeight) || 0;
    const bardanaWeight = parseFloat(formData.bardanaWeight) || 0;
    const outWeight = parseFloat(formData.weight) || 0;

    // Formula: Supp Wt - Bardana
    const supplierWeightMinusBardana = supplierWeight - bardanaWeight;
    
    // Formula: Supp Wt - Out Wt = Supplier Weight - Out Weight - Bardana
    const supplierWeightMinusOutWeight = supplierWeight - outWeight - bardanaWeight;

    setFormData(prev => ({
      ...prev,
      supplierWeightMinusBardana: supplierWeightMinusBardana.toFixed(2),
      supplierWeightMinusOutWeight: supplierWeightMinusOutWeight.toFixed(2)
    }));
  }, [formData.supplierWeight, formData.bardanaWeight, formData.weight]);

  // IGP Data Fetching Function
  const fetchIgpData = async () => {
    if (!formData.igpNo) {
      alert('Please enter IGP No');
      return;
    }
    try {
      const response = await fetch(
        `http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/live_data?igp_no=${formData.igpNo}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.items && data.items.length > 0) {
        const items = data.items;
        const firstItem = items[0];
        setFormData(prev => ({
          ...prev,
          po_no: firstItem.po_no || '',
          vendor: firstItem.vendor_name || '',
          itemCode: firstItem.item_code || '',
          itemDesc: firstItem.item_desc || '',
          poQty: firstItem.po_qty ? String(firstItem.po_qty) : '',
          igpQty: firstItem.igp_qty ? String(firstItem.igp_qty) : '',
          balanceQty: firstItem.balance_qty ? String(firstItem.balance_qty) : '',
          igpDate: firstItem.igp_date || ''
        }));
        setIgpItems(items);
        console.log('IGP data fetched successfully:', items);
      } else {
        console.log('No IGP data found for:', formData.igpNo);
        alert('No data found for this IGP number');
      }
    } catch (error) {
      console.error('Error fetching IGP data:', error);
      alert('Failed to fetch IGP data. Please check the IGP number and try again.');
    }
  };

  // Load deduction data for a specific WB ID
  const loadDeductionData = async (wbId: number) => {
    try {
      const response = await fetch(`/api/deduction/${wbId}`);
      if (response.ok) {
        const deductionData = await response.json();
        setBagTableData(deductionData || []);
        console.log('Loaded deduction data:', deductionData);
      }
    } catch (error) {
      console.error('Error loading deduction data:', error);
    }
  };

  // Function to add bag entry
  const addBagEntry = () => {
    const newEntry = {
      bagId: nextBagId,
      bags: formData.bags || '',
      pb: '',
      percentage: formData.qualityDed || '',
      weight: formData.weight || ''
    };
    setBagTableData(prev => [...prev, newEntry]);
    setNextBagId(prev => prev + 1);
    
    // Clear the input fields after adding
    setFormData(prev => ({
      ...prev,
      bags: '',
      qualityDed: '',
      weight: ''
    }));
  };

  // Function to remove bag entry
  const removeBagEntry = (bagId: number) => {
    setBagTableData(prev => prev.filter(item => item.bagId !== bagId));
  };

  // Function to handle Insert button - save bag data to database
  const handleInsertBagData = async () => {
    if (bagTableData.length === 0) {
      alert('No bag data to insert');
      return;
    }

    const wbId = formData.wbId || editingWbId;
    if (!wbId) {
      alert('Please save the main form first to get WB ID');
      return;
    }
    
    const wbIdNumber = typeof wbId === 'string' ? parseInt(wbId) : wbId;

    try {
      const insertPromises = bagTableData.map(item => 
        fetch('/api/deduction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wbId: wbIdNumber,
            bagId: item.bagId,
            bags: item.bags,
            pb: item.pb,
            percentage: item.percentage,
            weight: item.weight
          }),
        })
      );

      await Promise.all(insertPromises);
      alert('Bag data saved successfully!');
      setBagTableData([]); // Clear the table after successful insert
      setNextBagId(1); // Reset bag ID counter
    } catch (error) {
      console.error('Error saving bag data:', error);
      alert('Failed to save bag data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'firstWeight', 'secondWeight', 'netWeight', 'bardanaWeight', 'grossWeight',
      'freight', 'companyId', 'branchId', 'createdBy', 'lastUpdatedBy',
      'doId', 'customerId', 'itemId', 'poId', 'igpId', 'vendorId', 'bardanaTypeId',
      'poQty', 'igpQty', 'balanceQty', 'noOfBags', 'wtPerBag', 'supplierWeight',
      'qualityDeduction', 'wbItemPId', 'wbId', 'qualityDed', 'weight', 'bags'
    ];
    
    if (numericFields.includes(name) && value && isNaN(Number(value))) {
      return; // Don't update if it's not a valid number for numeric fields
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Initialize form with current timestamp and slip number
  const initializeForm = () => {
    const now = new Date();
    const currentDateTime = formatDatetimeLocal(now.toISOString());
    const nextSlipNo = getNextSlipNumber();
    
    setFormData(prev => ({
      ...prev,
      slipNo: nextSlipNo,
      slipInTime: currentDateTime,
      slipDate: now.toISOString(),
      creationDate: now.toISOString(),
      lastUpdatedDate: now.toISOString()
    }));
  };

  // Reset form to initial state but keep slip number progression
  const resetFormToInitial = () => {
    const nextSlipNo = getNextSlipNumber();
    const now = new Date();
    const currentDateTime = formatDatetimeLocal(now.toISOString());
    
    setFormData({
      ...initialFormData,
      slipNo: nextSlipNo,
      slipInTime: currentDateTime,
      slipDate: now.toISOString(),
      creationDate: now.toISOString(),
      lastUpdatedDate: now.toISOString(),
      onlineEntry: 'Yes'
    });
    setIsEditMode(false);
    setEditingWbId(null);
    setIgpItems([]);
    setBagTableData([]);
    setNextBagId(1);
  };

  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes'
    }));
  };

  // Initialize form when component mounts
  useEffect(() => {
    initializeForm();
    toggleOnlineMode(true);
  }, []);

  const resetForm = () => {
    // When Clear button is pressed, clear everything except Slip No
    const currentSlipNo = formData.slipNo;
    setFormData({
      ...initialFormData,
      slipNo: currentSlipNo
    });
    setIgpItems([]);
    setIsEditMode(false);
    setEditingWbId(null);
    toggleOnlineMode(true);
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
      
      // Update the secondWeight field with current weight reading
      setFormData(prev => ({
        ...prev,
        secondWeight: weightData.weight
      }));
    } catch (error) {
      console.error('Error fetching weight data:', error);
      alert('Failed to capture weight reading');
    }
  };

  // Calculate weights automatically
  const calculateWeights = () => {
    const firstWeight = parseFloat(formData.firstWeight) || 0;
    const secondWeight = parseFloat(formData.secondWeight) || 0;
    const bardanaWeight = parseFloat(formData.bardanaWeight) || 0;
    
    // Net Weight = First Weight - Second Weight
    const netWeight = Math.abs(firstWeight - secondWeight);
    
    // Gross Weight = First Weight (or could be different calculation based on requirements)
    const grossWeight = Math.max(firstWeight, secondWeight);
    
    setFormData(prev => ({
      ...prev,
      netWeight: netWeight.toFixed(2),
      grossWeight: grossWeight.toFixed(2)
    }));
  };

  // Function to load data by slip number for editing
  const loadDataBySlipNo = async (slipNo: string) => {
    if (!slipNo) {
      console.error('No slip number provided');
      return;
    }

    try {
      console.log('Loading data for slip number:', slipNo);
      const response = await fetch(`/api/purchase/by-slip/${slipNo}`);
      
      if (!response.ok) {
        console.error('Failed to fetch data for slip:', slipNo);
        alert('Failed to load record data');
        return;
      }

      const data = await response.json();
      console.log('Received data for slip:', slipNo, data);
      
      if (data && data.master) {
        const master = data.master;
        const details = data.details && data.details.length > 0 ? data.details[0] : {};
        
        // Enable edit mode
        setIsEditMode(true);
        setEditingWbId(master.wb_id);
        console.log('Setting edit mode with WB ID:', master.wb_id);
        
        // Load all the form data including detail table data
        setFormData(prev => ({
          ...prev,
          slipNo: master.slip_no || '',
          vehicleNo: details.vehicle_no || '',
          firstWeight: master.first_weight ? String(master.first_weight) : '',
          secondWeight: master.second_weight ? String(master.second_weight) : '',
          netWeight: master.net_weight ? String(master.net_weight) : '',
          bardanaWeight: master.bardana_weight ? String(master.bardana_weight) : '',
          grossWeight: master.gross_weight ? String(master.gross_weight) : '',
          freight: master.freight ? String(master.freight) : '',
          remarks: master.remarks || '',
          driverName: master.driver_name || '',
          // Detail table data
          vendor: details.vendor_name || '',
          igpNo: details.igp_no || '',
          poNo: details.po_no || '',
          itemCode: details.item_code || '',
          itemDesc: details.item_desc || '',
          poQty: details.po_qty ? String(details.po_qty) : '',
          igpQty: details.igp_qty ? String(details.igp_qty) : '',
          balanceQty: details.balance_qty ? String(details.balance_qty) : '',
          bardanaType: details.bardana_type || '',
          wtPerBag: details.weight_per_bags ? String(details.weight_per_bags) : '',
          noOfBags: details.no_of_bags ? String(details.no_of_bags) : '',
          slipInTime: master.slip_in_time ? formatDatetimeLocal(master.slip_in_time) : '',
          slipOutTime: master.slip_out_time ? formatDatetimeLocal(master.slip_out_time) : '',
          entryType: master.entry_type || 'PURCHASE'
        }));
        
        // Load existing deduction data for this record
        if (master.wb_id) {
          loadDeductionData(master.wb_id);
        }
        
        console.log('Form data loaded successfully for edit mode');
      } else {
        console.error('Invalid data structure received:', data);
        alert('Invalid record data received');
      }
    } catch (error) {
      console.error('Error loading data by slip number:', error);
      alert('Failed to load record data');
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
    
    // Determine entry type based on selected form
    const currentEntryType = selectedForm === 'sales' ? 'SALE' : 'PURCHASE';
    
    // Check if a record with this slip number already exists
    let existingRecord = null;
    try {
      const checkResponse = await fetch(`/api/purchase/by-slip/${formData.slipNo}`);
      if (checkResponse.ok) {
        existingRecord = await checkResponse.json();
        console.log('Found existing record:', existingRecord);
      }
    } catch (error) {
      console.log('No existing record found for slip:', formData.slipNo);
    }
    
    // Prepare master data payload
    const masterPayload = {
      slip_no: formData.slipNo || null,
      slip_in_time: formatISODate(formData.slipInTime),
      first_weight: formData.firstWeight ? parseFloat(formData.firstWeight) : null,
      second_weight: formData.secondWeight ? parseFloat(formData.secondWeight) : null,
      net_weight: formData.netWeight ? parseFloat(formData.netWeight) : null,
      bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
      gross_weight: formData.grossWeight ? parseFloat(formData.grossWeight) : null,
      freight: formData.freight ? parseFloat(formData.freight) : null,
      remarks: formData.remarks || null,
      driver_name: formData.driverName || null,
      company_id: formData.companyId ? parseInt(formData.companyId, 10) : null,
      branch_id: formData.branchId ? parseInt(formData.branchId, 10) : null,
      online_entry: formData.onlineEntry || null,
      offline_entry: formData.offlineEntry || null,
      created_by: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      creation_date: formData.creationDate || null,
      last_updated_by: formData.lastUpdatedBy ? parseInt(formData.lastUpdatedBy, 10) : null,
      last_updated_date: formData.lastUpdatedDate || null,
      manual_dc_no: formData.manualDcNo || null,
      entry_type: currentEntryType,
      slip_out_time: formatISODate(formData.slipOutTime),
      status: formData.status || null,
      slip_date: formData.slipDate || null,
    };

    try {
      let masterResponse: any;
      let savedWbId: number = 0;
      
      // If we found an existing record or we're in edit mode, update it
      if ((existingRecord && existingRecord.master && existingRecord.master.wb_id) || (isEditMode && editingWbId)) {
        const updateWbId = isEditMode && editingWbId ? editingWbId : (existingRecord?.master?.wb_id || null);
        
        if (!updateWbId) {
          throw new Error('No valid WB ID found for update operation');
        }
        
        // Update existing record - combine master and items data
        const updatePayload = {
          ...masterPayload,
          // Items data
          vehicle_no: formData.vehicleNo || null,
          vendor_name: formData.vendor || null,
          po_no: formData.po_no || null,
          igp_no: formData.igpNo || null,
          item_code: formData.itemCode || null,
          item_desc: formData.itemDesc || null,
          po_qty: formData.poQty ? parseFloat(formData.poQty) : null,
          igp_qty: formData.igpQty ? parseFloat(formData.igpQty) : null,
          balance_qty: formData.balanceQty ? parseFloat(formData.balanceQty) : null
        };
        
        console.log('Updating with WB ID:', updateWbId);
        console.log('Update payload:', updatePayload);
        
        masterResponse = await fetch(`/api/purchase/update/${updateWbId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
        });
        savedWbId = updateWbId;
        
        // Set edit mode if updating existing record found by slip number
        if (existingRecord && !isEditMode) {
          setIsEditMode(true);
          setEditingWbId(existingRecord.master.wb_id);
        }
      } else {
        // Create new record
        masterResponse = await fetch('/api/purchases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(masterPayload),
        });
      }

      if (!masterResponse.ok) {
        const errorData = await masterResponse.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || `HTTP error! status: ${masterResponse.status}`;
        console.error('Server error response:', errorData);
        throw new Error(errorMessage);
      }

      const masterData = await masterResponse.json();
      console.log('Master purchase saved/updated:', masterData);
      
      // Get the WB_ID from saved master data for new records
      if (!isEditMode) {
        savedWbId = masterData.wb_id;
      } else if (editingWbId) {
        savedWbId = editingWbId;
      } else {
        savedWbId = masterData.wb_id || 0;
      }
      
      // For Purchase entries, save purchase items only if not in edit mode
      if (selectedForm === 'purchase' && !isEditMode) {
        // Prepare items data payload for Purchase entries - use first IGP item if available, otherwise form data
        const firstIgpItem: any = igpItems.length > 0 ? igpItems[0] : {};
        
        console.log('Form data for items:', formData);
        console.log('IGP items available:', igpItems);
        
        const itemsPayload = {
          wb_id: savedWbId!,
          baradana_type: formData.bardanaType || null,
          igp_no: formData.igpNo || null,
          vehicle_no: formData.vehicleNo || null,
          weight_per_bags: formData.wtPerBag ? parseFloat(formData.wtPerBag) : null,
          igp_date: formData.igpDate || null,
          supplier_weight: formData.supplierWeight ? parseFloat(formData.supplierWeight) : null,
          quality_deduction: formData.qualityDeduction ? parseFloat(formData.qualityDeduction) : null,
          bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null, // New Bardana Wht field
          no_of_bags: formData.noOfBags ? parseInt(formData.noOfBags) : null,
          vendor_name: firstIgpItem?.vendor_name || formData.vendor || null,
          bag_condition: formData.bagCondition || null,
          po_no: firstIgpItem?.po_no || formData.po_no || null,
          item_code: firstIgpItem?.item_code || formData.itemCode || null,
          item_desc: firstIgpItem?.item_desc || formData.itemDesc || null,
          po_qty: firstIgpItem?.po_qty ? parseFloat(firstIgpItem.po_qty) : (formData.poQty ? parseFloat(formData.poQty) : null),
          igp_qty: firstIgpItem?.igp_qty ? parseFloat(firstIgpItem.igp_qty) : (formData.igpQty ? parseFloat(formData.igpQty) : null),
          balance_qty: firstIgpItem?.balance_qty ? parseFloat(firstIgpItem.balance_qty) : (formData.balanceQty ? parseFloat(formData.balanceQty) : null)
        };
        
        console.log('Items payload being sent:', itemsPayload);
        
        // Save items data for Purchase entries
        const itemsResponse = await fetch('/api/purchase-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemsPayload),
        });

        if (!itemsResponse.ok) {
          console.error('Failed to save purchase items');
        }
      }
        
      // Automatically capture first weight image (only for new entries with first weight but no second weight)
      if (formData.firstWeight && !formData.secondWeight && !isEditMode) {
        try {
          console.log('Capturing first weight image for slip:', formData.slipNo);
          const captureResponse = await fetch('/api/capture/first-weight', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              slipNo: formData.slipNo,
              cameraIp: '10.10.10.146',
              cameraPort: 554
              }),
            });

            if (captureResponse.ok) {
              const captureData = await captureResponse.json();
              console.log('Image captured successfully:', captureData.message);
            } else {
              console.log('Image capture failed, but continuing with form submission');
            }
          } catch (imageError) {
            console.log('Image capture error, but continuing:', imageError);
          }
        }
        
        // Save bag data to deduction table if available
        if (bagTableData.length > 0) {
          try {
            const bagSavePromises = bagTableData.map(item => 
              fetch('/api/deduction', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  wbId: savedWbId!,
                  bagId: item.bagId,
                  bags: item.bags,
                  pb: item.pb,
                  percentage: item.percentage,
                  weight: item.weight
                }),
              })
            );

            await Promise.all(bagSavePromises);
            console.log('Bag data saved successfully to deduction table');
          } catch (bagError) {
            console.error('Error saving bag data:', bagError);
            alert('Warning: Main data saved but bag data failed to save');
          }
        }
        
        // Increment slip number for next entry
        const currentSlipNo = parseInt(formData.slipNo);
        const nextSlipNo = (currentSlipNo + 1).toString();
        
        if (isEditMode) {
          alert('Record updated successfully!');
          // Reset form to clean state after edit
          resetFormToInitial();
        } else {
          alert('Purchase data saved successfully!');
          // Reset form to clean state and increment slip number for next entry
          resetFormToInitial();
        }

        // If second weight was entered, refresh to remove from display table
        if (formData.secondWeight && parseFloat(formData.secondWeight) > 0) {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
        
        // Auto-increment slip number for next entry regardless of mode
        setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            slipNo: nextSlipNo
          }));
        }, 100);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save purchase.';
      alert(errorMessage);
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate net and gross weights when first or second weight changes
  useEffect(() => {
    if (formData.firstWeight || formData.secondWeight) {
      calculateWeights();
    }
  }, [formData.firstWeight, formData.secondWeight]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchase">Purchase</TabsTrigger>
          <TabsTrigger value="sale">Sale</TabsTrigger>
        </TabsList>
        
        <TabsContent value="purchase" className="space-y-6">
          {/* Purchase Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Form */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Button 
                  onClick={() => setSelectedForm('purchase')}
                  className={`${selectedForm === 'purchase' ? 'bg-blue-600' : 'bg-gray-400'} text-white`}
                >
                  Purchase
                </Button>
                <Button 
                  onClick={() => setSelectedForm('sales')}
                  className={`${selectedForm === 'sales' ? 'bg-blue-600' : 'bg-gray-400'} text-white`}
                >
                  Sales
                </Button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* First Row */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Slip No</Label>
                  <Input
                    name="slipNo"
                    value={formData.slipNo}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Slip In Time</Label>
                  <Input
                    name="slipInTime"
                    type="datetime-local"
                    value={formData.slipInTime}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Slip Out Time</Label>
                  <Input
                    name="slipOutTime"
                    type="datetime-local"
                    value={formData.slipOutTime}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                {/* Second Row */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">1st Wt</Label>
                  <div className="flex gap-2">
                    <Input
                      name="firstWeight"
                      value={formData.firstWeight}
                      onChange={handleChange}
                      className="mt-1 flex-1"
                    />
                    <Button 
                      onClick={captureFirstWeight}
                      className="mt-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2"
                    >
                      Capture
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">2nd Wt</Label>
                  <div className="flex gap-2">
                    <Input
                      name="secondWeight"
                      value={formData.secondWeight}
                      onChange={handleChange}
                      className="mt-1 flex-1"
                    />
                    <Button 
                      onClick={captureSecondWeight}
                      className="mt-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2"
                    >
                      Capture
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Net Wt</Label>
                  <Input
                    name="netWeight"
                    value={formData.netWeight}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>

                {/* Third Row - Vehicle and Driver */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Vehicle</Label>
                  <Input
                    name="vehicleNo"
                    value={formData.vehicleNo}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Driver Name</Label>
                  <Input
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Gross Wt</Label>
                  <Input
                    name="grossWeight"
                    value={formData.grossWeight}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>
              </div>

              {/* IGP Section */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">IGP No</Label>
                  <div className="flex gap-2">
                    <Input
                      name="igpNo"
                      value={formData.igpNo}
                      onChange={handleChange}
                      className="mt-1 flex-1"
                    />
                    <Button 
                      onClick={fetchIgpData}
                      className="mt-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2"
                    >
                      Fetch
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">PO No</Label>
                  <Input
                    name="po_no"
                    value={formData.po_no}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Vendor</Label>
                  <Input
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="mt-1"
                    readOnly
                  />
                </div>
              </div>

              {/* Details Section */}
              <div className="mb-4">
                {/* Navigation buttons above details */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2">
                    Purchase
                  </Button>
                  <Button className="bg-green-500 hover:bg-green-600 text-white text-sm py-2">
                    Sales
                  </Button>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white text-sm py-2">
                    Offline
                  </Button>
                </div>

                {/* Details in 3-column layout */}
                <div className="grid grid-cols-3 gap-4">
                  {/* First Column */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Item Code</Label>
                      <Input
                        name="itemCode"
                        value={formData.itemCode}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">PO Qty</Label>
                      <Input
                        name="poQty"
                        value={formData.poQty}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Supp Wt</Label>
                      <Input
                        name="supplierWeight"
                        value={formData.supplierWeight}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Weight</Label>
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          className="flex-1 h-8 text-xs"
                        />
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Second Column */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Item Desc</Label>
                      <Input
                        name="itemDesc"
                        value={formData.itemDesc}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">IGP Qty</Label>
                      <Input
                        name="igpQty"
                        value={formData.igpQty}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Quality Ded</Label>
                      <Input
                        name="qualityDeduction"
                        value={formData.qualityDeduction}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Bags</Label>
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          name="bags"
                          value={formData.bags}
                          onChange={handleChange}
                          className="flex-1 h-8 text-xs"
                        />
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                        />
                        <span className="text-xs">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Third Column */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Bal Qty</Label>
                      <Input
                        name="balanceQty"
                        value={formData.balanceQty}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Bardana Wht</Label>
                      <Input
                        name="bardanaWeight"
                        value={formData.bardanaWeight}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Supp-Bard</Label>
                      <Input
                        name="supplierWeightMinusBardana"
                        value={formData.supplierWeightMinusBardana}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                        readOnly
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-gray-700 w-16">Net Supp</Label>
                      <Input
                        name="supplierWeightMinusOutWeight"
                        value={formData.supplierWeightMinusOutWeight}
                        onChange={handleChange}
                        className="flex-1 h-8 text-xs"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <Button 
                  onClick={addBagEntry}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  Deduction+
                </Button>
                <Button 
                  onClick={handleInsertBagData}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Insert
                </Button>
                <Button 
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                >
                  Clear
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>

              {/* Remarks */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Remarks</Label>
                <Textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column - Video and Weight Display */}
            <div className="space-y-6">
              {/* Video Stream */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <VideoStreamFullscreen 
                  camera={{
                    id: 1,
                    name: "Camera 01",
                    ip: "10.10.10.146",
                    port: 554
                  }}
                  isConnected={true}
                  isStreaming={true}
                />
              </div>

              {/* Weight Indicator */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <WeightIndicator comPort="COM6" compact={false} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sale" className="space-y-6">
          {/* Sales Content - Similar structure but with sales-specific forms */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Sales Entry</h3>
            {/* Sales form fields would go here */}
            <p className="text-gray-600">Sales form content coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Weight Display Table - Fixed Position */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-white border-2 border-gray-400 rounded-sm shadow-lg w-72">
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

          {/* Search Row */}
          <div className="grid grid-cols-3 border-b border-gray-400">
            <div className="border-r border-gray-400 p-1">
              <Input 
                placeholder="Search Slip"
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
                    onClick={() => loadDataBySlipNo(record.slip_no)}
                  >
                    {record.slip_no || "---"}
                  </button>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {record.vehicle_no || "---"}
                  </div>
                  <div className="p-1 text-center text-xs text-blue-600 font-semibold bg-white">
                    PURCHASE
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

      {/* Bag Details Table - Below Weight Display Table (hide when Sales form is active) */}
      {selectedForm === 'purchase' && (
        <div className="absolute top-96 right-4 z-50">
          <div className="bg-white border-2 border-gray-400 rounded-sm shadow-lg w-80">
          {/* Header Row */}
          <div className="grid grid-cols-6 border-b border-gray-400">
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              Bag ID
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              Bags
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              P/B
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              %age
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-1 text-center text-xs font-semibold text-black">
              Weight
            </div>
            <div className="bg-gray-200 p-1 text-center text-xs font-semibold text-black">
              
            </div>
          </div>

          {/* Dynamic Data Rows */}
          <div className="max-h-32 overflow-y-auto">
            {bagTableData.length === 0 ? (
              <div className="grid grid-cols-6 border-b border-gray-300">
                <div className="col-span-6 p-2 text-center text-xs text-gray-500">No bag data available. Click Deduction+ to add data.</div>
              </div>
            ) : (
              bagTableData.map((item, index) => (
                <div key={index} className="grid grid-cols-6 border-b border-gray-300 hover:bg-gray-50">
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {item.bagId}
                  </div>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {item.bags}
                  </div>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {item.pb}
                  </div>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {item.percentage}
                  </div>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {item.weight}
                  </div>
                  <div className="p-1 text-center bg-white">
                    <button 
                      onClick={() => removeBagEntry(item.bagId)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}