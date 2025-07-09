import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import WeightIndicator from "@/components/weight-indicator";
import VideoStreamFullscreen from "@/components/video-stream-fullscreen";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function SalesReturnForm() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchSlipNo, setSearchSlipNo] = useState("");
  const [searchVehicleNo, setSearchVehicleNo] = useState("");

  // Sales data state - mapped to database columns
  const [salesData, setSalesData] = useState<any[]>(
    Array.from({ length: 8 }, (_, index) => ({
      doId: "", // Will be auto-generated as maximum number
      dcNo: "",
      doNo: "",
      customerName: "", // Maps to customer_name
      vehicleNo: "", // Maps to vehicle_no
      doDate: "", // Maps to do_date (will be null for now)
      itemDescription: "", // Maps to item_description
      dcQty: "",
      doQty: "",
      branch: "",
    })),
  );

  const nonEmptyRows = salesData.filter(
    (row) =>
      row.dcNo ||
      row.doNo ||
      row.customerName ||
      row.vehicleNo ||
      row.itemDescription ||
      row.dcQty ||
      row.doQty,
  );

  // Print report function
  const handlePrintReport = () => {
    if (!formData.slipNo) {
      alert("Please save the record first or load an existing slip to print");
      return;
    }

    // Create print window with report data
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the report");
      return;
    }

    const reportHTML = generateReportHTML();
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Generate HTML for the weighbridge report
  const generateReportHTML = () => {
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
      .toUpperCase()
      .replace(/\s/g, "-");

    const currentTime = new Date().toLocaleTimeString("en-GB", {
      hour12: false,
    });

    return `
   <!DOCTYPE html>
  <html>
  <head>
    <title>Sales Return Slip - ${formData.slipNo}</title>
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
          <div class="copy-label">Head Office Copy - Sales Return</div>
          <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
        </div>
        <div class="company-name">Shahzor  Feed  Mill</div>
        <div style="height: 10px;"></div>
        <div class="slip-title">SALES RETURN SLIP</div>

        <div><b>Return #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${formData.igpNo || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div style="margin-top: 10px;">W.B # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipNo || ""}</div>
            <div style="margin-top: 10px;">Truck # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.vehicleNo || ""}</div>
            <div style="margin-top: 10px;">Return Date &nbsp;&nbsp;&nbsp;&nbsp; ${formData.returnDate || ""}</div>
          </div>
          <div class="right-section">
            <div>Customer: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>${formData.customerName || ""}</b></div>
            <div style="margin-top: 10px;">Time IN: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipInTime ? new Date(formData.slipInTime).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).toUpperCase().replace(/,/, "") : ""}</div>
            <div style="margin-top: 10px;">Time OUT: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipOutTime ? new Date(formData.slipOutTime).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).toUpperCase().replace(/,/, "") : ""}</div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <div class="section-box">
            <div class="fields">
              <div>
                <span class="label">DC #</span>
                <span class="value">${nonEmptyRows.map((row) => row.dcNo || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
              </div>
              <div>
                <span class="label">DO #</span>
                <span class="value">${nonEmptyRows.map((row) => row.doNo || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
              </div>
              <div>
                <span class="label">Customer Name</span>
                <span class="value">${nonEmptyRows.map((row) => row.customerName || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
              </div>
              <div>
                <span class="label">Item Description</span>
                <span class="value">${nonEmptyRows.map((row) => row.itemDescription || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
              </div>
              <div>
                <span class="label">Return Reason</span>
                <span class="value">${formData.returnReason || ""}</span>
              </div>
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
              <div><span class="label">GROSS WEIGHT</span> ${formData.firstWeight || "0"}</div>
              <div><span class="label">TARE WEIGHT</span> ${formData.secondWeight || "0"}</div>
              <div><span class="label">WITH BARDANA WEIGHT</span> ${formData.grossWeight || "0"}</div>
              <div><span class="label">BARDANA WEIGHT</span> ${formData.bardanaWeight || "0"}</div>
              <div><span class="label">QUALITY DEDUCTION</span> ${formData.qualityDeduction || "0"}</div>
              <div><span class="label">NET WEIGHT</span> ${formData.netWeight || "0"}</div>
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

  const handleSalesDataChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const newData = [...salesData];
    newData[index] = { ...newData[index], [field]: value };
    setSalesData(newData);
  };

  const handleSalesRowDelete = (index: number) => {
    setSalesData((prevData) => {
      const newData = [...prevData];
      // Clear the row data
      newData[index] = {
        doId: "",
        dcNo: "",
        doNo: "",
        customerName: "",
        vehicleNo: "",
        doDate: "",
        itemDescription: "",
        dcQty: "",
        doQty: "",
        branch: "",
        dcId: "",
        customerId: "",
        itemId: "",
        itemCode: "",
      };
      return newData;
    });
  };

  // Fetch all first weight records for Sales Return
  const { data: firstWeightRecords = [] } = useQuery({
    queryKey: ["/api/purchase/first-weight-records?entry_type=SALE_RETURN"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Filter records based on search criteria
  const filteredRecords = Array.isArray(firstWeightRecords)
    ? firstWeightRecords.filter((record: any) => {
        const matchesSlipNo =
          !searchSlipNo ||
          (record.slip_no || "")
            .toString()
            .toLowerCase()
            .includes(searchSlipNo.toLowerCase());
        const matchesVehicleNo =
          !searchVehicleNo ||
          (record.vehicle_no || "")
            .toString()
            .toLowerCase()
            .includes(searchVehicleNo.toLowerCase());
        return matchesSlipNo && matchesVehicleNo;
      })
    : [];

  // Function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const initialFormData = {
    // Basic slip information
    slipNo: "",
    slipInTime: "",
    slipOutTime: "",
    slipDate: "",
    status: "",
    entryType: "Sales Return",
    // Weight measurements
    firstWeight: "",
    secondWeight: "",
    netWeight: "",
    bardanaWeight: "",
    grossWeight: "",
    supplierWeight: "",
    supplierWeightMinusBardana: "",
    supplierWeightMinusOutWeight: "",
    qualityDeduction: "",
    // Vehicle and driver information
    vehicleNo: "",
    driverName: "",
    // Sales return specific fields
    returnReason: "",
    returnDate: "",
    originalSlipNo: "",
    customerName: "",
    // System fields
    wbId: "",
    companyId: "",
    branchId: "",
    branch: "",
    onlineEntry: "Yes",
    offlineEntry: "",
    createdBy: "",
    creationDate: "",
    lastUpdatedBy: "",
    lastUpdatedDate: "",
    manualDcNo: "",
    // Additional fields
    doId: "",
    doNo: "",
    doDate: "",
    freight: "",
    remarks: "",
    igpNo: "",
    igpDate: "",
    poNo: "",
    po_no: "",
    itemCode: "",
    itemDesc: "",
    poQty: "",
    igpQty: "",
    balanceQty: "",
    bardanaType: "",
    wtPerBag: "",
    noOfBags: "",
    bagCondition: "",
    bardanaTypeId: "",
    vendor: "",
    vendorName: "",
    customerId: "",
    qualityDed: "",
    weight: "",
    bags: "",
    wbItemPId: "",
    itemId: "",
    poId: "",
    baradanaType: "",
    manualIgpNo: "",
    igpId: "",
    vendorId: "",
    weightPerBags: "",
    dcQty: "",
    supWeightWithoutBardana: "",
    netSupplierWeight: "",
    isPercentageMode: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWbId, setEditingWbId] = useState<number | null>(null);

  const [onlineMode, setOnlineMode] = useState(() => {
    // Initialize based on URL parameter immediately
    const urlParams = new URLSearchParams(window.location.search);
    const typeMode = urlParams.get("type");
    console.log("Initial state calculation - typeMode:", typeMode);
    if (typeMode === "offline") {
      console.log("Setting initial state to OFFLINE");
      return false;
    } else if (typeMode === "online") {
      console.log("Setting initial state to ONLINE");
      return true;
    }
    // Default to online if no parameter specified
    console.log("No type parameter, defaulting to ONLINE");
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

    setFormData((prev) => ({
      ...prev,
      bardanaWeight: bardanaWeight > 0 ? bardanaWeight.toFixed(2) : "0.00",
      grossWeight: grossWeight > 0 ? grossWeight.toFixed(2) : "0.00",
      netWeight: netWeight > 0 ? netWeight.toFixed(2) : "0.00",
    }));
  }, [
    formData.firstWeight,
    formData.secondWeight,
    formData.wtPerBag,
    formData.noOfBags,
  ]);

  // DC Data Fetching Function for Sales Return
  const fetchDcData = async (dcNo: string, rowIndex: number) => {
    if (!dcNo || dcNo.trim() === "") {
      alert("Please enter DC No");
      return;
    }

    try {
      const response = await fetch(
        `http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/dc_data?dc_no=${dcNo}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("DC API Response:", data);

      if (data && data.items && data.items.length > 0) {
        const item = data.items[0];

        const branchName = formData.branch || "";

        setSalesData((prev) => {
          const updated = [...prev];
          updated[rowIndex] = {
            ...updated[rowIndex],
            doId: item.do_id || "",
            dcNo: item.dc_no || "",
            doNo: item.delivery_order_no ? String(item.delivery_order_no) : "",
            customerName: item.customer_name || "",
            vehicleNo: item.vehicle_no || "",
            doDate: item.dc_date || "",
            itemDescription: item.item_desc || "",
            dcQty: item.dc_qty ? String(item.dc_qty) : "",
            doQty: item.del_qty ? String(item.del_qty) : "",
            branch: branchName,
            branchId: formData.branchId,
            dcId: item.dc_id || "",
            customerId: item.customer_id || "",
            itemId: item.item_id || "",
            itemCode: item.item_code || "",
          };
          return updated;
        });
      } else {
        alert("No data found for this DC No.");
      }
    } catch (error) {
      console.error("Error fetching DC data:", error);
      alert(
        "Failed to fetch DC data. Please check the DC number and try again.",
      );
    }
  };

  // Function to cancel edit mode and return to new entry mode
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditingWbId(null);
    resetFormToInitial();
  };

  // Function to reset form to clean state
  const resetFormToInitial = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeMode = urlParams.get("type");
    const isOfflineMode = typeMode === "offline";

    // Sync onlineMode state with URL parameter
    if (typeMode === "offline") {
      setOnlineMode(false);
    } else if (typeMode === "online") {
      setOnlineMode(true);
    }

    // Fetch next slip number for Sales Return entry type
    try {
      const response = await fetch(
        "/api/purchases/next-slip?entry_type=SALE_RETURN",
      );
      const data = await response.json();

      setFormData({
        ...initialFormData,
        slipNo: data.nextSlipNo,
        slipInTime: new Date().toISOString().slice(0, 16),
        onlineEntry: isOfflineMode ? "No" : "Yes",
        offlineEntry: isOfflineMode ? "Yes" : "No",
        entryType: "Sales Return",
        creationDate: new Date().toISOString(),
        lastUpdatedDate: new Date().toISOString(),
        slipDate: new Date().toISOString(),
        returnDate: new Date().toISOString().slice(0, 16),
      });
    } catch (error) {
      console.error("Error fetching next slip number:", error);
      setFormData({
        ...initialFormData,
        slipNo: "1",
        slipInTime: new Date().toISOString().slice(0, 16),
        onlineEntry: isOfflineMode ? "No" : "Yes",
        offlineEntry: isOfflineMode ? "Yes" : "No",
        entryType: "Sales Return",
        creationDate: new Date().toISOString(),
        lastUpdatedDate: new Date().toISOString(),
        slipDate: new Date().toISOString(),
        returnDate: new Date().toISOString().slice(0, 16),
      });
    }

    // Reset sales data table
    setSalesData(
      Array.from({ length: 8 }, (_, index) => ({
        doId: "",
        dcNo: "",
        doNo: "",
        customerName: "",
        vehicleNo: "",
        doDate: "",
        itemDescription: "",
        dcQty: "",
        doQty: "",
        branch: "",
      })),
    );

    setIsEditMode(false);
    setEditingWbId(null);
  };

  // Get camera data
  const { data: camera } = useQuery({
    queryKey: ["/api/cameras/1"],
    enabled: true,
  });

  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return "";
    return isoString.slice(0, 16);
  };

  const formatISODate = (localString: string) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      "firstWeight",
      "secondWeight",
      "netWeight",
      "bardanaWeight",
      "grossWeight",
      "freight",
      "companyId",
      "branchId",
      "createdBy",
      "lastUpdatedBy",
      "wtPerBag",
      "noOfBags",
    ];

    if (numericFields.includes(name)) {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setFormData((prev) => {
          const newData = { ...prev, [name]: value };

          // Auto-calculate bardana weight when wtPerBag or noOfBags changes
          if (name === "wtPerBag" || name === "noOfBags") {
            const wtPerBag =
              parseFloat(name === "wtPerBag" ? value : prev.wtPerBag) || 0;
            const noOfBags =
              parseFloat(name === "noOfBags" ? value : prev.noOfBags) || 0;
            const calculatedBardanaWeight = wtPerBag * noOfBags;
            newData.bardanaWeight =
              calculatedBardanaWeight > 0
                ? String(calculatedBardanaWeight)
                : "";
          }

          return newData;
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleOnlineMode = (isOnline: boolean) => {
    console.log(
      "toggleOnlineMode called with:",
      isOnline,
      "Current onlineMode:",
      onlineMode,
    );

    // Only update if mode actually changes
    if (onlineMode !== isOnline) {
      setOnlineMode(isOnline);

      // Update URL to reflect the current mode
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set("type", isOnline ? "online" : "offline");
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, "", newUrl);

      // Update form data to reflect the mode change
      setFormData((prev) => ({
        ...prev,
        onlineEntry: isOnline ? "Yes" : "No",
        offlineEntry: isOnline ? "No" : "Yes",
      }));

      console.log("Mode changed to:", isOnline ? "ONLINE" : "OFFLINE");
    }
  };

  const readLicensePlate = async () => {
    setPlateReading(true);
    try {
      console.log("Starting license plate recognition...");
      const response = await fetch("/api/cameras/read-plate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameraId: 1 }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("OCR Response:", result);

        if (result.success && result.plateNumber) {
          setFormData((prev) => ({ ...prev, vehicleNo: result.plateNumber }));
          console.log(
            "License plate detected:",
            result.plateNumber,
            "Method:",
            result.method,
          );

          // Show success message with method info
          const methodText =
            result.method === "camera_anpr_api"
              ? "Camera ANPR"
              : "Computer Vision OCR";
          alert(
            `License plate detected: ${result.plateNumber}\nMethod: ${methodText}\nConfidence: ${(result.confidence * 100).toFixed(0)}%`,
          );
        } else {
          console.log("No license plate detected:", result.error);
          alert(
            `License plate recognition failed:\n${result.error}\n\nPlease ensure:\n- Camera is connected and accessible\n- Vehicle with license plate is visible in camera view\n- Camera has clear view of the license plate`,
          );
        }
      } else {
        const errorText = await response.text();
        console.error("API error:", errorText);
        alert("Failed to process camera image");
      }
    } catch (error) {
      console.error("Error reading license plate:", error);
      alert("Error connecting to camera system");
    }
    setPlateReading(false);
  };

  // Fetch entry types and branches
  useEffect(() => {
    const fetchEntryTypes = async () => {
      try {
        const response = await fetch("/api/entry-types");
        if (response.ok) {
          const entryTypeData = await response.json();
          setEntryTypes(entryTypeData);
        }
      } catch (error) {
        console.error("Error fetching entry types:", error);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await fetch("/api/branches");
        if (response.ok) {
          const branchData = await response.json();
          setBranches(branchData);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchEntryTypes();
    fetchBranches();
  }, []);

  // Handle URL parameters for edit mode and form type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get("edit");
    const typeMode = urlParams.get("type");

    console.log("URL parameters:", { editWbId, typeMode });

    // Set online/offline mode based on type parameter - IMMEDIATE UPDATE
    if (typeMode === "offline") {
      console.log("Setting OFFLINE mode from URL parameter");
      setOnlineMode(false);
    } else if (typeMode === "online") {
      console.log("Setting ONLINE mode from URL parameter");
      setOnlineMode(true);
    }

    if (editWbId) {
      // Load record for editing by wb_id
      loadDataByWbId(parseInt(editWbId)); //Calling the loadDataByWbId because it has been commented, now uncommented
    } else {
      // Reset form to clean state for new sales return - delay to ensure proper initialization
      setTimeout(() => {
        resetFormToInitial();
      }, 100);
    }
  }, [location]);

  // Sync form data when onlineMode changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      onlineEntry: onlineMode ? "Yes" : "No",
      offlineEntry: onlineMode ? "No" : "Yes",
    }));
  }, [onlineMode]);

  // Additional effect to handle URL changes for real-time mode switching
  useEffect(() => {
    const handleURLChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const typeMode = urlParams.get("type");

      if (typeMode === "offline" && onlineMode) {
        setOnlineMode(false);
      } else if (typeMode === "online" && !onlineMode) {
        setOnlineMode(true);
      }
    };

    // Check URL on component mount and location changes
    handleURLChange();
  }, [location, onlineMode]);

  useEffect(() => {
    // Fetch next slip number specific to SALE_RETURN entry type
    fetch("/api/purchases/next-slip?entry_type=SALE_RETURN")
      .then((res) => res.json())
      .then((data: any) => {
        setFormData((prev) => ({ ...prev, slipNo: data.nextSlipNo }));
      })
      .catch((err: any) => {
        console.error("Error fetching next slip number:", err);
        setFormData((prev) => ({ ...prev, slipNo: "1" }));
      });

    // Fetch branches for dropdown
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data: any[]) => {
        setBranches(data);
        console.log("Branches fetched:", data);

        // Set default branch based on logged-in user's branch
        if (
          data.length > 0 &&
          (!formData.branchId || formData.branchId === "")
        ) {
          const userBranchId = user?.branchId;
          const defaultBranch = userBranchId
            ? data.find((b) => b.branch_id === userBranchId) || data[0]
            : data[0];
          setFormData((prev) => ({
            ...prev,
            branchId: String(defaultBranch.branch_id),
            branch: String(defaultBranch.branch_id),
            createdBy: user?.userid || "",
          }));
        }
      })
      .catch((err: any) => {
        console.error("Error fetching branches:", err);
      });

    const now = new Date().toISOString();
    setFormData((prev) => ({
      ...prev,
      slipInTime: now.slice(0, 16),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
      returnDate: now.slice(0, 16),
    }));
  }, []);

  const resetForm = () => {
    // When Clear button is pressed, clear everything except Slip No
    const currentSlipNo = formData.slipNo;
    setFormData({
      ...initialFormData,
      slipNo: currentSlipNo,
    });
    setIsEditMode(false);
    setEditingWbId(null);
    // Keep current online/offline mode
  };

  const captureFirstWeight = async () => {
    try {
      const response = await fetch("/api/weight/data");
      const weightData = await response.json();

      // Update the firstWeight field with current weight reading
      setFormData((prev) => ({
        ...prev,
        firstWeight: weightData.weight,
      }));
    } catch (error) {
      console.error("Error fetching weight data:", error);
      alert("Failed to capture weight reading");
    }
  };

  const captureSecondWeight = async () => {
    try {
      const response = await fetch("/api/weight/data");
      const weightData = await response.json();

      const currentTime = new Date().toISOString();

      // Update the secondWeight field with current weight reading and set slip_out_time
      setFormData((prev) => ({
        ...prev,
        secondWeight: weightData.weight,
        slipOutTime: currentTime.slice(0, 16), // Format for datetime-local input
      }));
    } catch (error) {
      console.error("Error fetching weight data:", error);
      alert("Failed to capture weight reading");
    }
  };

  const handleSave = async () => {
    setLoading(true);

    // Validate that first weight is not null/empty when saving
    if (
      !formData.firstWeight ||
      formData.firstWeight.trim() === "" ||
      parseFloat(formData.firstWeight) <= 0
    ) {
      alert("First weight is required and must be greater than 0");
      setLoading(false);
      return;
    }

    try {
      // Prepare master data payload
      const masterDataPayload = {
        slip_no: formData.slipNo || null,
        slip_in_time: formatISODate(formData.slipInTime),
        first_weight: formData.firstWeight && formData.firstWeight.trim() !== "" 
          ? parseFloat(formData.firstWeight) : null,
        second_weight: formData.secondWeight && formData.secondWeight.trim() !== "" 
          ? parseFloat(formData.secondWeight) : null,
        net_weight: formData.netWeight && formData.netWeight.trim() !== "" 
          ? parseFloat(formData.netWeight) : null,
        bardana_weight: formData.bardanaWeight && formData.bardanaWeight.trim() !== "" 
          ? parseFloat(formData.bardanaWeight) : null,
        gross_weight: formData.grossWeight && formData.grossWeight.trim() !== "" 
          ? parseFloat(formData.grossWeight) : null,
        freight: formData.freight && formData.freight.trim() !== "" 
          ? parseFloat(formData.freight) : null,
        remarks: formData.remarks || null,
        driver_name: formData.driverName || null,
        company_id: formData.companyId && formData.companyId !== "undefined" && formData.companyId.trim() !== "" 
          ? parseInt(formData.companyId, 10) : null,
        branch_id: formData.branchId && formData.branchId !== "undefined" && formData.branchId.trim() !== "" 
          ? parseInt(formData.branchId, 10) : null,
        online_entry: formData.onlineEntry === "Yes" || formData.onlineEntry === true ? "Yes" : null,
        offline_entry: formData.offlineEntry === "Yes" || formData.offlineEntry === true ? "Yes" : null,
        created_by: user?.userid || null,
        creation_date: formData.creationDate || null,
        last_updated_by: formData.lastUpdatedBy && formData.lastUpdatedBy !== "undefined" && formData.lastUpdatedBy.trim() !== "" 
          ? parseInt(formData.lastUpdatedBy, 10) : null,
        last_updated_date: formData.lastUpdatedDate || null,
        manual_dc_no: formData.manualDcNo || null,
        slip_out_time: formatISODate(formData.slipOutTime),
        status: formData.status || null,
        slip_date: formData.slipDate || null,
        return_reason: formData.returnReason || null,
        return_date: formatISODate(formData.returnDate),
        original_slip_no: formData.originalSlipNo || null,
        customer_name: formData.customerName || null
      };

      // Filter non-empty sales rows
      const nonEmptyRows = salesData.filter(
        (row) =>
          row.dcNo ||
          row.doNo ||
          row.customerName ||
          row.vehicleNo ||
          row.itemDescription ||
          row.dcQty ||
          row.doQty,
      );

      // Save to backend
      const response = await fetch("/api/sales-return/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          masterData: masterDataPayload,
          salesData: nonEmptyRows
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save sales return data: ${errorText}`);
      }

      const result = await response.json();
      console.log("Sales return data saved successfully:", result);
      alert("Sales return data saved successfully!");

      // Reset form to clean state
      await resetFormToInitial();
    } catch (error: any) {
      console.error("Error saving sales return data:", error);
      alert(`Failed to save sales return data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to load data by wb_id for editing
  const loadDataByWbId = async (wbId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sales-return/${wbId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for wbId: ${wbId}`);
      }
      const data = await response.json();

      // Ensure the data is properly structured
      if (data && data.masterData) {
        const masterData = data.masterData;
        const salesData = data.salesData || [];

        // Format date strings correctly
        masterData.slipInTime = formatDatetimeLocal(masterData.slip_in_time);
        masterData.slipOutTime = formatDatetimeLocal(masterData.slip_out_time);
        masterData.slipDate = formatDatetimeLocal(masterData.slip_date);
        masterData.returnDate = formatDatetimeLocal(masterData.return_date);

        setFormData({
          slipNo: masterData.slip_no || "",
          slipInTime: masterData.slipInTime || "",
          slipOutTime: masterData.slipOutTime || "",
          slipDate: masterData.slipDate || "",
          status: masterData.status || "",
          entryType: masterData.entry_type || "Sales Return",
          firstWeight: masterData.first_weight ? String(masterData.first_weight) : "",
          secondWeight: masterData.second_weight ? String(masterData.second_weight) : "",
          netWeight: masterData.net_weight ? String(masterData.net_weight) : "",
          bardanaWeight: masterData.bardana_weight ? String(masterData.bardana_weight) : "",
          grossWeight: masterData.gross_weight ? String(masterData.gross_weight) : "",
          supplierWeight: masterData.supplier_weight ? String(masterData.supplier_weight) : "",
          supplierWeightMinusBardana: masterData.supplier_weight_minus_bardana ? String(masterData.supplier_weight_minus_bardana) : "",
          supplierWeightMinusOutWeight: masterData.supplier_weight_minus_out_weight ? String(masterData.supplier_weight_minus_out_weight) : "",
          qualityDeduction: masterData.quality_deduction ? String(masterData.quality_deduction) : "",
          vehicleNo: masterData.vehicle_no || "",
          driverName: masterData.driver_name || "",
          returnReason: masterData.return_reason || "",
          returnDate: masterData.returnDate || "",
          originalSlipNo: masterData.original_slip_no || "",
          customerName: masterData.customer_name || "",
          wbId: String(masterData.wb_id) || "",
          companyId: String(masterData.company_id) || "",
          branchId: String(masterData.branch_id) || "",
          branch: String(masterData.branch_id) || "",
          onlineEntry: masterData.online_entry || "Yes",
          offlineEntry: masterData.offline_entry || "No",
          createdBy: String(masterData.created_by) || "",
          creationDate: masterData.creation_date || "",
          lastUpdatedBy: String(masterData.last_updated_by) || "",
          lastUpdatedDate: masterData.last_updated_date || "",
          manualDcNo: masterData.manual_dc_no || "",
          doId: masterData.do_id || "",
          doNo: masterData.do_no || "",
          doDate: masterData.do_date || "",
          freight: masterData.freight ? String(masterData.freight) : "",
          remarks: masterData.remarks || "",
          igpNo: masterData.igp_no || "",
          igpDate: masterData.igp_date || "",
          poNo: masterData.po_no || "",
          po_no: masterData.po_no || "",
          itemCode: masterData.item_code || "",
          itemDesc: masterData.item_desc || "",
          poQty: masterData.po_qty || "",
          igpQty: masterData.igp_qty || "",
          balanceQty: masterData.balance_qty || "",
          bardanaType: masterData.bardana_type || "",
          wtPerBag: masterData.wt_per_bag ? String(masterData.wt_per_bag) : "",
          noOfBags: masterData.no_of_bags ? String(masterData.no_of_bags) : "",
          bagCondition: masterData.bag_condition || "",
          bardanaTypeId: String(masterData.bardana_type_id) || "",
          vendor: masterData.vendor || "",
          vendorName: masterData.vendor_name || "",
          customerId: String(masterData.customer_id) || "",
          qualityDed: masterData.quality_ded || "",
          weight: masterData.weight || "",
          bags: masterData.bags || "",
          wbItemPId: String(masterData.wb_item_p_id) || "",
          itemId: String(masterData.item_id) || "",
          poId: String(masterData.po_id) || "",
          baradanaType: masterData.baradana_type || "",
          manualIgpNo: masterData.manual_igp_no || "",
          igpId: String(masterData.igp_id) || "",
          vendorId: String(masterData.vendor_id) || "",
          weightPerBags: masterData.weight_per_bags || "",
          dcQty: masterData.dc_qty || "",
          supWeightWithoutBardana: masterData.sup_weight_without_bardana || "",
          netSupplierWeight: masterData.net_supplier_weight || "",
          isPercentageMode: masterData.is_percentage_mode || false,
        });

        // Set sales data - pad with empty rows to always show 8 rows
        const mappedSalesData = salesData.map((item: any) => ({
          doId: item.do_id || "",
          dcNo: item.igp_no || "",  // DC No maps to igp_no in database
          doNo: item.po_no || "",   // DO No maps to po_no in database
          customerName: item.customer_name || item.vendor_name || "",
          vehicleNo: item.vehicle_no || "",
          doDate: item.igp_date || "",
          itemDescription: item.item_desc || "",
          dcQty: item.igp_qty ? String(item.igp_qty) : "",
          doQty: item.po_qty ? String(item.po_qty) : "",
          branch: item.branch || "",
          dcId: item.dc_id || "",
          customerId: item.customer_id || "",
          itemId: item.item_id || "",
          itemCode: item.item_code || "",
        }));

        // Pad with empty rows to always show 8 rows
        const paddedSalesData = [...mappedSalesData];
        while (paddedSalesData.length < 8) {
          paddedSalesData.push({
            doId: "",
            dcNo: "",
            doNo: "",
            customerName: "",
            vehicleNo: "",
            doDate: "",
            itemDescription: "",
            dcQty: "",
            doQty: "",
            branch: "",
            dcId: "",
            customerId: "",
            itemId: "",
            itemCode: "",
          });
        }

        setSalesData(paddedSalesData);

        setIsEditMode(true);
        setEditingWbId(wbId);
      } else {
        alert("Invalid data format received for editing.");
      }
    } catch (error: any) {
      console.error("Error loading data for editing:", error);
      alert(`Error loading data for editing: ${error.message}`);
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
                onClick={() => {
                  setSearchSlipNo("");
                  setSearchVehicleNo("");
                }}
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
                <div
                  key={index}
                  className="grid grid-cols-3 border-b border-gray-400 hover:bg-gray-50"
                >
                  <button
                    className="border-r border-gray-400 p-1 text-center text-xs text-blue-600 hover:text-blue-800 hover:underline bg-white text-left"
                    onClick={() => {
                      console.log("Clicked record:", record);
                      console.log("wb_id:", record.wb_id);
                      console.log("entry_type:", record.entry_type);
                      // Load the data for editing if needed
                      loadDataByWbId(record.wb_id);
                      // Navigate to edit mode by updating URL - SAME PAGE RELOAD
                      const urlParams = new URLSearchParams(window.location.search);
                      urlParams.set("edit", record.wb_id);
                      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
                      window.history.pushState({}, "", newUrl);
                      setLocation(newUrl);
                    }}
                  >
                    {record.slip_no || "---"}
                  </button>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {record.vehicle_no || "---"}
                  </div>
                  <div className="p-1 text-center text-xs text-blue-600 font-semibold bg-white">
                    {record.entry_type || "SALE_RETURN"}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-3 border-b border-gray-400">
                <div className="border-r border-gray-400 p-1 text-center text-xs text-gray-500 bg-white">
                  {searchSlipNo || searchVehicleNo
                    ? "No matches"
                    : "No records"}
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
          EDIT MODE: Sales Return Slip No. {formData.slipNo} (ID: {editingWbId})
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
              const typeMode = urlParams.get("type") || "online";
              const targetUrl = `/purchase-form?type=${typeMode}`;
              window.history.pushState({}, "", targetUrl);
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
              const typeMode = urlParams.get("type") || "online";
              const targetUrl = `/sales-form?type=${typeMode}`;
              window.history.pushState({}, "", targetUrl);
              setLocation(targetUrl);
            }}
          >
            Sale
          </Button>
          <Button 
            className="h-8 px-2 text-sm font-medium bg-rose-700 text-white"
            onClick={() => {
              // Navigate to sales return form with same type
              const urlParams = new URLSearchParams(window.location.search);
              const typeMode = urlParams.get("type") || "online";
              const targetUrl = `/sales-return?type=${typeMode}`;
              window.history.pushState({}, "", targetUrl);
              setLocation(targetUrl);
            }}
          >
            Sales Return
          </Button>
          <Button
            className="h-8 px-2 text-sm font-medium bg-gray-300 hover:bg-gray-400 text-black"
            onClick={() => {
              // Navigate to purchase return form with same type
              const urlParams = new URLSearchParams(window.location.search);
              const typeMode = urlParams.get("type") || "online";
              const targetUrl = `/purchase-return?type=${typeMode}`;
              window.history.pushState({}, "", targetUrl);
              setLocation(targetUrl);
            }}
          >
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
          {isEditMode && (
            <Button
              className="h-8 px-2 text-sm bg-gray-500 hover:bg-gray-600 text-white font-medium"
              onClick={cancelEdit}
            >
              Cancel Edit
            </Button>
          )}
        </div>
        <div className="flex gap-1 items-center">
          {/* Weight Display - positioned on left side with bolder text */}
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

      {/* Main Form Layout - 100% visible without scrolling */}
      <div className="bg-white p-1 rounded border h-[calc(100vh-60px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-1 h-full">
          {/* Left Side - Main Form (Columns 1-8) */}
          <div className="col-span-8">
            {/* Master Table Section */}
            <div className="bg-red-50 p-2 rounded border mb-3">
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
                    <Label className="text-xs text-black">
                      Original Slip No
                    </Label>
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
                    <Label className="text-xs text-black">Customer Name</Label>
                    <Input
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      className="h-5 text-xs text-black"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-black">Branch</Label>
                    <Select
                      name="branch"
                      value={formData.branch}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          branch: value,
                          branchId: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-5 text-xs text-black">
                        <SelectValue
                          placeholder="Select branch"
                          className="text-black"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem
                            key={branch.branch_id}
                            value={branch.branch_id.toString()}
                          >
                            {branch.branch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  {/* Clean Camera Feed - just the video content */}
                  <div className="mt-2 h-24 w-full overflow-hidden">
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

            {/* Large Label Between Sections */}
            <div className="text-center py-4 mb-3">
              <div
                className={`inline-block px-8 py-3 rounded-lg shadow-md ${
                  onlineMode === true
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                }`}
              >
                <h2 className="text-3xl font-bold tracking-wide">
                  {onlineMode === true
                    ? "Sales Return Online"
                    : "Sales Return Offline"}
                </h2>
              </div>
            </div>

            {/* Sales Return Details Section */}
            <div className="bg-red-50 p-2 rounded border">
              <div className="mb-4">
                <Label className="text-xs text-black">Return Reason</Label>
                <Textarea
                  placeholder="Enter return reason"
                  name="returnReason"
                  value={formData.returnReason}
                  onChange={handleChange}
                  className="h-16 text-xs resize-none text-black placeholder:text-gray-500"
                />
              </div>

              <div className="h-full flex flex-col">
                {/* Sales Table Header - with delete action column */}
                <div
                  className="grid gap-px bg-gray-300 text-xs font-semibold mb-1"
                  style={{
                    gridTemplateColumns:
                      "100px 100px 240px 140px 120px 180px 100px 100px 140px 30px",
                    width: "1250px",
                  }}
                >
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    DC #
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    DO #
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    Customer Name
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    Vehicle No
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    Do Date
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    Item Description
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    DC Qty
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    DO Qty
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    Branch
                  </div>
                  <div className="bg-red-100 p-1 text-center border border-gray-400 text-black">
                    ✖
                  </div>
                </div>

                {/* Sales Table Body - Fixed height with 8 rows */}
                <div className="bg-gray-200 mb-4" style={{ height: "240px" }}>
                  {[...Array(8)].map((_, index) => (
                    <div
                      key={index}
                      className="grid gap-px text-xs"
                      style={{
                        gridTemplateColumns:
                          "100px 100px 240px 140px 120px 180px 100px 100px 140px 30px",
                        width: "1250px",
                        height: "30px",
                      }}
                    >
                      <div className="bg-white border border-gray-300 p-1">
                        <input
                          type="text"
                          className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                          value={salesData[index]?.dcNo || ""}
                          onChange={(e) =>
                            handleSalesDataChange(index, "dcNo", e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const dcNo = salesData[index]?.dcNo;
                              if (dcNo && dcNo.trim() !== "") {
                                fetchDcData(dcNo.trim(), index);
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
                          value={salesData[index]?.doNo || ""}
                          onChange={(e) =>
                            handleSalesDataChange(index, "doNo", e.target.value)
                          }
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
                          value={salesData[index]?.customerName || ""}
                          onChange={(e) =>
                            handleSalesDataChange(
                              index,
                              "customerName",
                              e.target.value,
                            )
                          }
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
                          value={salesData[index]?.vehicleNo || ""}
                          onChange={(e) =>
                            handleSalesDataChange(
                              index,
                              "vehicleNo",
                              e.target.value,
                            )
                          }
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
                          value={salesData[index]?.doDate || ""}
                          onChange={(e) =>
                            handleSalesDataChange(
                              index,
                              "doDate",
                              e.target.value,
                            )
                          }
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
                          value={salesData[index]?.itemDescription || ""}
                          onChange={(e) =>
                            handleSalesDataChange(
                              index,
                              "itemDescription",
                              e.target.value,
                            )
                          }
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
                          value={salesData[index]?.dcQty || ""}
                          onChange={(e) =>
                            handleSalesDataChange(
                              index,
                              "dcQty",
                              e.target.value,
                            )
                          }
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
                          value={salesData[index]?.doQty || ""}
                          onChange={(e) =>
                            handleSalesDataChange(
                              index,
                              "doQty",
                              e.target.value,
                            )
                          }
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
                          value={
                            // Use formData.branch for consistent branch display
                            branches.find(
                              (b) =>
                                b.branch_id.toString() ===
                                formData.branchId?.toString(),
                            )?.branch_name ||
                            formData.branch ||
                            ""
                          }
                          onChange={(e) =>
                            handleSalesDataChange(
                              index,
                              "branch",
                              e.target.value,
                            )
                          }
                          autoComplete="off"
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
                <div
                  className="grid gap-px text-xs font-semibold mb-4"
                  style={{
                    gridTemplateColumns:
                      "100px 100px 240px 140px 120px 180px 100px 100px 140px",
                    width: "1220px",
                    height: "30px",
                  }}
                >
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
                      value={salesData.reduce(
                        (sum, row) => sum + (parseFloat(row.dcQty) || 0),
                        0,
                      )}
                    />
                  </div>
                  <div className="bg-white border border-gray-400 p-1">
                    <input
                      type="text"
                      className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none text-right font-semibold"
                      readOnly
                      value={salesData.reduce(
                        (sum, row) => sum + (parseFloat(row.doQty) || 0),
                        0,
                      )}
                    />
                  </div>
                  <div className="bg-gray-200 border border-gray-400 p-1"></div>
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

