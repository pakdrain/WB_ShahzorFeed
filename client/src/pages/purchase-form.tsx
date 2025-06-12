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
  const filteredRecords = Array.isArray(firstWeightRecords) ? firstWeightRecords.filter((record: any) => {
    const matchesSlipNo = !searchSlipNo || (record.slip_no || '').toString().toLowerCase().includes(searchSlipNo.toLowerCase());
    const matchesVehicleNo = !searchVehicleNo || (record.vehicle_no || '').toString().toLowerCase().includes(searchVehicleNo.toLowerCase());
    return matchesSlipNo && matchesVehicleNo;
  }) : [];

  // Function to load data by slip number for editing
  const loadDataBySlipNo = async (slipNo: string) => {
    try {
      const response = await fetch(`/api/purchase/by-slip/${slipNo}`);
      const data = await response.json();
      if (data && data.master) {
        const master = data.master;
        const details = data.details && data.details.length > 0 ? data.details[0] : {};
        
        // Enable edit mode
        setIsEditMode(true);
        setEditingWbId(master.wb_id);
        
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
      }
    } catch (error) {
      console.error('Error loading data by slip number:', error);
      alert('Failed to load record data');
    }
  };

  // Function to cancel edit mode and return to new entry mode
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditingWbId(null);
    setFormData(initialFormData);
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
    entryType: 'PURCHASE',
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
    supWeightWithoutBardana: '',
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
          driverName: firstItem.driver_name || '',
          vendor: firstItem.vendor_name || '',
          vehicleNo: firstItem.vehicle_no || '',
          bardanaWeight: firstItem.bardana_qty ? String(firstItem.bardana_qty) : '',
          bardanaType: firstItem.bardanatype || '',
          wtPerBag: firstItem.wtperbag ? String(firstItem.wtperbag) : '',
        }));
        setIgpItems(items);
        console.log('IGP data fetched successfully:', items);
      } else {
        alert('No data found for this IGP No.');
        setIgpItems([]);
      }
    } catch (error) {
      console.error('Error fetching IGP data:', error);
      alert('Failed to fetch IGP data. Please check the IGP number and try again.');
      setIgpItems([]);
    }
  };

  // Function to reset form to clean state
  const resetFormToInitial = () => {
    setFormData({
      ...initialFormData,
      slipInTime: new Date().toISOString().slice(0, 16),
      onlineEntry: 'Yes',
      entryType: 'PURCHASE',
      creationDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      slipDate: new Date().toISOString()
    });
    setIgpItems([]);
    setIsEditMode(false);
    setEditingWbId(null);
    setOnlineMode(true);
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

  // Function to handle Deduction+ button click - populate bag table with form data
  const handleDeduction = () => {
    const bags = parseInt(formData.noOfBags) || 0;
    const pb = parseFloat(formData.wtPerBag) || 0;
    const percentage = parseFloat(formData.qualityDed) || 0;
    const weight = parseFloat(formData.weight) || 0;
    
    if (bags > 0 && pb > 0) {
      const newBagEntry = {
        bagId: nextBagId,
        bags: bags,
        pb: pb,
        percentage: percentage,
        weight: weight,
        total: bags * pb
      };
      
      setBagTableData(prev => [...prev, newBagEntry]);
      setNextBagId(prev => prev + 1);
    } else {
      alert('Please enter valid values for Bags and Weight Per Bag');
    }
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
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  // Reset form to clean state when component mounts (new purchase)
  useEffect(() => {
    resetFormToInitial();
  }, []);

  useEffect(() => {
    // Fetch next slip number
    fetch('/api/purchases')
      .then(res => res.json())
      .then((data: any[]) => {
        if (data.length > 0) {
          const maxSlip = data.reduce((max: number, curr: any) => {
            const slip = parseInt(curr.slip_no, 10);
            return slip > max ? slip : max;
          }, 0);
          const nextSlip = (maxSlip + 1).toString();
          setFormData(prev => ({ ...prev, slipNo: nextSlip }));
        } else {
          setFormData(prev => ({ ...prev, slipNo: '1' }));
        }
      })
      .catch((err: any) => {
        console.error('Error fetching purchases:', err);
      });

    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));
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
    const supplierWeight = parseFloat(formData.supplierWeight) || 0;
    
    // Net Weight = First Weight - Second Weight
    const netWeight = firstWeight - secondWeight;
    
    // Gross Weight = First Weight - Second Weight - Bardana Weight
    const grossWeight = firstWeight - secondWeight - bardanaWeight;
    
    // Supplier Weight - Bardana
    const supplierWeightMinusBardana = supplierWeight - bardanaWeight;
    
    // Supplier Weight - Out Weight = Supplier Weight - Supp Wt - Bardana
    const suppWtMinusBardana = parseFloat(formData.supplierWeightMinusBardana) || 0;
    const supplierWeightMinusOutWeight = supplierWeight - suppWtMinusBardana;
    
    setFormData(prev => ({
      ...prev,
      netWeight: netWeight.toString(),
      grossWeight: grossWeight.toString(),
      supplierWeightMinusBardana: supplierWeightMinusBardana.toString(),
      supplierWeightMinusOutWeight: supplierWeightMinusOutWeight.toString()
    }));
  };

  // Auto-calculate weights when values change
  useEffect(() => {
    calculateWeights();
  }, [formData.firstWeight, formData.secondWeight, formData.bardanaWeight, formData.supplierWeight]);

  // Load existing deduction data when editing
  const loadDeductionData = async (wbId: number) => {
    try {
      const response = await fetch(`/api/deduction/${wbId}`);
      if (response.ok) {
        const deductionData = await response.json();
        const formattedData = deductionData.map((item: any) => ({
          bagId: item.bag_id,
          bags: item.bags,
          pb: item.pb,
          percentage: item.percentage,
          weight: item.weight,
          total: item.bags * item.pb
        }));
        setBagTableData(formattedData);
        console.log('Loaded existing deduction data:', formattedData);
      }
    } catch (error) {
      console.error('Error loading deduction data:', error);
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
      if ((existingRecord && existingRecord.wb_id) || (isEditMode && editingWbId)) {
        const updateWbId = existingRecord ? existingRecord.wb_id : editingWbId!;
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
          setEditingWbId(existingRecord.wb_id);
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
      
      // For Sales entries, save sales data to details table using standard purchase items API
      if (selectedForm === 'sales') {
        // Filter valid sales rows (at least one field filled)
        const validSalesRows = salesData.filter(row => 
          row.customerName || row.vehicleNo || row.itemDescription || row.dcNo || row.doNo
        );
        
        if (validSalesRows.length > 0) {
          try {
            // Save each sales row as separate items using the standard purchase items API
            for (const row of validSalesRows) {
              const salesItemPayload = {
                wb_id: savedWbId,
                baradana_type: null,
                igp_no: row.dcNo || null, // Map DC # to igp_no field
                vehicle_no: row.vehicleNo || null,
                weight_per_bags: null,
                igp_date: null,
                supplier_weight: null,
                quality_deduction: null,
                no_of_bags: null,
                vendor_name: row.customerName || null, // Map Customer Name to vendor_name field
                bag_condition: null,
                po_no: row.doNo || null, // Map DO # to po_no field
                item_code: null,
                item_desc: row.itemDescription || null,
                po_qty: row.doQty ? parseFloat(row.doQty) : null, // Map DO Qty to po_qty
                igp_qty: row.dcQty ? parseFloat(row.dcQty) : null, // Map DC Qty to igp_qty
                balance_qty: null,
                customer_name: row.customerName || null, // Additional customer_name field
                do_no: row.doNo || null, // Additional do_no field
                do_qty: row.doQty ? parseFloat(row.doQty) : null // Additional do_qty field
              };
              
              const salesItemResponse = await fetch('/api/purchase-items', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(salesItemPayload),
              });
              
              if (salesItemResponse.ok) {
                console.log('Sales item saved to Details table:', row);
              } else {
                console.error('Failed to save sales item to Details table:', row);
              }
            }
            console.log('All sales detail data saved successfully to Details table');
          } catch (salesError) {
            console.error('Error saving sales detail data:', salesError);
          }
        }
      } else {
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
      if (formData.firstWeight && !formData.secondWeight) {
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
        
        // Save sales data when active tab is sale
        if (activeTab === 'sale' && salesData.length > 0) {
          try {
            const validSalesData = salesData.filter(item => 
              item.doNo || item.customerName || item.vehicleNo || item.itemDescription || item.dcNo
            );
            
            if (validSalesData.length > 0) {
              console.log('Saving sales data to details table:', validSalesData);
              
              const salesPayload = {
                salesData: validSalesData.map(item => ({
                  wbId: savedWbId!,
                  doId: item.doId || null,
                  dcNo: item.dcNo || null,
                  doNo: item.doNo || null,
                  customerName: item.customerName || null,
                  vehicleNo: item.vehicleNo || null,
                  doDate: null, // As requested - null for now
                  itemDescription: item.itemDescription || null,
                  dcQty: item.dcQty ? parseFloat(item.dcQty) : null,
                  doQty: item.doQty ? parseFloat(item.doQty) : null,
                  branch: item.branch || null
                })),
                entryType: 'SALE'
              };
              
              const salesResponse = await fetch('/api/sales/save', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(salesPayload),
              });
              
              if (salesResponse.ok) {
                console.log('Sales detail data saved successfully to database');
              } else {
                const errorText = await salesResponse.text();
                console.error('Failed to save sales detail data:', errorText);
                alert('Warning: Main data saved but sales detail data failed to save');
              }
            }
          } catch (salesError) {
            console.error('Error saving sales data:', salesError);
            alert('Warning: Main data saved but sales data failed to save');
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
          alert('Purchase data saved successfully and first weight image captured!');
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

  const handleSaveItems = async () => {
    setLoading(true);
    const payload = {
      wb_item_p_id: formData.wbItemPId ? parseInt(formData.wbItemPId, 10) : null,
      wb_id: formData.wbId ? parseInt(formData.wbId, 10) : null,
      manual_dc_no: formData.manualDcNo || null,
      do_id: formData.doId ? parseInt(formData.doId, 10) : null,
      do_no: formData.doNo || null,
      customer_id: formData.customerId ? parseInt(formData.customerId, 10) : null,
      customer_name: formData.customerName || null,
      vehicle_no: formData.vehicleNo || null,
      do_date: formData.doDate || null,
      item_id: formData.itemId ? parseInt(formData.itemId, 10) : null,
      item_code: formData.itemCode || null,
      item_desc: formData.itemDesc || null,
      created_by: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      creation_date: formData.creationDate || null,
      last_updated_by: formData.lastUpdatedBy ? parseInt(formData.lastUpdatedBy, 10) : null,
      last_updated_date: formData.lastUpdatedDate || null,
      po_id: formData.poId ? parseInt(formData.poId, 10) : null,
      po_no: formData.po_no || null,
      po_qty: formData.poQty ? parseFloat(formData.poQty) : null,
      igp_qty: formData.igpQty ? parseFloat(formData.igpQty) : null,
      balance_qty: formData.balanceQty ? parseFloat(formData.balanceQty) : null,
      baradana_type: formData.baradanaType || null,
      igp_no: formData.igpNo || null,
      manual_igp_no: formData.manualIgpNo || null,
      igp_id: formData.igpId ? parseInt(formData.igpId, 10) : null,
      vendor_id: formData.vendorId ? parseInt(formData.vendorId, 10) : null,
      vendor_name: formData.vendorName || null,
      no_of_bags: formData.noOfBags ? parseFloat(formData.noOfBags) : null,
      weight_per_bags: formData.wtPerBag ? parseFloat(formData.wtPerBag) : null,
      bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
      igp_date: formData.igpDate || null,
      quality_deduction: formData.qualityDeduction ? parseFloat(formData.qualityDeduction) : null,
      supplier_weight: formData.supplierWeight ? parseFloat(formData.supplierWeight) : null,
      sup_weight_wthout_bardana: formData.supplierWeightMinusBardana ? parseFloat(formData.supplierWeightMinusBardana) : null,
      net_supplier_weight: formData.supplierWeightMinusOutWeight ? parseFloat(formData.supplierWeightMinusOutWeight) : null,
      bag_condition: formData.bagCondition || null,
      bardana_type_id: formData.bardanaTypeId ? parseInt(formData.bardanaTypeId, 10) : null,
    };

    try {
      const response = await fetch('/api/purchase-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert('Purchase items saved successfully!');
      console.log('Items saved:', data);
    } catch (err) {
      alert('Failed to save purchase items.');
      console.error(err);
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
                    onClick={() => loadDataBySlipNo(record.wb_id || record.slip_no)}
                  >
                    {record.slip_no || record.wb_id || "---"}
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
                <div key={item.bagId} className="grid grid-cols-6 border-b border-gray-300">
                  <div className="border-r border-gray-300 p-1 text-center text-xs text-black">{String(item.bagId).padStart(3, '0')}</div>
                  <div className="border-r border-gray-300 p-1 text-center text-xs text-black">{item.bags}</div>
                  <div className="border-r border-gray-300 p-1 text-center text-xs text-black">{item.pb.toFixed(1)}</div>
                  <div className="border-r border-gray-300 p-1 text-center text-xs text-black">{item.percentage.toFixed(1)}</div>
                  <div className="border-r border-gray-300 p-1 text-center text-xs text-black">{item.weight.toFixed(1)}</div>
                  <div className="p-1 text-center">
                    <button 
                      className="text-red-600 hover:text-red-800 font-bold text-sm"
                      onClick={() => removeBagEntry(item.bagId)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Total Field */}
          <div className="border-t-2 border-gray-400 bg-gray-100 p-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-black">Total:</span>
              <Input 
                value={bagTableData.reduce((sum, item) => sum + item.total, 0).toFixed(1)}
                className="h-5 text-xs w-16 text-center font-bold text-blue-700 bg-white border-gray-300"
                readOnly
              />
            </div>
          </div>
        </div>
        </div>
      )}

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
            className={`h-6 px-2 text-xs font-medium ${selectedForm === 'purchase' ? 'bg-blue-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
            onClick={() => setSelectedForm('purchase')}
          >
            Purchase
          </Button>
          <Button 
            className={`h-6 px-2 text-xs font-medium ${selectedForm === 'sales' ? 'bg-rose-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
            onClick={() => setSelectedForm('sales')}
          >
            Sale
          </Button>
          <Button className={`h-6 px-2 text-xs font-medium ${isEditMode ? 'bg-yellow-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>
            {isEditMode ? 'Editing' : 'Offline'}
          </Button>
          <Button className="h-6 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium">First</Button>
          <Button className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium">Prev</Button>
          <Button className="h-6 px-2 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-medium">Next</Button>
          <Button className="h-6 px-2 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium">Last</Button>
          <Button className="bg-green-600 hover:bg-green-700 h-6 px-3 text-xs text-white font-medium" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
          {isEditMode && (
            <Button className="h-6 px-2 text-xs bg-red-600 hover:bg-red-700 text-white font-medium" onClick={cancelEdit}>
              Cancel
            </Button>
          )}
          <Button className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium">Print</Button>
          <Button className="h-6 px-2 text-xs bg-orange-600 hover:bg-orange-700 text-white font-medium">Rej</Button>
        </div>
        <div className="flex gap-1 items-center">
          {/* Weight Display - positioned on left side with bolder text */}
          <div className="mr-2">
            <WeightIndicator comPort="COM6" compact={true} />
          </div>
          <Button 
            className={`h-6 px-3 text-xs font-medium ${onlineMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
            onClick={() => toggleOnlineMode(true)}
          >
            ONLINE
          </Button>
          <Button 
            className={`h-6 px-3 text-xs font-medium ${!onlineMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
            onClick={() => toggleOnlineMode(false)}
          >
            OFFLINE
          </Button>
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
                  <Select name="branch" value={formData.branch} onValueChange={(value) => setFormData(prev => ({...prev, branch: value}))}>
                    <SelectTrigger className="h-5 text-xs text-black">
                      <SelectValue placeholder="Select branch" className="text-black" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Branch 1">Branch 1</SelectItem>
                      <SelectItem value="Branch 2">Branch 2</SelectItem>
                    </SelectContent>
                  </Select>
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

            {/* Top buttons row - above details section */}
            <div className="flex gap-2 mb-2">
              <Button 
                className={`h-6 text-xs px-3 ${selectedForm === 'purchase' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
                onClick={() => setSelectedForm('purchase')}
              >
                Purchase
              </Button>
              <Button 
                className={`h-6 text-xs px-3 ${selectedForm === 'sales' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
                onClick={() => setSelectedForm('sales')}
              >
                Sales
              </Button>
              <Button 
                className={`h-6 text-xs px-3 ${selectedForm === 'offline' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
                onClick={() => setSelectedForm('offline')}
              >
                Offline
              </Button>
            </div>

            {/* Details Section */}
            <div className="bg-blue-50 p-2 rounded border">
              
              {/* Show Purchase Form when selectedForm is 'purchase' */}
              {selectedForm === 'purchase' && (
                <div className="mt-1">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    {/* First Column */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">Bardana Type</span>
                        <Input name="bardanaType" value={formData.bardanaType} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">Wt per Bag</span>
                        <Input name="wtPerBag" value={formData.wtPerBag} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">No of Bags</span>
                        <Input name="noOfBags" value={formData.noOfBags} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">Bardana Weight</span>
                        <Input name="bardanaWeight" value={formData.bardanaWeight} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">Quality</span>
                        <Input name="qualityDeduction" value={formData.qualityDeduction} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                    </div>

                    {/* Second Column */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">IGP No</span>
                        <Input 
                          name="igpNo" 
                          value={formData.igpNo} 
                          onChange={handleChange} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              fetchIgpData();
                            }
                          }}
                          className="h-4 text-xs text-black flex-1" 
                          placeholder="Press Enter to fetch"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">IGP Date</span>
                        <Input 
                          name="igpDate" 
                          value={formData.igpDate} 
                          onChange={handleChange} 
                          className="h-4 text-xs text-black flex-1" 
                          type="date"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">Vendor</span>
                        <Input name="vendor" value={formData.vendor} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">Vehicle No</span>
                        <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-16">Weight</span>
                        <Input name="weight" value={formData.weight} onChange={handleChange} className="h-4 text-xs text-black w-20" />
                        <span className="text-xs text-black ml-2">Bags</span>
                        <Input name="bags" value={formData.bags} onChange={handleChange} className="h-4 text-xs text-black w-20" />
                        <input type="checkbox" className="w-3 h-3 ml-1" />
                        <span className="text-xs text-black">%</span>
                      </div>
                    </div>

                    {/* Third Column */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-20">Supplier Weight</span>
                        <Input name="supplierWeight" value={formData.supplierWeight} onChange={handleChange} className="h-4 text-xs text-black flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-20">Supp Wt - Bardana</span>
                        <Input name="supplierWeightMinusBardana" value={formData.supplierWeightMinusBardana} readOnly className="h-4 text-xs text-gray-600 bg-gray-100 flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-20">Supp Wt - Out Wt</span>
                        <Input name="supplierWeightMinusOutWeight" value={formData.supplierWeightMinusOutWeight} readOnly className="h-4 text-xs text-gray-600 bg-gray-100 flex-1" />
                      </div>
                      <div className="mt-2">
                        <Button className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white text-xs">
                          Deduction +
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button 
                      className="h-6 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium"
                      onClick={handleDeduction}
                    >
                      Deduction+
                    </Button>
                  </div>

                  {/* Compact Table with IGP Data */}
                  <div className="border rounded text-xs h-[calc(100%-200px)] overflow-auto">
                    <table className="w-full text-center">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="border p-1 text-xs text-black">Po No</th>
                          <th className="border p-1 text-xs text-black">Item Code</th>
                          <th className="border p-1 text-xs text-black">Item Description</th>
                          <th className="border p-1 text-xs text-black">PO Quantity</th>
                          <th className="border p-1 text-xs text-black">IGP Quantity</th>
                          <th className="border p-1 text-xs text-black">Balance Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {igpItems.length > 0 ? (
                          igpItems.map((item: any, index: number) => {
                            const poQty = parseFloat(item.po_qty) || 0;
                            const igpQty = parseFloat(item.igp_qty) || 0;
                            const balanceQty = poQty - igpQty;
                            
                            return (
                              <tr key={index}>
                                <td className="border p-1 h-4 text-xs text-black">{item.po_no || ''}</td>
                                <td className="border p-1 h-4 text-xs text-black">{item.item_code || ''}</td>
                                <td className="border p-1 h-4 text-xs text-black">{item.item_desc || ''}</td>
                                <td className="border p-1 h-4 text-xs text-black">{poQty.toFixed(2)}</td>
                                <td className="border p-1 h-4 text-xs text-black">{igpQty.toFixed(2)}</td>
                                <td className="border p-1 h-4 text-xs text-black">{balanceQty.toFixed(2)}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="border p-1 h-4 text-xs text-black" colSpan={6}>No IGP data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Show Sales Form when selectedForm is 'sales' */}
              {selectedForm === 'sales' && (
                <div className="h-full flex flex-col">

                  {/* Sales Table Header - exact match to image */}
                  <div className="grid gap-px bg-gray-300 text-xs font-semibold mb-1" style={{gridTemplateColumns: "100px 100px 240px 140px 120px 180px 100px 100px 140px", width: "1220px"}}>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DC #</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DO #</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Customer Name</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Vehicle No</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Do Date</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Item Description</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DC Qty</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">DO Qty</div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">Branch</div>
                  </div>

                  {/* Sales Table Body - Fixed height with 8 rows */}
                  <div className="bg-gray-200 mb-4" style={{height: "240px"}}>
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="grid gap-px text-xs" style={{gridTemplateColumns: "100px 100px 240px 140px 120px 180px 100px 100px 140px", width: "1220px", height: "30px"}}>
                        <div className="bg-white border border-gray-300 p-1">
                          <input
                            type="text"
                            className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                            value={salesData[index]?.dcNo || ''}
                            onChange={(e) => handleSalesDataChange(index, 'dcNo', e.target.value)}
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

                  {/* Bottom section with Weight Per Bags, Total Weight Dill, and Total Feed Bags */}
                  <div className="bg-gray-100 p-4 flex justify-between items-center border border-gray-300" style={{width: "1220px"}}>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-black">Weight Per Bags:</label>
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
              )}

              {/* Show Sales Form when selectedForm is 'sales' */}
              {selectedForm === 'sales' && (
                <div className="h-full flex flex-col">
                  {/* Sales form content will go here */}
                  <div className="text-center p-4">
                    <p>Sales form functionality coming soon</p>
                  </div>
                </div>
              )}
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