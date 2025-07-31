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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import WeightIndicator from "@/components/weight-indicator";
import WeightDisplayTable from "@/components/weight-display-table";
import VideoStreamFullscreen from "@/components/video-stream-fullscreen";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function SalesForm() {
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

    const currentUserName = user?.userName || "admin";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Weighbridge Slip</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      margin: 20px;
    }

    .container {
      border: 1px solid black;
      padding: 20px;
      height: 1122px;
      box-sizing: border-box;
    }

    .title {
      text-align: center;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .copy-label {
      text-align: right;
      font-weight: bold;
    }

    .row-box {
      margin: 15px 0 5px 0;
      display: flex;
      justify-content: space-between;
      border-right: 1px solid black;
    }

    .section,
    .center-wrapper {
      width: 33.33%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .left-info {
      border-left: 1px solid black;
    }

    .line-top {
      border-top: 1px solid black;
      height: 1px;
      margin-bottom: 8px;
    }

    .line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid black;
      padding: 0 2px;
      margin-bottom: 2px;
    }

    .line span {
      display: inline-block;
      font-size: 11px;
    }

    .line span:first-child {
      width: 48%;
      font-weight: normal;
    }

    .center-box {
      border: 1px solid black;
      text-align: center;
      font-weight: bold;
      width: 100%;
      height: 130px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
      padding: 8px 10px;
    }

    .truck-label {
      font-weight: normal;
      font-size: 11px;
      border-bottom: 1px solid black;
      margin-bottom: 5px;
      padding-bottom: 2px;
    }

    .image-box {
      border: 1px solid black;
      height: 62px;
      text-align: center;
      padding: 5px;
      margin-top: -2px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .table th, .table td {
      border: 1px solid black;
      padding: 4px;
      text-align: left;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }

    .signature-block {
      flex: 1;
      font-size: 12px;
    }

    .signature-label {
      display: inline-block;
    }

    .signature-line {
      display: inline-block;
      border-bottom: 1px solid black;
      width: 120px;
      position: relative;
    }

    .signature-name {
      font-size: 10px;
      color: #444;
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
    }

    .signature-container {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .totals {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-weight: bold;
    }

    .totals.right-only {
      justify-content: flex-end;
    }

    hr.dashed {
      border: 1px dashed #aaa;
      margin: 30px 0;
    }
  </style>
</head>
<body>

<div class="container">
  <div class="title">SHAHZOR FEED (Pvt) LTD</div>
  <div class="copy-label">Office Copy</div>

  <div class="row-box">
    <div class="section left-info">
      <div class="line-top"></div>
      <div class="line"><span>Slip No:</span><span>${formData.slipNo}</span></div>
      <div class="line"><span>Time In:</span><span>${formData.slipInTime}</span></div>
      <div class="line"><span>Time Out:</span><span>${formData.slipOutTime}</span></div>
      <div class="image-box">
        <img src="/captured_images/first_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="First Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>

    <div class="center-wrapper">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
        ${formData.vehicleNo}
      </div>
    </div>

    <div class="section">
      <div class="line-top"></div>
      <div class="line"><span>Tare Weight:</span><span>${formData.secondWeight}</span></div>
      <div class="line"><span>Loaded Weight:</span><span>${formData.firstWeight}</span></div>
      <div class="line"><span>Net Weight:</span><span>${formData.netWeight}</span></div>
      <div class="image-box">
        <img src="/captured_images/second_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="Second Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>DC #</th>
        <th>DO #</th>
        <th>Party Name</th>
        <th>Feed #</th>
        <th>Feed Name</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${nonEmptyRows
        .map(
          (row) => `
        <tr>
          <td>${row.dcNo}</td>
          <td>${row.doNo}</td>
          <td>${row.customerName}</td>
          <td>${row.feedNo}</td>
          <td>${row.itemDescription}</td>
          <td>${row.dcQty}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formData.freight || 0}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc, row) => acc + (parseFloat(row.dcQty) || 0), 0)}</div>
  </div>

  <div class="signatures">
    <div class="signature-block" style="text-align: left;">
      <div class="signature-container">
        <span class="signature-label">Prepared By:</span>
        <span class="signature-line">
          <span class="signature-name">${currentUserName}</span>
        </span>
      </div>
    </div>
    <div class="signature-block" style="text-align: center;">
      <span class="signature-label">Checked By:</span>
      <span class="signature-line"></span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>

  <hr class="dashed" />

  <!-- CUSTOMER COPY -->
  <div class="title">Weight Slip</div>
  <div class="copy-label">Customer Copy</div>

  <div class="row-box">
    <div class="section left-info">
      <div class="line-top"></div>
      <div class="line"><span>Slip No:</span><span>${formData.slipNo}</span></div>
      <div class="line"><span>Time In:</span><span>${formData.slipInTime}</span></div>
      <div class="line"><span>Time Out:</span><span>${formData.slipOutTime}</span></div>
      <div class="image-box">
        <img src="/captured_images/first_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="First Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>

    <div class="center-wrapper">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
        ${formData.vehicleNo}
      </div>
    </div>

    <div class="section">
      <div class="line-top"></div>
      <div class="line"><span>Tare Weight:</span><span>${formData.secondWeight}</span></div>
      <div class="line"><span>Loaded Weight:</span><span>${formData.firstWeight}</span></div>
      <div class="line"><span>Net Weight:</span><span>${formData.netWeight}</span></div>
      <div class="image-box">
        <img src="/captured_images/second_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="Second Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Party Name</th>
        <th>Feed #</th>
        <th>Feed Name</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${nonEmptyRows
        .map(
          (row) => `
        <tr>
          <td>${row.customerName}</td>
          <td>${row.feedNo}</td>
          <td>${row.itemDescription}</td>
          <td>${row.dcQty}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals right-only">
    <div>Grand Total: ${nonEmptyRows.reduce((acc, row) => acc + (parseFloat(row.dcQty) || 0), 0)}</div>
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

  // ===== DATA FETCHING SECTION - PERFORMANCE OPTIMIZED =====
  // Fetch all first weight records with performance optimization
  const { data: firstWeightRecords = [] } = useQuery({
    queryKey: ["/api/purchase/first-weight-records"],
    staleTime: 30 * 1000, // 30 seconds cache for immediate updates
    refetchInterval: 30 * 1000, // Refresh every 30 seconds for new entries
    refetchOnMount: true, // Refetch on component mount to get latest data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Fetch offline records specifically with performance optimization
  const { data: offlineRecords = [] } = useQuery({
    queryKey: ["/api/purchases/offline"],
    staleTime: 30 * 1000, // 30 seconds cache for immediate updates
    refetchInterval: 30 * 1000, // Refresh every 30 seconds for new entries
    refetchOnMount: true, // Refetch on component mount to get latest data
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // State for showing offline entries
  const [showOfflineEntries, setShowOfflineEntries] = useState(false);

  // Filter records based on search criteria and form type
  const filteredRecords = (() => {
    let records = [];

    if (showOfflineEntries) {
      // Show offline records when offline tab is selected
      records = Array.isArray(offlineRecords) ? offlineRecords : [];
    } else {
      // Show all first weight records for other tabs
      records = Array.isArray(firstWeightRecords) ? firstWeightRecords : [];
    }

    return records.filter((record: any) => {
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
    });
  })();

  // Function to load data by wb_id for editing
  const loadDataByWbId = async (wbId: number) => {
    try {
      console.log("loadDataByWbId called with wbId:", wbId);
      const response = await fetch(`/api/purchase/by-wbid/${wbId}`);
      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      if (data && data.master) {
        const master = data.master;
        const details =
          data.details && data.details.length > 0 ? data.details[0] : {};

        // Enable edit mode
        setIsEditMode(true);
        setEditingWbId(master.wb_id);
        console.log("✅ Edit mode enabled for wb_id:", master.wb_id);

        // Load all the form data including detail table data
        setFormData((prev) => ({
          ...prev,
          slipNo: master.slip_no || "",
          vehicleNo: details.vehicle_no || "",
          firstWeight: master.first_weight ? String(master.first_weight) : "",
          secondWeight: master.second_weight
            ? String(master.second_weight)
            : "",
          netWeight: master.net_weight ? String(master.net_weight) : "",
          bardanaWeight: master.bardana_weight
            ? String(master.bardana_weight)
            : "",
          grossWeight: master.gross_weight ? String(master.gross_weight) : "",
          freight: master.freight ? String(master.freight) : "",
          remarks: master.remarks || "",
          driverName: master.driver_name || "",
          // Detail table data
          vendor: details.vendor_name || "",
          igpNo: details.igp_no || "",
          poNo: details.po_no || "",
          itemCode: details.item_code || "",
          itemDesc: details.item_desc || "",
          poQty: details.po_qty ? String(details.po_qty) : "",
          igpQty: details.igp_qty ? String(details.igp_qty) : "",
          balanceQty: details.balance_qty ? String(details.balance_qty) : "",
          bardanaType: details.bardana_type || "",
          wtPerBag: details.weight_per_bags
            ? String(details.weight_per_bags)
            : "",
          noOfBags: details.no_of_bags ? String(details.no_of_bags) : "",
          igpDate: details.igp_date || "",
          slipInTime: master.slip_in_time
            ? formatDatetimeLocal(master.slip_in_time)
            : "",
          slipOutTime: master.slip_out_time
            ? formatDatetimeLocal(master.slip_out_time)
            : "",
          entryType: master.entry_type || "SALE",
          branch: master.branch_id ? String(master.branch_id) : "",
          branchId: master.branch_id ? String(master.branch_id) : "",
        }));

        // Set online/offline status based on database values - prioritize offline_entry
        console.log(
          "Database entry mode - offline_entry:",
          master.offline_entry,
          "online_entry:",
          master.online_entry,
        );

        if (master.offline_entry === "Yes") {
          console.log("Setting offline mode for sale entry");
          setOnlineMode(false);

          // Update URL to reflect offline mode
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set("type", "offline");
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.replaceState({}, "", newUrl);
        } else if (master.online_entry === "Yes") {
          console.log("Setting online mode for sale entry");
          setOnlineMode(true);

          // Update URL to reflect online mode
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set("type", "online");
          const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
          window.history.replaceState({}, "", newUrl);
        }

        // Load sales data from details - check for both SALE and if we have detail data
        if (data.details && data.details.length > 0) {
          const salesRows = data.details.map((detail: any, index: number) => {
            // Find branch name from branches array using master's branch_id
            const branchName =
              branches.find((b) => b.branch_id === master.branch_id)
                ?.branch_name || "";

            return {
              doId: String(index + 1),
              dcNo: detail.manual_dc_no || detail.igp_no || "", // Depending on source
              doNo: detail.do_no || detail.po_no || "", // Try both fields
              customerName: detail.customer_name || detail.vendor_name || "",
              vehicleNo: detail.vehicle_no || "",
              doDate: detail.do_date || detail.igp_date || "", // May be null
              itemDescription: detail.item_desc || "",
              dcQty: detail.dc_qty
                ? String(detail.dc_qty)
                : detail.igp_qty
                  ? String(detail.igp_qty)
                  : "",
              doQty: detail.do_qty
                ? String(detail.do_qty)
                : detail.po_qty
                  ? String(detail.po_qty)
                  : "",
              branch: branchName,
              // Hidden / internal fields
              dcId: detail.dc_id || "", // if applicable
              customerId: detail.customer_id || "",
              itemId: detail.item_id || "",
              itemCode: detail.item_code || "",
            };
          });

          // Ensure 8 rows
          while (salesRows.length < 8) {
            salesRows.push({
              doId: "",
              dcId: "",
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

          setSalesData(salesRows);
          console.log("✅ Sales data loaded in edit mode:", salesRows);
        } else {
          // No detail data found, reset to empty table
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
              dcId: "",
              customerId: "",
              itemId: "",
              itemCode: "",
            })),
          );
          console.log("No sales detail data found, using empty table");
        }
      }
    } catch (error) {
      console.error("Error loading data by wb_id:", error);
      alert("Failed to load record data");
    }
  };

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
    entryType: "SALE",
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
    // IGP and purchase details
    igpNo: "",
    igpDate: "",
    poNo: "",
    po_no: "",
    itemCode: "",
    itemDesc: "",
    poQty: "",
    igpQty: "",
    balanceQty: "",
    // Bardana information
    bardanaType: "",
    wtPerBag: "",
    noOfBags: "",
    bagCondition: "",
    bardanaTypeId: "",
    // Vendor information
    vendor: "",
    vendorName: "",
    customerId: "",
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
    // Missing fields that are referenced in the code
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
  const [isSearchMode, setIsSearchMode] = useState(false);

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
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  // Auto-calculate formulas when relevant fields change
  useEffect(() => {
    const firstWeight = parseFloat(formData.firstWeight) || 0;
    const secondWeight = parseFloat(formData.secondWeight) || 0;
    const wtPerBag = parseFloat(formData.wtPerBag) || 0;
    const noOfBags = parseFloat(formData.noOfBags) || 0;

    // Bardana Weight = weight per bag * number of bags
    const bardanaWeight = wtPerBag * noOfBags;

    // Gross Weight = First Weight - Second Weight
    const grossWeight = secondWeight - firstWeight;

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

  // DC Data Fetching Function for Sales
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
        const item = data.items[0]; // ✅ Single DC No for one row

        // ✅ Get branch name from branches array using formData.branchId
        const branchName =
          branches.find(
            (b) => b.branch_id.toString() === formData.branchId?.toString(),
          )?.branch_name || "";

        setSalesData((prev) => {
          const updated = [...prev];
          updated[rowIndex] = {
            ...updated[rowIndex],
            doId: item.do_id || "",
            dcNo: item.dc_no || "",
            doNo: item.delivery_order_no ? String(item.delivery_order_no) : "",
            customerName: item.customer_name || "",
            vehicleNo: item.vehicle_no || "",
            doDate: item.dc_date
              ? new Date(item.dc_date).toISOString().split("T")[0]
              : "",
            itemDescription: item.item_desc || "",
            dcQty: item.dc_qty ? String(item.dc_qty) : "",
            doQty: item.del_qty ? String(item.del_qty) : "",
            branch: branchName, // 👈 For UI - now shows branch name
            branchId: formData.branchId, // 👈 For backend
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

  // Function to search and load data by slip number
  const searchAndLoadBySlipNo = async () => {
    if (!formData.slipNo || formData.slipNo.trim() === "") {
      alert("Please enter a slip number to search");
      return;
    }

    try {
      setLoading(true);
      console.log("Searching for slip:", formData.slipNo);

      // Search with entry type filtering to only find sale-related entries
      const response = await fetch(
        `/api/sales/by-slip/${formData.slipNo.trim()}?entry_type=SALE`,
      );

      if (!response.ok) {
        alert(`No SALE record found for slip number ${formData.slipNo}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data && data.master) {
        const master = data.master;
        const entryType = master.entry_type;
        const isOffline = master.offline_entry === "Yes";

        console.log(
          "Found SALE record - Entry Type:",
          entryType,
          "Offline:",
          isOffline,
        );

        // Check if this is a sale-related entry that can be edited in sales form
        if (entryType === "SALE" || entryType === "SALE_RETURN") {
          // Update online/offline status based on the found record
          setOnlineMode(!isOffline);

          // Determine the correct URL based on entry type and online/offline status
          const modeParam = isOffline ? "offline" : "online";

          if (entryType === "SALE_RETURN") {
            const targetUrl = `/sales-return?type=${modeParam}&edit=${master.wb_id}`;
            console.log(
              `Found ${entryType} entry (${isOffline ? "Offline" : "Online"}), redirecting to:`,
              targetUrl,
            );
            setLocation(targetUrl);
          } else {
            // For SALE entries, stay on current page and load the data
            await loadDataByWbId(master.wb_id);

            // Update URL to show edit mode with correct type
            const newUrl = `/sales-form?type=${modeParam}&edit=${master.wb_id}`;
            window.history.replaceState({}, "", newUrl);

            // Exit search mode
            setIsSearchMode(false);
            setLoading(false);
            return;
          }
        } else {
          alert(
            `Found ${entryType} entry for slip ${formData.slipNo}, but this is the Sales form. Please use the appropriate form for ${entryType} entries.`,
          );
        }
      } else {
        alert("Invalid record data found");
      }
    } catch (error) {
      console.error("Error searching for slip:", error);
      alert("Failed to search for slip number");
    } finally {
      setLoading(false);
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

    // Only fetch next slip number if not in edit mode
    if (!isEditMode && !editingWbId) {
      // Fetch next slip number for SALE entry type
      try {
        const response = await fetch(
          "/api/purchases/next-slip?entry_type=SALE",
        );
        const data = await response.json();

        setFormData({
          ...initialFormData,
          slipNo: data.nextSlipNo,
          slipInTime: new Date().toISOString().slice(0, 16),
          onlineEntry: isOfflineMode ? "No" : "Yes",
          offlineEntry: isOfflineMode ? "Yes" : "No",
          entryType: "SALE",
          creationDate: new Date().toISOString(),
          lastUpdatedDate: new Date().toISOString(),
          slipDate: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error fetching next slip number:", error);
        // Fallback - fetch next SALE slip number
        setFormData({
          ...initialFormData,
          slipNo: "1",
          slipInTime: new Date().toISOString().slice(0, 16),
          onlineEntry: isOfflineMode ? "No" : "Yes",
          offlineEntry: isOfflineMode ? "Yes" : "No",
          entryType: "SALE",
          creationDate: new Date().toISOString(),
          lastUpdatedDate: new Date().toISOString(),
          slipDate: new Date().toISOString(),
        });
      }
    } else {
      // In edit mode, just update the online/offline status without changing slip number
      setFormData((prev) => ({
        ...prev,
        onlineEntry: isOfflineMode ? "No" : "Yes",
        offlineEntry: isOfflineMode ? "Yes" : "No",
      }));
    }

    // Reset sales data table only if not in edit mode
    if (!isEditMode && !editingWbId) {
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
    }

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

  // ===== OPTIMIZED DATA FETCHING SECTION - STATIC DATA WITH OPTIMIZED CACHE =====
  // Fetch entry types, branches, customers, and items - optimized with React Query
  const { data: entryTypesData = [] } = useQuery({
    queryKey: ["/api/entry-types"],
    staleTime: 300000, // Cache for 5 minutes (static data)
    refetchOnWindowFocus: false,
  });

  const { data: branchesData = [] } = useQuery({
    queryKey: ["/api/branches"],
    staleTime: 300000, // Cache for 5 minutes (static data)
    refetchOnWindowFocus: false,
  });

  const { data: customersData = [] } = useQuery({
    queryKey: ["/api/customers"],
    staleTime: 300000, // Cache for 5 minutes (static data)
    refetchOnWindowFocus: false,
    enabled: !onlineMode, // Only fetch when in offline mode
  });

  const { data: itemsData = [] } = useQuery({
    queryKey: ["/api/items"],
    staleTime: 300000, // Cache for 5 minutes (static data)
    refetchOnWindowFocus: false,
    enabled: !onlineMode, // Only fetch when in offline mode
  });

  // Update state when data changes
  useEffect(() => {
    if (entryTypesData) setEntryTypes(entryTypesData);
  }, [entryTypesData]);

  useEffect(() => {
    if (branchesData) setBranches(branchesData);
  }, [branchesData]);

  useEffect(() => {
    if (customersData) setCustomers(customersData);
  }, [customersData]);

  useEffect(() => {
    if (itemsData) setItems(itemsData);
  }, [itemsData]);

  // Handle URL parameters for edit mode and form type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get("edit");
    const searchMode = urlParams.get("search");
    const typeMode = urlParams.get("type");

    console.log("URL parameters:", { editWbId, searchMode, typeMode });

    // Set online/offline mode based on type parameter - IMMEDIATE UPDATE
    if (typeMode === "offline") {
      console.log("Setting OFFLINE mode from URL parameter");
      setOnlineMode(false);
    } else if (typeMode === "online") {
      console.log("Setting ONLINE mode from URL parameter");
      setOnlineMode(true);
    }

    // Check if we should be in search mode
    if (searchMode === "true") {
      setIsSearchMode(true);
      setIsEditMode(false);
      setEditingWbId(null);
      setFormData((prev) => ({ ...prev, slipNo: "" }));
      return;
    }

    // Check if we should be in edit mode based on URL parameter
    if (editWbId) {
      // Load record for editing by wb_id
      console.log(
        "Edit mode detected from URL parameter, loading data for wb_id:",
        editWbId,
      );
      loadDataByWbId(parseInt(editWbId));
      return; // Exit early to prevent any other initialization
    } else {
      // No edit parameter in URL, reset to new form only if not already in edit mode
      if (isEditMode) {
        console.log(
          "No edit parameter in URL but currently in edit mode, resetting to new form",
        );
        setIsEditMode(false);
        setEditingWbId(null);
        setTimeout(() => {
          resetFormToInitial();
        }, 100);
      } else if (!formData.slipNo || formData.slipNo === "") {
        // Only reset if we don't have form data already
        console.log(
          "No edit parameter and no form data, initializing new form",
        );
        setTimeout(() => {
          resetFormToInitial();
        }, 100);
      }
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

  // Update sales data with branch names when branches are loaded and we're in edit mode
  useEffect(() => {
    if (
      branches.length > 0 &&
      isEditMode &&
      formData.branchId &&
      salesData.length > 0
    ) {
      const branchName =
        branches.find(
          (b) => b.branch_id.toString() === formData.branchId?.toString(),
        )?.branch_name || "";

      if (branchName && salesData.some((row) => row.branch === "")) {
        setSalesData((prevData) =>
          prevData.map((row) => ({
            ...row,
            branch:
              row.customerName || row.dcNo || row.doNo
                ? branchName
                : row.branch,
          })),
        );
        console.log("Updated sales data with branch names:", branchName);
      }
    }
  }, [branches, isEditMode, formData.branchId, salesData]);

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
    // Check if we're in edit mode before fetching next slip number
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get("edit");

    // Only fetch next slip number if not in edit mode
    if (!editWbId && !isEditMode && !editingWbId) {
      // Fetch next slip number specific to SALE entry type
      fetch("/api/purchases/next-slip?entry_type=SALE")
        .then((res) => res.json())
        .then((data: any) => {
          setFormData((prev) => ({ ...prev, slipNo: data.nextSlipNo }));
        })
        .catch((err: any) => {
          console.error("Error fetching next slip number:", err);
          setFormData((prev) => ({ ...prev, slipNo: "1" }));
        });
    }

    // Fetch branches for dropdown
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data: any[]) => {
        setBranches(data);
        console.log("Branches fetched:", data);

        // Always set default branch based on logged-in user's branch
        if (data.length > 0) {
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
      let savedWbId: number;

      if (isEditMode && editingWbId) {
        // UPDATE MODE: Update existing record
        console.log("Updating existing sales record with wb_id:", editingWbId);

        const updatePayload = {
          slip_no: formData.slipNo || null,
          slip_in_time: formatISODate(formData.slipInTime),
          first_weight:
            formData.firstWeight && formData.firstWeight.trim() !== ""
              ? parseFloat(formData.firstWeight)
              : null,
          second_weight:
            formData.secondWeight && formData.secondWeight.trim() !== ""
              ? parseFloat(formData.secondWeight)
              : null,
          net_weight:
            formData.netWeight && formData.netWeight.trim() !== ""
              ? parseFloat(formData.netWeight)
              : null,
          bardana_weight:
            formData.bardanaWeight && formData.bardanaWeight.trim() !== ""
              ? parseFloat(formData.bardanaWeight)
              : null,
          gross_weight:
            formData.grossWeight && formData.grossWeight.trim() !== ""
              ? parseFloat(formData.grossWeight)
              : null,
          freight:
            formData.freight && formData.freight.trim() !== ""
              ? parseFloat(formData.freight)
              : null,
          remarks: formData.remarks || null,
          driver_name: formData.driverName || null,
          company_id:
            formData.companyId &&
            formData.companyId !== "undefined" &&
            formData.companyId.trim() !== ""
              ? parseInt(formData.companyId, 10)
              : null,
          branch_id:
            formData.branchId &&
            formData.branchId !== "undefined" &&
            formData.branchId.trim() !== ""
              ? parseInt(formData.branchId, 10)
              : null,
          online_entry:
            formData.onlineEntry === "Yes" || formData.onlineEntry === true
              ? "Yes"
              : null,
          offline_entry:
            formData.offlineEntry === "Yes" || formData.offlineEntry === true
              ? "Yes"
              : null,
          last_updated_by: user?.userid || null,
          last_updated_date: new Date().toISOString(),
          manual_dc_no: formData.manualDcNo || null,
          slip_out_time: formatISODate(formData.slipOutTime),
          status: formData.status || null,
          slip_date: formData.slipDate || null,
          // Include sales data fields in update
          vendor_name:
            salesData.find((row) => row.customerName)?.customerName || null,
          vehicle_no:
            salesData.find((row) => row.vehicleNo)?.vehicleNo ||
            formData.vehicleNo ||
            null,
          po_no: salesData.find((row) => row.doNo)?.doNo || null,
          igp_no: salesData.find((row) => row.dcNo)?.dcNo || null,
          item_desc:
            salesData.find((row) => row.itemDescription)?.itemDescription ||
            null,
          po_qty: salesData.find((row) => row.doQty)?.doQty
            ? parseFloat(salesData.find((row) => row.doQty)?.doQty!)
            : null,
          igp_qty: salesData.find((row) => row.dcQty)?.dcQty
            ? parseFloat(salesData.find((row) => row.dcQty)?.dcQty!)
            : null,
          igp_date: salesData.find((row) => row.doDate)?.doDate || null,
        };

        const updateResponse = await fetch(
          `/api/purchase/update/${editingWbId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatePayload),
          },
        );

        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Failed to update sales record: ${errorText}`);
        }

        savedWbId = editingWbId;
        console.log("Sales record updated successfully");
      } else {
        // CREATE MODE: Create new record
        console.log("Creating new sales record");

        // Generate WB_ID for the sales record
        const wbIdResponse = await fetch("/api/purchases", {
          method: "GET",
        });
        const existingRecords = await wbIdResponse.json();
        const maxWbId =
          existingRecords.length > 0
            ? Math.max(...existingRecords.map((r: any) => r.wb_id || 0))
            : 0;
        const newWbId = maxWbId + 1;

        // Prepare master data payload with proper null handling for numeric fields
        const masterPayload = {
          slip_no: formData.slipNo || null,
          slip_in_time: formatISODate(formData.slipInTime),
          first_weight:
            formData.firstWeight && formData.firstWeight.trim() !== ""
              ? parseFloat(formData.firstWeight)
              : null,
          second_weight:
            formData.secondWeight && formData.secondWeight.trim() !== ""
              ? parseFloat(formData.secondWeight)
              : null,
          net_weight:
            formData.netWeight && formData.netWeight.trim() !== ""
              ? parseFloat(formData.netWeight)
              : null,
          bardana_weight:
            formData.bardanaWeight && formData.bardanaWeight.trim() !== ""
              ? parseFloat(formData.bardanaWeight)
              : null,
          gross_weight:
            formData.grossWeight && formData.grossWeight.trim() !== ""
              ? parseFloat(formData.grossWeight)
              : null,
          freight:
            formData.freight && formData.freight.trim() !== ""
              ? parseFloat(formData.freight)
              : null,
          remarks: formData.remarks || null,
          driver_name: formData.driverName || null,
          company_id:
            formData.companyId &&
            formData.companyId !== "undefined" &&
            formData.companyId.trim() !== ""
              ? parseInt(formData.companyId, 10)
              : null,
          branch_id:
            formData.branchId &&
            formData.branchId !== "undefined" &&
            formData.branchId.trim() !== ""
              ? parseInt(formData.branchId, 10)
              : null,
          online_entry:
            formData.onlineEntry === "Yes" || formData.onlineEntry === true
              ? "Yes"
              : null,
          offline_entry:
            formData.offlineEntry === "Yes" || formData.offlineEntry === true
              ? "Yes"
              : null,
          created_by: user?.userid || null,
          creation_date: formData.creationDate || null,
          last_updated_by:
            formData.lastUpdatedBy &&
            formData.lastUpdatedBy !== "undefined" &&
            formData.lastUpdatedBy.trim() !== ""
              ? parseInt(formData.lastUpdatedBy, 10)
              : null,
          last_updated_date: formData.lastUpdatedDate || null,
          manual_dc_no: formData.manualDcNo || null,
          entry_type: "SALE",
          slip_out_time: formatISODate(formData.slipOutTime),
          status: formData.status || null,
          slip_date: formData.slipDate || null,
        };

        const masterResponse = await fetch("/api/purchases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(masterPayload),
        });

        if (!masterResponse.ok) {
          const errorText = await masterResponse.text();
          throw new Error(`Failed to save master sales record: ${errorText}`);
        }

        savedWbId = newWbId;
      }

      // Save sales detail records for each non-empty row (for both create and update)
      if (!isEditMode) {
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

        for (const row of nonEmptyRows) {
          const salesItemPayload = {
            wb_id: savedWbId,
            bardana_type: null,
            igp_no: row.dcNo || null,
            vehicle_no: row.vehicleNo || null,
            weight_per_bags: null,
            igp_date: row.doDate || null,
            supplier_weight: null,
            quality_deduction: null,
            bardana_weight: null,
            no_of_bags: null,
            vendor_name: row.customerName || null,
            bag_condition: null,
            po_no: row.doNo || null,
            item_code: null,
            item_desc: row.itemDescription || null,
            po_qty:
              row.doQty && row.doQty.trim() !== ""
                ? parseFloat(row.doQty)
                : null,
            igp_qty:
              row.dcQty && row.dcQty.trim() !== ""
                ? parseFloat(row.dcQty)
                : null,
            balance_qty: null,
            customer_name: row.customerName || null,
            do_no: row.doNo || null,
            do_qty:
              row.doQty && row.doQty.trim() !== ""
                ? parseFloat(row.doQty)
                : null,
            dc_qty:
              row.dcQty && row.dcQty.trim() !== ""
                ? parseFloat(row.dcQty)
                : null,
          };

          const salesItemResponse = await fetch("/api/purchase-items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(salesItemPayload),
          });

          if (!salesItemResponse.ok) {
            console.error("Failed to save sales item:", row);
          }
        }
      }

      console.log("Sales data saved successfully");
      alert(
        isEditMode
          ? "Sales data updated successfully!"
          : "Sales data saved successfully!",
      );

      // Reset sales data table after successful save
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
          // Hidden columns for database storage
          dcId: "",
          customerId: "",
          itemId: "",
          itemCode: "",
        })),
      );

      console.log("Sales data table cleared after save");

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

      const currentUserName = user?.userName || "admin";

      // Auto-print after successful save
      setTimeout(() => {
        try {
          const printHTML = `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Weighbridge Slip</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      margin: 20px;
    }

    .container {
      border: 1px solid black;
      padding: 20px;
      height: 1122px;
      box-sizing: border-box;
    }

    .title {
      text-align: center;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .copy-label {
      text-align: right;
      font-weight: bold;
    }

    .row-box {
      margin: 15px 0 5px 0;
      display: flex;
      justify-content: space-between;
      border-right: 1px solid black;
    }

    .section,
    .center-wrapper {
      width: 33.33%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .left-info {
      border-left: 1px solid black;
    }

    .line-top {
      border-top: 1px solid black;
      height: 1px;
      margin-bottom: 8px;
    }

    .line {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid black;
      padding: 0 2px;
      margin-bottom: 2px;
    }

    .line span {
      display: inline-block;
      font-size: 11px;
    }

    .line span:first-child {
      width: 48%;
      font-weight: normal;
    }

    .center-box {
      border: 1px solid black;
      text-align: center;
      font-weight: bold;
      width: 100%;
      height: 130px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
      padding: 8px 10px;
    }

    .truck-label {
      font-weight: normal;
      font-size: 11px;
      border-bottom: 1px solid black;
      margin-bottom: 5px;
      padding-bottom: 2px;
    }

    .image-box {
      border: 1px solid black;
      height: 62px;
      text-align: center;
      padding: 5px;
      margin-top: -2px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .table th, .table td {
      border: 1px solid black;
      padding: 4px;
      text-align: left;
    }

    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }

    .signature-block {
      flex: 1;
      font-size: 12px;
    }

    .signature-label
 {
      display: inline-block;
    }

    .signature-line {
      display: inline-block;
      border-bottom: 1px solid black;
      width: 120px;
      position: relative;
    }

    .signature-name {
      font-size: 10px;
      color: #444;
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
    }

    .signature-container {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .totals {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      font-weight: bold;
    }

    .totals.right-only {
      justify-content: flex-end;
    }

    hr.dashed {
      border: 1px dashed #aaa;
      margin: 30px 0;
    }
  </style>
</head>
<body>

<div class="container">
  <div class="title">SHAHZOR FEED (Pvt) LTD</div>
  <div class="copy-label">Office Copy</div>

  <div class="row-box">
    <div class="section left-info">
      <div class="line-top"></div>
      <div class="line"><span>Slip No:</span><span>${formData.slipNo}</span></div>
      <div class="line"><span>Time In:</span><span>${formData.slipInTime}</span></div>
      <div class="line"><span>Time Out:</span><span>${formData.slipOutTime}</span></div>
      <div class="image-box">
        <img src="/captured_images/first_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="First Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>

    <div class="center-wrapper">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
        ${formData.vehicleNo}
      </div>
    </div>

    <div class="section">
      <div class="line-top"></div>
      <div class="line"><span>Tare Weight:</span><span>${formData.secondWeight}</span></div>
      <div class="line"><span>Loaded Weight:</span><span>${formData.firstWeight}</span></div>
      <div class="line"><span>Net Weight:</span><span>${formData.netWeight}</span></div>
      <div class="image-box">
        <img src="/captured_images/second_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="Second Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>DC #</th>
        <th>DO #</th>
        <th>Party Name</th>
        <th>Feed #</th>
        <th>Feed Name</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${nonEmptyRows
        .map(
          (row) => `
        <tr>
          <td>${row.dcNo}</td>
          <td>${row.doNo}</td>
          <td>${row.customerName}</td>
          <td>${row.feedNo}</td>
          <td>${row.itemDescription}</td>
          <td>${row.dcQty}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formData.freight || 0}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc, row) => acc + (parseFloat(row.dcQty) || 0), 0)}</div>
  </div>

  <div class="signatures">
    <div class="signature-block" style="text-align: left;">
      <div class="signature-container">
        <span class="signature-label">Prepared By:</span>
        <span class="signature-line">
          <span class="signature-name">${currentUserName}</span>
        </span>
      </div>
    </div>
    <div class="signature-block" style="text-align: center;">
      <span class="signature-label">Checked By:</span>
      <span class="signature-line"></span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>

  <hr class="dashed" />

  <!-- CUSTOMER COPY -->
  <div class="title">Weight Slip</div>
  <div class="copy-label">Customer Copy</div>

  <div class="row-box">
    <div class="section left-info">
      <div class="line-top"></div>
      <div class="line"><span>Slip No:</span><span>${formData.slipNo}</span></div>
      <div class="line"><span>Time In:</span><span>${formData.slipInTime}</span></div>
      <div class="line"><span>Time Out:</span><span>${formData.slipOutTime}</span></div>
      <div class="image-box">
        <img src="/captured_images/first_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="First Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>

    <div class="center-wrapper">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
        ${formData.vehicleNo}
      </div>
    </div>

    <div class="section">
      <div class="line-top"></div>
      <div class="line"><span>Tare Weight:</span><span>${formData.secondWeight}</span></div>
      <div class="line"><span>Loaded Weight:</span><span>${formData.firstWeight}</span></div>
      <div class="line"><span>Net Weight:</span><span>${formData.netWeight}</span></div>
      <div class="image-box">
        <img src="/captured_images/second_weight/slip_${formData.slipNo}.jpg" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" alt="Second Weight Image" />
        <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
      </div>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>Party Name</th>
        <th>Feed #</th>
        <th>Feed Name</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${nonEmptyRows
        .map(
          (row) => `
        <tr>
          <td>${row.customerName}</td>
          <td>${row.feedNo}</td>
          <td>${row.itemDescription}</td>
          <td>${row.dcQty}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals right-only">
    <div>Grand Total: ${nonEmptyRows.reduce((acc, row) => acc + (parseFloat(row.dcQty) || 0), 0)}</div>
  </div>
</div>

</body>
</html>



`;
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(printHTML);
            printWindow.document.close();
            printWindow.print();
          }
        } catch (printError) {
          console.error("Auto-print error:", printError);
        }
      }, 500);

      // If second weight was entered, refresh to remove from display table
      if (formData.secondWeight && parseFloat(formData.secondWeight) > 0) {
        console.log(
          "Second weight added for sales entry, refreshing to remove from display table",
        );
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return; // Exit here to prevent form reset before refresh
      }

      // Exit edit mode after successful save/update
      if (isEditMode) {
        setIsEditMode(false);
        setEditingWbId(null);
        sessionStorage.removeItem("salesFormEditMode");

        // Clear URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete("edit");
        const newUrl = urlParams.toString()
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);

        // Fetch next slip number for new entry after edit
        try {
          const response = await fetch(
            "/api/purchases/next-slip?entry_type=SALE",
          );
          const data = await response.json();

          setFormData({
            ...initialFormData,
            slipNo: data.nextSlipNo,
            slipInTime: new Date().toISOString().slice(0, 16),
            onlineEntry: onlineMode ? "Yes" : "No",
            offlineEntry: onlineMode ? "No" : "Yes",
            entryType: "SALE",
            creationDate: new Date().toISOString(),
            lastUpdatedDate: new Date().toISOString(),
            slipDate: new Date().toISOString(),
            branchId: user?.branchId ? String(user.branchId) : "1",
            branch: user?.branchId ? String(user.branchId) : "1",
            createdBy: user?.userid || "",
          });

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
              dcId: "",
              customerId: "",
              itemId: "",
              itemCode: "",
            })),
          );

          console.log(
            "✅ Form reset to new entry with slip number:",
            data.nextSlipNo,
          );
        } catch (error) {
          console.error("Error fetching next slip number:", error);
          // Fallback reset
          resetFormToInitial();
        }
      } else {
        // Reset form to clean state and increment slip number for next entry
        resetFormToInitial();
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save sales data.";
      alert(errorMessage);
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 p-1 overflow-hidden relative">
      {/* Weight Display Table - Upper Right Side */}
      <div
        className={`absolute ${isEditMode ? "top-40" : "top-20"} right-14 z-50`}
      >
        <div className="bg-white border-2 border-gray-400 rounded-md shadow-lg w-96 mb-6">
          {/* Header Row */}
          <div className="grid grid-cols-3 border-b border-gray-400">
            <div className="bg-gray-200 border-r border-gray-400 p-2 text-center text-sm font-semibold text-black">
              Slip No
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-2 text-center text-sm font-semibold text-black">
              Vehicle No
            </div>
            <div className="bg-gray-200 p-2 text-center text-sm font-semibold text-black">
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
                    className="border-r border-gray-400 p-2 text-center text-xs text-blue-600 w-[127px]"
                    onClick={() => {
                      console.log("Clicked record:", record);
                      console.log("wb_id:", record.wb_id);
                      console.log("entry_type:", record.entry_type);

                      if (record.wb_id) {
                        // Navigate based on entry type
                        if (record.entry_type === "PURCHASE") {
                          // Navigate to purchase form
                          const urlParams = new URLSearchParams(
                            window.location.search,
                          );
                          const typeMode = urlParams.get("type") || "online";
                          const targetUrl = `/purchase-form?type=${typeMode}&edit=${record.wb_id}`;
                          setLocation(targetUrl);
                        } else if (record.entry_type === "PURCHASE_RETURN") {
                          // Navigate to purchase return form
                          const urlParams = new URLSearchParams(
                            window.location.search,
                          );
                          const typeMode = urlParams.get("type") || "online";
                          const targetUrl = `/purchase-return?type=${typeMode}&edit=${record.wb_id}`;
                          setLocation(targetUrl);
                        } else if (record.entry_type === "SALE_RETURN" || record.entry_type === "SALES_RETURN") {
                          // Navigate to sales return form
                          const urlParams = new URLSearchParams(
                            window.location.search,
                          );
                          const typeMode = urlParams.get("type") || "online";
                          const targetUrl = `/sales-return?type=${typeMode}&edit=${record.wb_id}`;
                          console.log(
                            "Navigating to sales return form:",
                            targetUrl,
                          );
                          window.location.href = targetUrl;
                        } else {
                          // Load the data for editing (sales entries)
                          loadDataByWbId(record.wb_id);
                        }
                      }
                    }}
                  >
                    {record.slip_no || "---"}
                  </button>
                  <div className="border-r border-gray-400 p-2 text-center text-xs text-black w-[135px]">
                    {record.vehicle_no || "---"}
                  </div>
                  <div className="p-2 text-center text-xs text-blue-600 font-semibold flex-1">
                    {record.entry_type || "PURCHASE"}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-3 border-b border-gray-400">
                <div className="border-r border-gray-400 p-2 text-center text-xs text-gray-500 bg-white">
                  {searchSlipNo || searchVehicleNo
                    ? "No matches"
                    : "No records"}
                </div>
                <div className="border-r border-gray-400 p-2 text-center text-xs text-gray-500 bg-white">
                  ---
                </div>
                <div className="p-2 text-center text-xs text-gray-500 bg-white">
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
            className="h-8 px-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              // Always navigate to new purchase form
              const urlParams = new URLSearchParams(window.location.search);
              const typeMode = urlParams.get("type") || "online";
              const targetUrl = `/purchase-form?type=${typeMode}`;
              // Clear any edit state and force navigation
              sessionStorage.removeItem("salesFormEditMode");
              window.location.href = targetUrl;
            }}
          >
            Purchase
          </Button>
          <Button
            className={`h-8 text-xs px-3 ${!showOfflineEntries ? "bg-rose-700 text-white" : "bg-gray-300 text-black"}`}
            onClick={() => {
              // Always navigate to new sales form
              const urlParams = new URLSearchParams(window.location.search);
              const typeMode = urlParams.get("type") || "online";
              const targetUrl = `/sales-form?type=${typeMode}`;
              // Clear any edit state and force navigation
              sessionStorage.removeItem("salesFormEditMode");
              window.location.href = targetUrl;
            }}
          >
            Sales
          </Button>
          <Button
            className="h-8 px-2 text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => toggleOnlineMode(false)}
          >
            Offline
          </Button>
          <Button className="h-8 px-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
            First
          </Button>
          <Button className="h-8 px-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium">
            Prev
          </Button>
          <Button className="h-8 px-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white font-medium">
            Next
          </Button>
          <Button className="h-8 px-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium">
            Last
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 h-10 px-4 text-sm text-white font-medium"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
          {isEditMode && (
            <Button
              className="h-8 px-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium"
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          )}
          <Button
            className="h-8 px-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={() => {
              if (isSearchMode || isEditMode) {
                // If in search mode or edit mode, reset to new form
                resetFormToInitial();
                setIsSearchMode(false);
                setIsEditMode(false);
                setEditingWbId(null);

                // Clear URL parameters and set to new form mode
                const newUrl =
                  window.location.pathname +
                  "?type=" +
                  (onlineMode ? "online" : "offline");
                window.history.replaceState({}, "", newUrl);
              } else {
                // Enter search mode
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set("search", "true");
                const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
                window.history.replaceState({}, "", newUrl);
                setIsSearchMode(true);
                setFormData((prev) => ({ ...prev, slipNo: "" }));
              }
            }}
          >
            {isSearchMode || isEditMode ? "New" : "Edit"}
          </Button>
          <Button
            className="h-8 px-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium"
            onClick={handlePrintReport}
          >
            Print
          </Button>
          <Button className="h-8 px-2 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium">
            Rej
          </Button>
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

      {/* ===== MAIN FORM LAYOUT SECTION ===== */}
      {/* Main Form Layout - 100% visible without scrolling */}
      <div className="bg-white p-1 rounded border h-[calc(100vh-60px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-1 h-full">
          {/* ===== LEFT SIDE - MAIN FORM AREA (COLUMNS 1-8) ===== */}
          <div className="col-span-8">
            {/* ===== MASTER TABLE SECTION - BASIC SLIP INFORMATION ===== */}
            <div className="bg-blue-50 p-2 rounded border mb-4 w-full">
              <div className="grid grid-cols-9 gap-4">
                {/* ===== COLUMN 1 - LEFT FORM FIELDS SECTION ===== */}
                <div className="col-span-3 flex flex-col gap-2 items-start">
                  {/* ===== SLIP NUMBER FIELD ===== */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-20">Slip No</Label>
                    {isSearchMode ? (
                      <div className="flex gap-1 w-52">
                        <Input
                          name="slipNo"
                          value={formData.slipNo}
                          onChange={handleChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              searchAndLoadBySlipNo();
                            }
                          }}
                          placeholder="Enter slip number to search"
                          className="h-8 text-xs text-black flex-1"
                        />
                        <Button
                          onClick={searchAndLoadBySlipNo}
                          className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                          disabled={loading}
                        >
                          {loading ? "..." : "Search"}
                        </Button>
                      </div>
                    ) : (
                      <Input
                        name="slipNo"
                        value={formData.slipNo}
                        readOnly
                        className="h-8 text-xs text-black w-52"
                      />
                    )}
                  </div>

                  {/* Net Weight */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-20">
                      Net Weight
                    </Label>
                    <Input
                      name="netWeight"
                      value={formData.netWeight}
                      onChange={handleChange}
                      className="h-8 text-xs bg-yellow-200 text-black w-52"
                    />
                  </div>

                  {/* Freight */}
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-20">Freight</Label>
                    <Input
                      name="freight"
                      value={formData.freight}
                      onChange={handleChange}
                      className="h-8 text-xs text-black w-52"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="flex items-start gap-1">
                    <Label className="text-xs text-black w-20 mt-1">
                      Remarks
                    </Label>
                    <Textarea
                      placeholder="Add remarks"
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      className="h-20 text-xs resize-none text-black placeholder:text-gray-500 w-60"
                    />
                  </div>
                </div>

                {/* ===== COLUMN 2 - WEIGHT MEASUREMENT FIELDS SECTION ===== */}
                <div className="col-span-3 flex flex-col gap-2 items-start">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-24">
                      First Weight
                    </Label>
                    <Input
                      name="firstWeight"
                      value={formData.firstWeight}
                      onChange={handleChange}
                      className={`h-8 text-xs text-black w-52 ${isEditMode ? "bg-gray-100" : ""}`}
                      readOnly={isEditMode}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-24">
                      Second Weight
                    </Label>
                    <Input
                      name="secondWeight"
                      value={formData.secondWeight}
                      onChange={handleChange}
                      className={`h-8 text-xs text-green-600 w-52 ${isEditMode ? "bg-gray-100" : ""}`}
                      readOnly={isEditMode}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-24">
                      Bardana Weight
                    </Label>
                    <Input
                      name="bardanaWeight"
                      value={formData.bardanaWeight}
                      onChange={handleChange}
                      className="h-8 text-xs text-black w-52"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-24">
                      Gross Weight
                    </Label>
                    <Input
                      name="grossWeight"
                      value={formData.grossWeight}
                      readOnly
                      className="h-8 text-xs text-black w-52"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-24">Branch</Label>
                    {isEditMode ? (
                      <Input
                        value={
                          branches.find(
                            (b) =>
                              b.branch_id.toString() ===
                              formData.branchId?.toString(),
                          )?.branch_name ||
                          formData.branch ||
                          ""
                        }
                        readOnly
                        className="h-8 text-xs text-black bg-gray-100 w-52"
                      />
                    ) : (
                      <Select
                        name="branch"
                        value={formData.branchId || formData.branch}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            branch: value,
                            branchId: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs text-black w-52">
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
                    )}
                  </div>
                </div>

                {/* ===== COLUMN 3 - DRIVER INFO & CAMERA CONTROLS SECTION ===== */}
                <div className="col-span-3 flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    {/* Driver Name */}
                    <div className="flex items-center gap-1">
                      <Label className="text-xs text-black w-20">
                        Driver Name
                      </Label>
                      <Input
                        placeholder="Enter driver name"
                        name="driverName"
                        value={formData.driverName}
                        onChange={handleChange}
                        className="h-8 text-xs text-black placeholder:text-gray-500 w-52"
                      />
                    </div>
                  </div>

                  {/* Buttons & Camera Feed */}
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      <Button
                        className="h-8 bg-green-600 text-xs"
                        onClick={captureFirstWeight}
                        disabled={
                          formData.firstWeight &&
                          formData.firstWeight.trim() !== ""
                        }
                      >
                        1st WHT
                      </Button>
                      <Button
                        className="h-8 bg-gray-500 text-xs"
                        onClick={captureSecondWeight}
                        disabled={
                          formData.secondWeight &&
                          formData.secondWeight.trim() !== ""
                        }
                      >
                        2nd WHT
                      </Button>
                    </div>

                    <div className="h-40 w-full overflow-hidden mb-1 rounded border">
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

                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        className="h-8 bg-yellow-500 text-xs"
                        onClick={resetForm}
                      >
                        Clear
                      </Button>
                      <Button className="h-8 bg-red-500 text-xs">Exit</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== SALES MODE INDICATOR SECTION ===== */}
            <div className="text-center py-1 mb-3">
              <div
                className={`inline-block px-4 py-1 rounded-lg shadow-md ${
                  onlineMode === true
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                }`}
              >
                <h2 className="text-3xl font-bold tracking-wide">
                  {onlineMode === true ? "Sale Online" : "Sale Offline"}
                </h2>
              </div>
            </div>

            {/* Top buttons row - above details section */}
            <div className="flex gap-2 mb-2">
              <Button
                className="h-6 text-xs px-3 bg-gray-300 text-black"
                onClick={() => {
                  // Always navigate to new purchase form
                  const urlParams = new URLSearchParams(window.location.search);
                  const typeMode = urlParams.get("type") || "online";
                  const targetUrl = `/purchase-form?type=${typeMode}`;
                  // Clear any edit state and force navigation
                  sessionStorage.removeItem("salesFormEditMode");
                  window.location.href = targetUrl;
                }}
              >
                Purchase
              </Button>
              <Button
                className={`h-6 text-xs px-3 ${!showOfflineEntries ? "bg-blue-600 text-white" : "bg-gray-300 text-black"}`}
                onClick={() => {
                  // Always navigate to new sales form
                  const urlParams = new URLSearchParams(window.location.search);
                  const typeMode = urlParams.get("type") || "online";
                  const targetUrl = `/sales-form?type=${typeMode}`;
                  // Clear any edit state and force navigation
                  sessionStorage.removeItem("salesFormEditMode");
                  window.location.href = targetUrl;
                }}
              >
                Sales
              </Button>
              <Button
                className={`h-6 text-xs px-3 ${showOfflineEntries ? "bg-blue-600 text-white" : "bg-gray-300 text-black"}`}
                onClick={() => setShowOfflineEntries(!showOfflineEntries)}
              >
                Offline
              </Button>
            </div>

            {/* ===== SALES DETAILS DATA ENTRY SECTION ===== */}
            <div className="bg-blue-50 p-2 rounded border">
              {showOfflineEntries ? (
                /* ===== OFFLINE ENTRIES TABLE DISPLAY ===== */
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-semibold mb-2 text-black">
                    Sale Offline Entries
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            Slip No
                          </th>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            Slip Date
                          </th>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            Entry Type
                          </th>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            First Weight
                          </th>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            Second Weight
                          </th>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            Vehicle No
                          </th>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            Company Name
                          </th>
                          <th className="px-4 py-2 text-left border border-black text-black">
                            Manual Trans #
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords && filteredRecords.length > 0 ? (
                          filteredRecords.map((record: any, index: number) => (
                            <tr
                              key={record.wb_id || index}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-2 border border-black text-black">
                                <button
                                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                                  onClick={() => {
                                    console.log(
                                      "Clicked offline record:",
                                      record,
                                    );
                                    if (record.wb_id) {
                                      // Check if this is an offline entry
                                      const isOfflineEntry =
                                        record.offline_entry === "Yes";

                                      // Determine the correct mode parameter
                                      const modeParam = isOfflineEntry
                                        ? "offline"
                                        : "online";

                                      if (record.entry_type === "PURCHASE") {
                                        // Navigate to purchase form
                                        const targetUrl = `/purchase-form?form=purchase&type=${modeParam}&edit=${record.wb_id}`;
                                        console.log(
                                          "Navigating to purchase form:",
                                          targetUrl,
                                        );
                                        window.location.href = targetUrl;
                                      } else if (
                                        record.entry_type === "PURCHASE_RETURN"
                                      ) {
                                        const targetUrl = `/purchase-return?type=${modeParam}&edit=${record.wb_id}`;
                                        console.log(
                                          "Navigating to purchase return form:",
                                          targetUrl,
                                        );
                                        window.location.href = targetUrl;
                                      } else if (
                                        record.entry_type === "SALE_RETURN"
                                      ) {
                                        const targetUrl = `/sales-return?type=${modeParam}&edit=${record.wb_id}`;
                                        console.log(
                                          "Navigating to sales return form:",
                                          targetUrl,
                                        );
                                        window.location.href = targetUrl;
                                      } else {
                                        // For SALE entries, stay on current page and load the data
                                        loadDataByWbId(record.wb_id);

                                        // Update URL to show edit mode with correct type
                                        const newUrl = `/sales-form?type=${modeParam}&edit=${record.wb_id}`;
                                        window.history.replaceState(
                                          {},
                                          "",
                                          newUrl,
                                        );

                                        // Close offline entries view
                                        setShowOfflineEntries(false);
                                      }
                                    }
                                  }}
                                >
                                  {record.slip_no || "---"}
                                </button>
                              </td>
                              <td className="px-4 py-2 border border-black text-black">
                                {record.slip_in_time
                                  ? new Date(
                                      record.slip_in_time,
                                    ).toLocaleDateString()
                                  : "---"}
                              </td>
                              <td className="px-4 py-2 border border-black text-black">
                                {record.entry_type || "SALE"}
                              </td>
                              <td className="px-4 py-2 border border-black text-black">
                                ---
                              </td>
                              <td className="px-4 py-2 border border-black text-black">
                                ---
                              </td>
                              <td className="px-4 py-2 border border-black text-black">
                                {record.vehicle_no || "---"}
                              </td>
                              <td className="px-4 py-2 border border-black text-black">
                                {record.vendor_name || "---"}
                              </td>
                              <td className="px-4 py-2 border border-black text-black">
                                ---
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-8 text-center text-gray-500 border border-black"
                            >
                              No offline entries found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* ===== REGULAR SALES FORM - DATA ENTRY TABLE ===== */
                <div className="h-full flex flex-col">
                  {/* ===== SALES TABLE HEADER - WITH DELETE ACTION COLUMN ===== */}
                  <div
                    className="grid gap-px bg-gray-300 text-xs font-semibold mb-1"
                    style={{
                      gridTemplateColumns:
                        "100px 100px 200px 120px 120px 150px 100px 100px 100px 40px",
                      width: "1120px",
                    }}
                  >
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      DC #
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      DO #
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      Customer Name
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      Vehicle No
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      Do Date
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      Item Description
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      DC Qty
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      DO Qty
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      Branch
                    </div>
                    <div className="bg-blue-100 p-1 text-center border border-gray-400 text-black">
                      ✖
                    </div>
                  </div>

                  {/* Sales Table Body - Fixed height with 8 rows */}
                  <div className="bg-gray-200 mb-4" style={{ height: "240px" }}>
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        className="grid gap-px text-xs"
                        style={{
                          gridTemplateColumns:
                            "100px 100px 200px 120px 120px 150px 100px 100px 100px 40px",
                          width: "1120px",
                        }}
                      >
                        <div className="bg-white border border-gray-300 p-1">
                          <input
                            type="text"
                            className={`w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none ${isEditMode ? "bg-gray-100" : ""}`}
                            value={salesData[index]?.dcNo || ""}
                            onChange={(e) =>
                              handleSalesDataChange(
                                index,
                                "dcNo",
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !isEditMode) {
                                const dcNo = salesData[index]?.dcNo;
                                if (dcNo && dcNo.trim() !== "") {
                                  fetchDcData(dcNo.trim(), index);
                                }
                              }
                            }}
                            placeholder={
                              isEditMode ? "" : "Press Enter to fetch"
                            }
                            readOnly={isEditMode}
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
                              handleSalesDataChange(
                                index,
                                "doNo",
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
                          {!onlineMode && salesData[index]?.dcNo ? (
                            <Select
                              value={salesData[index]?.customerName || ""}
                              onValueChange={(value) => {
                                handleSalesDataChange(
                                  index,
                                  "customerName",
                                  value,
                                );
                                setCustomerSearchQuery("");
                              }}
                              onOpenChange={(open) => {
                                if (!open) setCustomerSearchQuery("");
                              }}
                            >
                              <SelectTrigger className="w-full h-6 text-xs border-none bg-transparent focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Search Box at top */}
                                <div className="px-2 py-1 sticky top-0 bg-white z-10">
                                  <input
                                    type="text"
                                    placeholder="Search customers..."
                                    value={customerSearchQuery}
                                    onChange={(e) =>
                                      setCustomerSearchQuery(e.target.value)
                                    }
                                    className="h-6 w-full text-xs border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                  />
                                </div>

                                {/* Filtered Customers */}
                                {customers && customers.length > 0 ? (
                                  customers
                                    .filter((customer) =>
                                      customer.name
                                        .toLowerCase()
                                        .includes(
                                          customerSearchQuery.toLowerCase(),
                                        ),
                                    )
                                    .map((customer) => (
                                      <SelectItem
                                        key={customer.id}
                                        value={customer.name}
                                        className="text-xs"
                                      >
                                        {customer.name}
                                      </SelectItem>
                                    ))
                                ) : (
                                  <SelectItem value="no-customers" disabled>
                                    No customers found
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
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
                          )}
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
                          {!onlineMode && salesData[index]?.dcNo ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="w-full h-6 text-xs text-left px-2 border-none bg-transparent focus:outline-none flex items-center justify-between text-black">
                                  <span className="text-black">
                                    {salesData[index]?.doDate
                                      ? format(
                                          new Date(salesData[index].doDate),
                                          "dd.MM.yyyy",
                                        )
                                      : "Select date"}
                                  </span>
                                  <CalendarIcon className="h-3 w-3 text-black" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0 bg-white border border-black"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={
                                    salesData[index]?.doDate
                                      ? new Date(salesData[index].doDate)
                                      : undefined
                                  }
                                  onSelect={(date) => {
                                    if (date) {
                                      handleSalesDataChange(
                                        index,
                                        "doDate",
                                        format(date, "yyyy-MM-dd"),
                                      );
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <input
                              type="text"
                              className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                              value={
                                salesData[index]?.doDate
                                  ? new Date(
                                      salesData[index].doDate,
                                    ).toLocaleDateString("en-GB")
                                  : ""
                              }
                              readOnly
                              placeholder=""
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              data-form-type="other"
                            />
                          )}
                        </div>
                        <div className="bg-white border border-gray-300 p-1">
                          {!onlineMode && salesData[index]?.dcNo ? (
                            <Select
                              value={salesData[index]?.itemDescription || ""}
                              onValueChange={(value) => {
                                handleSalesDataChange(
                                  index,
                                  "itemDescription",
                                  value,
                                );
                                setItemSearchQuery("");
                              }}
                              onOpenChange={(open) => {
                                if (!open) setItemSearchQuery("");
                              }}
                            >
                              <SelectTrigger className="w-full h-6 text-xs border-none bg-transparent focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder="Select item" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Enhanced Search Box - search by both code and name */}
                                <div className="px-2 py-1 sticky top-0 bg-white z-10">
                                  <input
                                    type="text"
                                    placeholder="Search by item code or name..."
                                    value={itemSearchQuery}
                                    onChange={(e) =>
                                      setItemSearchQuery(e.target.value)
                                    }
                                    className="h-6 w-full text-xs border border-gray-300 px-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck="false"
                                  />
                                </div>

                                {/* Enhanced Filtered Items - search by both code and description */}
                                {items && items.length > 0 ? (
                                  items
                                    .filter((item) => {
                                      const searchTerm =
                                        itemSearchQuery.toLowerCase();
                                      const itemCode = (
                                        item.code || ""
                                      ).toLowerCase();
                                      const itemDesc = (
                                        item.description || ""
                                      ).toLowerCase();
                                      return (
                                        itemCode.includes(searchTerm) ||
                                        itemDesc.includes(searchTerm)
                                      );
                                    })
                                    .map((item) => (
                                      <SelectItem
                                        key={item.id}
                                        value={item.description}
                                        className="text-xs"
                                      >
                                        <div className="flex justify-between w-full">
                                          <span>{item.code}</span>
                                          <span>{item.description}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                ) : (
                                  <SelectItem value="no-items" disabled>
                                    No items found
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          ) : (
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
                          )}
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
                            value={salesData[index]?.branch || ""}
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
                        "100px 100px 200px 120px 120px 150px 100px 100px 100px 60px",
                      width: "1140px",
                      height: "40px",
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
                    <div className="bg-gray-200 border border-gray-400 p-1"></div>
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

                  {/* Bottom section with Weight Per Bags, Total Weight Out, and Total Feed Bags - matching image layout */}
                  <div
                    className="bg-gray-100 p-2 flex justify-between items-center border border-gray-300 mt-2"
                    style={{ width: "1160px" }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-medium text-black">
                          Weight Per Bags:
                        </label>
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
                        <label className="text-xs font-medium text-black">
                          Total Weight Out:
                        </label>
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
                        <label className="text-xs font-medium text-black">
                          Total Feed Bags:
                        </label>
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
                      <label className="text-sm font-medium text-black">
                        Total Weight Dill:
                      </label>
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
                      <label className="text-sm font-medium text-black">
                        Total Feed Bags:
                      </label>
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