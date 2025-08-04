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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WeightIndicator from "@/components/weight-indicator";
import WeightDisplayTable from "@/components/weight-display-table";
import VideoStreamFullscreen from "@/components/video-stream-fullscreen";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

function PurchaseForm() {
  const [location, setLocation] = useLocation();
  const [type, setType] = useState("");
  const { user } = useAuth();
  const [searchSlipNo, setSearchSlipNo] = useState("");
  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const [activeTab, setActiveTab] = useState("purchase");
  const [selectedForm, setSelectedForm] = useState<
    "purchase" | "sales" | "offline"
  >("purchase"); // Controls which form section is shown
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bardanaSearchQuery, setBardanaSearchQuery] = useState("");
  const [bardanaSelectOpen, setBardanaSelectOpen] = useState(false);

  // Deduction/Bag table state
  const [bagTableData, setBagTableData] = useState<any[]>([]);
  const [percentageMode, setPercentageMode] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    const currentType = searchParams.get("type");
    const returnParam = searchParams.get("return");
    console.log("Type param changed:", currentType);
    console.log("Return param:", returnParam);
    setType(currentType ?? "");
    setIsReturnMode(returnParam === "true");
  }, [location]); // 👈 Every time URL changes

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const formType = params.get("form");

    if (formType === "sales") {
      setSelectedForm("sales");
    } else if (formType === "purchase") {
      setSelectedForm("purchase");
    } else if (formType === "offline") {
      setSelectedForm("offline");
    }
  }, [location]);

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
  const [nextBagId, setNextBagId] = useState(1);

  // Vendor data state for offline mode
  const [vendorData, setVendorData] = useState<any[]>([]);
  const [vendorsData, setVendorsData] = useState<any[]>([]);

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

  // ===== HIGHLY OPTIMIZED DATA FETCHING - MAXIMUM PERFORMANCE =====
  // Fetch first weight records with aggressive caching for performance
  const { data: firstWeightRecords = [] } = useQuery({
    queryKey: ["/api/purchase/first-weight-records"],
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false, // Don't refetch on network reconnect
  });

  // Fetch offline records with aggressive caching
  const { data: offlineRecords = [] } = useQuery({
    queryKey: ["/api/purchases/offline"],
    staleTime: 10 * 60 * 1000, // 10 minutes cache  
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Filter records based on search criteria and form type
  const filteredRecords = (() => {
    let records = [];

    if (selectedForm === "offline") {
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
          bardanaType: details.bardana_type || details.baradana_type || "",
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
          entryType: master.entry_type || "PURCHASE",
          branch: master.branch_id ? String(master.branch_id) : "",
          branchId: master.branch_id ? String(master.branch_id) : "",

          // 🔧 Add these missing fields
          qualityDeduction: details.quality_deduction
            ? String(details.quality_deduction)
            : "",
          weight: bagTableData[0]?.weight ? String(bagTableData[0].weight) : "",
          bags: bagTableData[0]?.bags ? String(bagTableData[0].bags) : "",
          supplierWeight: details.supplier_weight
            ? String(details.supplier_weight)
            : "",
        }));

        // Load existing deduction data for this record
        if (master.wb_id) {
          loadDeductionData(master.wb_id);
        }

        // Set online/offline status based on database values
        if (master.offline_entry === "Yes") {
          setOnlineMode(false);
        } else if (master.online_entry === "Yes") {
          setOnlineMode(true);
        }

        // Load sales data if this is a SALE entry type
        if (
          master.entry_type === "SALE" &&
          data.details &&
          data.details.length > 0
        ) {
          const salesRows = data.details.map((detail: any, index: number) => {
            // Find branch name from branches array using master's branch_id
            const branchName =
              branches.find((b) => b.branch_id === master.branch_id)
                ?.branch_name || "";

            return {
              doId: String(index + 1),
              dcNo: detail.igp_no || detail.manual_dc_no || "", // DC No maps to igp_no
              doNo: detail.po_no || detail.do_no || "", // DO No maps to po_no
              customerName: detail.vendor_name || detail.customer_name || "",
              vehicleNo: detail.vehicle_no || "",
              doDate: detail.igp_date || detail.do_date || "",
              itemDescription: detail.item_desc || "",
              dcQty: detail.igp_qty
                ? String(detail.igp_qty)
                : detail.dc_qty
                  ? String(detail.dc_qty)
                  : "",
              doQty: detail.po_qty
                ? String(detail.po_qty)
                : detail.do_qty
                  ? String(detail.do_qty)
                  : "",
              branch: branchName,
              // Hidden / internal fields
              dcId: detail.dc_id || "",
              customerId: detail.customer_id || "",
              itemId: detail.item_id || "",
              itemCode: detail.item_code || "",
            };
          });

          // Ensure 8 rows
          while (salesRows.length < 8) {
            salesRows.push({
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

          setSalesData(salesRows);
          console.log("✅ Sales data loaded in edit mode:", salesRows);
        } else {
          // Set IGP items after form data is loaded - use saved detail fields for purchase entries
          setTimeout(() => {
            if (details.po_no || details.item_code || details.item_desc) {
              setIgpItems([
                {
                  po_no: details.po_no || "",
                  item_code: details.item_code || "",
                  item_desc: details.item_desc || "Saved record data",
                  po_qty: details.po_qty || "",
                  igp_qty: details.igp_qty || "",
                  balance_qty: details.balance_qty || "",
                },
              ]);
              console.log(
                "IGP items set from saved detail fields in wb_id loading",
              );
            }
          }, 100);
        }

        // Don't auto-fetch IGP data in edit mode - use saved table data
      }
    } catch (error) {
      console.error("Error loading data by wb_id:", error);
      alert("Failed to load record data");
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

      // Search with entry type filtering to only find purchase-related entries
      const response = await fetch(
        `/api/purchase/by-slip/${formData.slipNo.trim()}?entry_type=PURCHASE`,
      );

      if (!response.ok) {
        alert(`No PURCHASE record found for slip number ${formData.slipNo}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data && data.master) {
        const master = data.master;
        const entryType = master.entry_type;
        const isOffline = master.offline_entry === "Yes";

        console.log(
          "Found record - Entry Type:",
          entryType,
          "Offline:",
          isOffline,
        );

        // Check if this is a purchase-related entry that can be edited in purchase form
        if (entryType === "PURCHASE" || entryType === "PURCHASE_RETURN") {
          // Update online/offline status based on the found record
          setOnlineMode(!isOffline);

          // Determine the correct URL based on entry type and online/offline status
          const modeParam = isOffline ? "offline" : "online";

          if (entryType === "PURCHASE_RETURN") {
            const targetUrl = `/purchase-return?type=${modeParam}&edit=${master.wb_id}`;
            console.log(
              `Found ${entryType} entry (${isOffline ? "Offline" : "Online"}), redirecting to:`,
              targetUrl,
            );
            setLocation(targetUrl);
          } else {
            // For PURCHASE entries, stay on current page and load the data
            await loadDataByWbId(master.wb_id);

            // Update URL to show edit mode with correct type
            const newUrl = `/purchase-form?type=${modeParam}&edit=${master.wb_id}`;
            window.history.replaceState({}, "", newUrl);

            // Exit search mode
            setIsSearchMode(false);
            setLoading(false);
            return;
          }
        } else {
          alert(
            `Found ${entryType} entry for slip ${formData.slipNo}, but this is the Purchase form. Please use the appropriate form for ${entryType} entries.`,
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

  // Function to load data by slip number for editing (kept for backward compatibility)
  const loadDataBySlipNo = async (slipNo: string) => {
    try {
      console.log(
        "Loading slip:",
        slipNo,
        "with entry type:",
        formData.entryType,
      );
      const response = await fetch(
        `/api/purchase/by-slip/${slipNo}?entry_type=${formData.entryType}`,
      );

      const data = await response.json();
      if (data && data.master) {
        const master = data.master;
        const details =
          data.details && data.details.length > 0 ? data.details[0] : {};

        // Enable edit mode
        setIsEditMode(true);
        setEditingWbId(master.wb_id);

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
          bardanaType: details.bardana_type || details.baradana_type || "",
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
          entryType: master.entry_type || "PURCHASE",
        }));

        // Load existing deduction data for this record
        if (master.wb_id) {
          loadDeductionData(master.wb_id);
        }

        // Set online/offline status based on database values
        if (master.offline_entry === "Yes") {
          setOnlineMode(false);
        } else if (master.online_entry === "Yes") {
          setOnlineMode(true);
        }

        // Set IGP items after form data is loaded - use saved detail fields
        setTimeout(() => {
          if (details.po_no || details.item_code || details.item_desc) {
            setIgpItems([
              {
                po_no: details.po_no || "",
                item_code: details.item_code || "",
                item_desc: details.item_desc || "Saved record data",
                po_qty: details.po_qty || "",
                igp_qty: details.igp_qty || "",
                balance_qty: details.balance_qty || "",
              },
            ]);
            console.log(
              "IGP items set from saved detail fields in slip loading",
            );
          }
        }, 100);

        // Don't auto-fetch IGP data in edit mode - use saved table data
      }
    } catch (error) {
      console.error("Error loading data by slip number:", error);
      alert("Failed to load record data");
    }
  };

  // Function to cancel edit mode and return to new entry mode
  const cancelEdit = () => {
    setIsEditMode(false);
    setEditingWbId(null);
    setFormData(initialFormData);
  };

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
  <html>
  <head>
    <title>Weighbridge Slip - ${formData.slipNo}</title>
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
          <div class="copy-label">Head Office Copy</div>
          <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
        </div>
        <div class="company-name">Shahzor  Feed  Mill</div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGH  BRIDGE  SLIP</div>

        <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${formData.igpNo || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div style="margin-top: 10px;">W.B # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipNo || ""}</div>
            <div style="margin-top: 10px;">Truck # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.vehicleNo || ""}</div>
            <div style="margin-top: 10px;">Freight Payment &nbsp;&nbsp;&nbsp;&nbsp; ${formData.freight || ""}</div>
          </div>
          <div class="right-section">
            <div>Party: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>${formData.vendor || ""}</b></div>
            <div style="margin-top: 10px;">Time IN: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipInTime ? new Date(formData.slipInTime).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).toUpperCase().replace(/,/, "") : ""}</div>
            <div style="margin-top: 10px;">Time OUT: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipOutTime ? new Date(formData.slipOutTime).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).toUpperCase().replace(/,/, "") : ""}</div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">COMMODITY</span><span class="value">${formData.itemDesc || ""}</span></div>
              <div><span class="label">QUANTITY</span><span class="value">${formData.noOfBags || ""}</span></div>
              <div><span class="label">BAG CONDITION</span><span class="value">${formData.bagCondition || ""}</span></div>
              <div><span class="label">BAG TYPE</span><span class="value">${formData.bardanaType || ""}</span></div>
              <div><span class="label">AVG. WEIGHT</span><span class="value">${formData.wtPerBag || ""}</span></div>
              <div><span class="label">REMARKS</span><span class="value">${formData.remarks || ""}</span></div>
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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
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
        <hr style="border: 1px solid #000; margin: 20px 0;" />

         <!-- Feed Mill Copy -->
          <div class="slip">
            <div class="slip-header">
              <div class="header-left">Feed Mill Copy</div>
              <div class="header-center">
               <div class="company-name">Shahzor  Feed  Mill</div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGH  BRIDGE  SLIP</div>
              </div>
              <div class="header-right"></div>
            </div>
         <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${formData.igpNo || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div style="margin-top: 10px;">W.B # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipNo || ""}</div>
            <div style="margin-top: 10px;">Truck # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.vehicleNo || ""}</div>
            <div style="margin-top: 10px;">Freight Payment &nbsp;&nbsp;&nbsp;&nbsp; ${formData.freight || ""}</div>
          </div>
          <div class="right-section">
            <div>Party: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>${formData.vendor || ""}</b></div>
            <div style="margin-top: 10px;">Time IN: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipInTime ? new Date(formData.slipInTime).toLocaleStringAnalyzing the code, the provided changes are focused on refining the Ctrl+L keyboard event handler for opening LOVs (List of Values) in the PurchaseForm component. The original handler had some issues with prioritizing the correct LOV to open, particularly in offline mode and within details tables. The updated handler aims to simplify and improve this logic by directly targeting the focused element or its parent combobox.

```
("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).toUpperCase().replace(/,/, "") : ""}</div>
            <div style="margin-top: 10px;">Time OUT: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipOutTime ? new Date(formData.slipOutTime).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).toUpperCase().replace(/,/, "") : ""}</div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">COMMODITY</span><span class="value">${formData.itemDesc || ""}</span></div>
              <div><span class="label">QUANTITY</span><span class="value">${formData.noOfBags || ""}</span></div>
              <div><span class="label">BAG CONDITION</span><span class="value">${formData.bagCondition || ""}</span></div>
              <div><span class="label">BAG TYPE</span><span class="value">${formData.bardanaType || ""}</span></div>
              <div><span class="label">AVG. WEIGHT</span><span class="value">${formData.wtPerBag || ""}</span></div>
              <div><span class="label">REMARKS</span><span class="value">${formData.remarks || ""}</span></div>
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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
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
        <hr style="border: 1px solid #000; margin: 20px 0;" />
  <!-- Customer Copy -->
          <div class="slip">
            <div class="slip-header">
              <div class="header-left">Customer Copy</div>
              <div class="header-center">
               <div class="company-name">Shahzor  Feed  Mill</div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGH  BRIDGE  SLIP</div>
              </div>
            <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${formData.igpNo || ""}</span></div>

        <div class="two-column">
  <div class="left-section" style="display: flex; align-items: center; height: 10px;">
    <div style="font-weight: normal;">
      W.B # ${formData.slipNo || ""}
    </div>
  </div>


          <div class="right-section">
            <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>

          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div>Party: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>${formData.vendor || ""}</b></div>
              <div><span class="label">COMMODITY</span><span class="value">${formData.itemDesc || ""}</span></div>
           <div style="margin-top: 10px;">Truck # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.vehicleNo || ""}</div>
            <div style="margin-top: 10px;">Freight Payment &nbsp;&nbsp;&nbsp;&nbsp; ${formData.freight || ""}</div>
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
             <div><span class="label">QUANTITY</span><span class="value">${formData.noOfBags || ""}</span></div>
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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
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

      </div> <!-- .slip-section ends -->
    </div> <!-- .page-container ends -->
  </body>
  </html>
`;
  };

  // Navigation functions
  const navigateToFirst = async () => {
    try {
      const response = await fetch("/api/purchase/first-weight-records");
      const records = await response.json();
      if (records.length > 0) {
        const firstRecord = records[records.length - 1]; // Get oldest record
        await loadDataByWbId(firstRecord.wb_id);
      }
    } catch (error) {
      console.error("Error navigating to first record:", error);
    }
  };

  const navigateToPrev = async () => {
    const currentSlip = parseInt(formData.slipNo);
    if (currentSlip > 1) {
      const prevSlip = currentSlip - 1;
      try {
        const response = await fetch(`/api/purchase/by-slip/${prevSlip}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.master) {
            await loadDataByWbId(data.master.wb_id);
          }
        } else {
          alert(`No record found for slip number ${prevSlip}`);
        }
      } catch (error) {
        console.error("Error navigating to previous record:", error);
      }
    }
  };

  const navigateToNext = async () => {
    const currentSlip = parseInt(formData.slipNo);
    const nextSlip = currentSlip + 1;
    try {
      const response = await fetch(`/api/purchase/by-slip/${nextSlip}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.master) {
          await loadDataByWbId(data.master.wb_id);
        }
      } else {
        // If no next record exists, create new entry with next slip number
        resetFormToInitial();
        setFormData((prev) => ({ ...prev, slipNo: nextSlip.toString() }));
      }
    } catch (error) {
      console.error("Error navigating to next record:", error);
    }
  };

  const navigateToLast = async () => {
    try {
      const response = await fetch("/api/purchase/first-weight-records");
      const records = await response.json();
      if (records.length > 0) {
        const lastRecord = records[0]; // Get newest record
        await loadDataByWbId(lastRecord.wb_id);
      }
    } catch (error) {
      console.error("Error navigating to last record:", error);
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
    entryType: "PURCHASE",
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
    vendorId: "",
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
    console.log("Full URL:", window.location.href);

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
  const [igpItems, setIgpItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [entryTypes, setEntryTypes] = useState<any[]>([]);
  const [invItems, setInvItems] = useState<any[]>([]);
  const [bardanaTypes, setBardanaTypes] = useState<any[]>([]);
  const [percentageData, setPercentageData] = useState<any[]>([]);

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

  // Auto-calculate Balance Quantity for offline mode
  useEffect(() => {
    if (!onlineMode) {
      const poQty = parseFloat(formData.poQty) || 0;
      const igpQty = parseFloat(formData.igpQty) || 0;
      const balanceQty = poQty - igpQty;

      setFormData((prev) => ({
        ...prev,
        balanceQty: balanceQty >= 0 ? balanceQty.toFixed(2) : "0.00",
      }));
    }
  }, [formData.poQty, formData.igpQty, onlineMode]);

  // Remove auto-fetch IGP data in edit mode - use saved table data only

  // State to track if IGP data has been fetched
  const [igpDataFetched, setIgpDataFetched] = useState(false);

  // IGP Data Fetching Function
  const fetchIgpData = async () => {
    // Don't fetch IGP data in edit mode for offline entries that were switched to online
    if (isEditMode) {
      console.log("Skipping IGP fetch in edit mode");
      return;
    }

    if (!formData.igpNo) {
      alert("Please enter IGP No");
      return;
    }
    try {
      const response = await fetch(
        `http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/live_data?igp_no=${formData.igpNo}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.items && data.items.length > 0) {
        const items = data.items;
        const firstItem = items[0];
        setFormData((prev) => ({
          ...prev,
          driverName: firstItem.driver_name || "",
          vendor: firstItem.vendor_name || "",
          vehicleNo: firstItem.vehicle_no || "",
          noOfBags: firstItem.bardana_qty ? String(firstItem.bardana_qty) : "",
          bardanaType: firstItem.bardanatype || firstItem.bardana_type || "",
          wtPerBag: firstItem.wtperbag ? String(firstItem.wtperbag) : "",
          igpDate: firstItem.igp_date || "",
          igpId: firstItem.igp_id || "",
          itemId: firstItem.item_id || "",
          // Also update item details from IGP data
          itemCode: firstItem.item_code || "",
          itemDesc: firstItem.item_desc || "",
          poNo: firstItem.po_no || "",
          poQty: firstItem.po_qty ? String(firstItem.po_qty) : "",
          igpQty: firstItem.igp_qty ? String(firstItem.igp_qty) : "",
          balanceQty: firstItem.balance_qty ? String(firstItem.balance_qty) : "",
          // Change status from Online to Offline when IGP data loads
          onlineEntry: "No",
        }));
        setIgpItems(items);
        setIgpDataFetched(true); // Mark IGP data as fetched
        console.log("IGP data fetched successfully:", items);
      } else {
        alert("No data found for this IGP No.");
        setIgpItems([]);
      }
    } catch (error) {
      console.error("Error fetching IGP data:", error);
      alert(
        "Failed to fetch IGP data. Please check the IGP number and try again.",
      );
      setIgpItems([]);
    }
  };

  // DC Data Fetching Function for Sales
  const fetchDcData = async (dcNo: string) => {
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
        const items = data.items;

        // Update sales data with fetched DC data including hidden columns
        const updatedSalesData = items.map((item: any, index: number) => ({
          doId: `${index + 1}`, // Auto-generated ID
          dcNo: item.dc_no || "",
          doNo: item.delivery_order_no ? String(item.delivery_order_no) : "", // Map delivery order number to DO #
          customerName: item.customer_name || "",
          vehicleNo: item.vehicle_no || "",
          doDate: item.dc_date
            ? new Date(item.dc_date).toLocaleDateString()
            : "",
          itemDescription: item.item_desc || "",
          dcQty: item.dc_qty ? String(item.dc_qty) : "",
          doQty: item.del_qty ? String(item.del_qty) : "",
          branch: "", // Keep empty for now
          // Hidden columns for database storage
          dcId: item.dc_id || "",
          customerId: item.customer_id || "",
          itemId: item.item_id || "",
          itemCode: item.item_code || "",
        }));

        // Fill remaining rows with empty data if needed
        while (updatedSalesData.length < 8) {
          updatedSalesData.push({
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
          });
        }

        setSalesData(updatedSalesData);
        console.log(
          "DC data fetched and populated successfully:",
          updatedSalesData,
        );
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

  // Function to check if vehicle number already exists for today
  const checkVehicleNumberExists = async (
    vehicleNo: string,
    excludeWbId?: number,
  ) => {
    if (!vehicleNo || vehicleNo.trim() === "") return false;

    try {
      const today = new Date().toISOString().split("T")[0];
      let url = `/api/purchases/check-vehicle?vehicle_no=${encodeURIComponent(vehicleNo.trim())}&date=${today}`;

      if (excludeWbId) {
        url += `&exclude_wb_id=${excludeWbId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking vehicle number:", error);
      return false;
    }
  };

  // Function to check if vehicle number exists for IGP entries on the same date
  const checkIGPVehicleNumberExists = async (
    vehicleNo: string,
    igpNo: string,
    excludeWbId?: number,
  ) => {
    if (!vehicleNo || vehicleNo.trim() === "" || !igpNo || igpNo.trim() === "")
      return false;

    try {
      const today = new Date().toISOString().split("T")[0];
      let url = `/api/purchases/check-igp-vehicle?vehicle_no=${encodeURIComponent(vehicleNo.trim())}&igp_no=${encodeURIComponent(igpNo.trim())}&date=${today}`;

      if (excludeWbId) {
        url += `&exclude_wb_id=${excludeWbId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Error checking IGP vehicle number:", error);
      return false;
    }
  };

  // Function to reset form to clean state
  const resetFormToInitial = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeMode = urlParams.get("type");
    const isOfflineMode = typeMode === "offline";

    // Sync onlineMode state with URL parameter
    if (typeMode === "offline") {
      setOnlineMode(false);
    } else if (typeMode === "online") {
      setOnlineMode(true);
    }

    setFormData({
      ...initialFormData,
      slipInTime: new Date().toISOString().slice(0, 16),
      onlineEntry: isOfflineMode ? "No" : "Yes",
      offlineEntry: isOfflineMode ? "Yes" : "No",
      entryType: "PURCHASE",
      creationDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      slipDate: new Date().toISOString(),
    });
    setIgpItems([]);
    setIgpDataFetched(false); // Reset IGP data fetched state
    setIsEditMode(false);
    setEditingWbId(null);
  };

  // ===== CAMERA DATA SECTION - PERFORMANCE OPTIMIZED =====
  // Get camera data with performance optimization
  const { data: camera } = useQuery({
    queryKey: ["/api/cameras/1"],
    enabled: true,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return "";
    return isoString.slice(0, 16);
  };

  const formatISODate = (localString: string) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  // Function to handle Deduction+ button click - populate bag table with form data
  const handleDeduction = () => {
    const bags = parseInt(formData.bags) || 0; // Use formData.bags instead of formData.noOfBags
    const pb = parseFloat(formData.wtPerBag) || 0;
    const percentage = parseFloat(formData.qualityDed) || 0;
    const weightValue = parseFloat(formData.weight) || 0;
    const calculatedWeight = weightValue * bags; // Weight field value multiplied by Bags field value

    // Get percentage from weight field if percentage mode is enabled
    let percentageValue = percentage;
    if (formData.isPercentageMode && formData.weight) {
      // Extract percentage value from weight field (e.g., "0.50%" -> 0.50)
      const weightStr = formData.weight.toString();
      if (weightStr.includes("%")) {
        percentageValue = parseFloat(weightStr.replace("%", "")) || 0;
      } else {
        percentageValue = parseFloat(weightStr) || 0;
      }
    }

    if (bags > 0 && pb > 0) {
      const newBagEntry = {
        bagId: nextBagId,
        bags: bags,
        pb: pb,
        percentage: percentageValue, // Use the correct percentage value
        weight: calculatedWeight, // Use calculated weight
        total: bags * pb,
      };

      setBagTableData((prev) => [...prev, newBagEntry]);
      setNextBagId((prev) => prev + 1);
    } else {
      alert("Please enter valid values for Bags and Weight Per Bag");
    }
  };

  // Function to remove bag entry
  const removeBagEntry = (bagId: number) => {
    setBagTableData((prev) => prev.filter((item) => item.bagId !== bagId));
  };

  const updateBagEntry = (bagId: number, field: string, value: string) => {
    setBagTableData((prev) =>
      prev.map((item) =>
        item.bagId === bagId
          ? {
              ...item,
              [field]: field === "weight" ? value : parseFloat(value) || 0,
            }
          : item,
      ),
    );
  };

  // Function to handle Insert button - save bag data to database
  const handleInsertBagData = async () => {
    if (bagTableData.length === 0) {
      alert("No bag data to insert");
      return;
    }

    const wbId = formData.wbId || editingWbId;
    if (!wbId) {
      alert("Please save the main form first to get WB ID");
      return;
    }

    const wbIdNumber = typeof wbId === "string" ? parseInt(wbId) : wbId;

    try {
      setLoading(true);
      const response = await fetch("/api/deduction/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wbId: wbIdNumber,
          bagTableData: bagTableData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert("Deduction data saved successfully!");
      console.log("Deduction data saved:", data);
      setBagTableData([]); // Clear the table after successful insert
      setNextBagId(1); // Reset bag ID counter
    } catch (error) {
      console.error("Error saving deduction data:", error);
      alert("Failed to save deduction data");
    } finally {
      setLoading(false);
    }
  };

  // Function to format numbers with commas (Pakistani style)
  const formatWithCommas = (value: string) => {
    // Remove all non-digit characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Split into integer and decimal parts
    const parts = cleanValue.split(".");
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Add commas to integer part (Pakistani style: 12,34,567)
    if (integerPart.length > 3) {
      // First, handle the rightmost 3 digits
      const rightPart = integerPart.slice(-3);
      let leftPart = integerPart.slice(0, -3);

      // Add commas every 2 digits from right to left for the remaining part
      const leftPartFormatted = leftPart.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

      integerPart = leftPartFormatted + "," + rightPart;
    }

    // Combine integer and decimal parts
    return decimalPart !== undefined
      ? integerPart + "." + decimalPart
      : integerPart;
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Prevent editing IGP-fetched fields in online mode when IGP data has been fetched
    // Note: bardanaType is now editable as per requirement
    if (onlineMode && igpDataFetched && !isEditMode) {
      const igpFetchedFields = [
        "driverName",
        "vendor", 
        "vehicleNo",
        "noOfBags",
        "wtPerBag",
        "igpDate",
      ];
      if (igpFetchedFields.includes(name)) {
        alert("This field cannot be edited after IGP data has been fetched.");
        return;
      }
    }

    // Vehicle number validation removed - allow duplicate vehicle numbers on same day

    const numericFields = [
      "firstWeight",
      "secondWeight",
      "netWeight",
      "bardanaWeight",
      "grossWeight",
      "companyId",
      "branchId",
      "createdBy",
      "lastUpdatedBy",
      "wtPerBag",
      "noOfBags",
    ];

    if (numericFields.includes(name)) {
      // Special handling for freight field to add comma formatting
      if (name === "freight") {
        const formattedValue = formatWithCommas(value);
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      } else if (value === "" || /^\d*\.?\d*$/.test(value)) {
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

    // Update state immediately
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
    // Wake up database first
    const wakeUpDatabase = async () => {
      try {
        await fetch("/api/db/wake");
      } catch (error) {
        console.error("Database wake-up failed:", error);
      }
    };

    const fetchEntryTypes = async () => {
      try {
        const response = await fetch("/api/entry-types");
        if (response.ok) {
          const entryTypeData = await response.json();
          setEntryTypes(Array.isArray(entryTypeData) ? entryTypeData : []);
        }
      } catch (error) {
        console.error("Error fetching entry types:", error);
        setEntryTypes([]);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await fetch("/api/branches");
        if (response.ok) {
          const branchData = await response.json();
          setBranches(Array.isArray(branchData) ? branchData : []);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setBranches([]);
      }
    };

    const fetchInvItems = async () => {
      try {
        const response = await fetch("/api/inv-items");
        if (response.ok) {
          const itemsData = await response.json();
          setInvItems(Array.isArray(itemsData) ? itemsData : []);
        }
      } catch (error) {
        console.error("Error fetching inv items:", error);
        setInvItems([]);
      }
    };

    const fetchBardanaTypes = async () => {
      try {
        const response = await fetch("/api/bardana-types");
        if (response.ok) {
          const bardanaData = await response.json();
          setBardanaTypes(Array.isArray(bardanaData) ? bardanaData : []);
        }
      } catch (error) {
        console.error("Error fetching bardana types:", error);
        setBardanaTypes([]);
      }
    };

    const fetchPercentageData = async () => {
      try {
        const response = await fetch("/api/percentage-data");
        if (response.ok) {
          const percentageData = await response.json();
          setPercentageData(
            Array.isArray(percentageData) ? percentageData : [],
          );
        }
      } catch (error) {
        console.error("Error fetching percentage data:", error);
        setPercentageData([]);
      }
    };

    wakeUpDatabase().then(() => {
      fetchEntryTypes();
      fetchBranches();
      fetchInvItems();
      fetchBardanaTypes();
      fetchPercentageData();
    });
  }, []);

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

  // Handle URL parameters for edit mode and form type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get("edit");
    const searchMode = urlParams.get("search");
    const formType = urlParams.get("form") || "purchase"; // Default to 'purchase' if null
    const typeMode = urlParams.get("type");
    const offlineEditSlip = urlParams.get("offline_edit");

    console.log("URL parameters:", {
      editWbId,
      searchMode,
      formType,
      typeMode,
      offlineEditSlip,
    });

    // Check if this is a page reload by checking if we have edit mode in sessionStorage
    const wasInEditMode =
      sessionStorage.getItem("purchaseFormEditMode") === "true";

    // Clear any previous edit mode state from sessionStorage on every page load
    sessionStorage.removeItem("purchaseFormEditMode");

    // Set selected form robustly
    if (["sales", "purchase", "offline"].includes(formType)) {
      setSelectedForm(formType as "sales" | "purchase" | "offline");
    }

    // Online/offline mode
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

    // If we were in edit mode and page was reloaded, clear edit parameter and reset to new form
    if (wasInEditMode && editWbId) {
      console.log(
        "Page reload detected while in edit mode, clearing edit parameter and resetting to new form",
      );
      // Clear edit parameter from URL
      urlParams.delete("edit");
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Reset to new form
      setIsEditMode(false);
      setEditingWbId(null);
      setTimeout(() => {
        resetFormToInitial();
      }, 100);
      return;
    }

    // Check if we should be in edit mode ONLY based on URL parameter (fresh navigation)
    if (editWbId && !wasInEditMode) {
      // Load record for editing by wb_id
      console.log("Edit mode detected from URL parameter, loading data");
      sessionStorage.setItem("purchaseFormEditMode", "true");
      loadDataByWbId(parseInt(editWbId));
      return; // Exit early to prevent any other initialization
    } else if (offlineEditSlip && !wasInEditMode) {
      console.log(
        "Offline edit mode detected from URL parameter, loading data",
      );
      sessionStorage.setItem("purchaseFormEditMode", "true");
      loadDataBySlipNo(offlineEditSlip);
      setOnlineMode(false);
      return; // Exit early to prevent any other initialization
    } else {
      // No edit parameter in URL, always reset to new form
      console.log("No edit parameter in URL, resetting to new form");
      setIsEditMode(false);
      setEditingWbId(null);
      setTimeout(() => {
        resetFormToInitial();
      }, 100);
      setIsSearchMode(false);
      return;
    }
  }, [location]);

  // Handle page reload detection and edit mode management
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get("edit");

    // Set a flag when page loads to detect reloads
    const pageLoadTime = Date.now();
    const lastPageLoad = sessionStorage.getItem("purchaseFormPageLoad");
    const wasInEditMode =
      sessionStorage.getItem("purchaseFormEditMode") === "true";

    // Store current page load time
    sessionStorage.setItem("purchaseFormPageLoad", pageLoadTime.toString());

    // If we were in edit mode and this appears to be a page reload (edit param still in URL)
    if (wasInEditMode && editWbId) {
      const timeDiff = lastPageLoad ? pageLoadTime - parseInt(lastPageLoad) : 0;
      // If less than 5 seconds since last page load, likely a reload
      if (timeDiff < 5000) {
        console.log(
          "Page reload detected while in edit mode, clearing edit parameter and resetting to new form",
        );
        // Clear edit parameter from URL
        urlParams.delete("edit");
        const newUrl = urlParams.toString()
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);

        // Clear session storage and reset to new form
        sessionStorage.removeItem("purchaseFormEditMode");
        sessionStorage.removeItem("purchaseFormPageLoad");
        setIsEditMode(false);
        setEditingWbId(null);
        setTimeout(() => {
          resetFormToInitial();
        }, 100);
        return;
      }
    }

    // Check if user navigated to purchase form while in edit mode
    if (!editWbId && wasInEditMode) {
      console.log(
        "Navigation to purchase form detected while in edit mode, clearing edit state",
      );
      sessionStorage.removeItem("purchaseFormEditMode");
      sessionStorage.removeItem("purchaseFormPageLoad");
      setIsEditMode(false);
      setEditingWbId(null);
      resetFormToInitial();
    }
  }, []);

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

      console.log(
        "URL change detected - typeMode:",
        typeMode,
        "current onlineMode:",
        onlineMode,
      );

      if (typeMode === "offline" && onlineMode) {
        console.log("Switching to OFFLINE mode from URL");
        setOnlineMode(false);
      } else if (typeMode === "online" && !onlineMode) {
        console.log("Switching to ONLINE mode from URL");
        setOnlineMode(true);
      } else if (!typeMode && onlineMode === false) {
        // If no type parameter, default to online
        console.log("No type parameter, defaulting to ONLINE mode");
        setOnlineMode(true);
      }
    };

    // Check URL on component mount and location changes
    handleURLChange();
  }, [location]);

  // Force re-render when location changes to ensure state sync
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeMode = urlParams.get("type");

    if (typeMode === "offline") {
      setOnlineMode(false);
    } else if (typeMode === "online") {
      setOnlineMode(true);
    }
  }, [window.location.search]);

  useEffect(() => {
    // Don't fetch new slip number if we're in edit mode or editing a specific record
    if (isEditMode || editingWbId) {
      return;
    }

    // Check URL parameters for edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editWbId = urlParams.get("edit");
    if (editWbId) {
      return;
    }

    // Fetch next slip number based on return mode with enhanced retry logic
    const entryType = isReturnMode ? "PURCHASE_RETURN" : "PURCHASE";

    const fetchSlipNumber = async (retryCount = 0) => {
      try {
        // Always try to wake up database first
        if (retryCount === 0) {
          try {
            console.log("🔄 Waking up database...");
            const wakeResponse = await fetch("/api/db/wake");
            if (wakeResponse.ok) {
              const wakeData = await wakeResponse.json();
              console.log("✅ Database wake-up response:", wakeData);
              // Wait a moment for database to fully wake up
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          } catch (wakeError) {
            console.log(
              "❌ Database wake-up failed, continuing with slip fetch",
            );
          }
        }

        console.log(
          `🔍 Fetching next slip number for ${entryType} (attempt ${retryCount + 1})`,
        );
        const response = await fetch(
          `/api/purchases/next-slip?entry_type=${entryType}`,
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const nextSlip = data.nextSlipNo || "1";

        // Validate that we got a proper numeric slip number
        if (!/^\d+$/.test(nextSlip)) {
          throw new Error(`Invalid slip number format: ${nextSlip}`);
        }

        console.log(
          `✅ Successfully fetched next slip number: ${nextSlip} for ${entryType}`,
        );
        setFormData((prev) => ({ ...prev, slipNo: nextSlip }));
      } catch (err: any) {
        console.error(
          `❌ Error fetching slip number (attempt ${retryCount + 1}):`,
          err.message,
        );

        if (retryCount < 4) {
          // Increased retry attempts
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          setTimeout(() => fetchSlipNumber(retryCount + 1), waitTime);
        } else {
          // Use a more reasonable fallback - start from 1000 + current minute
          const reasonableFallback = (
            1000 + new Date().getMinutes()
          ).toString();
          console.log(
            `🚨 All retries failed, using reasonable fallback: ${reasonableFallback}`,
          );
          setFormData((prev) => ({ ...prev, slipNo: reasonableFallback }));

          // Show user notification
          alert(
            `⚠️ Could not connect to database. Using temporary slip number: ${reasonableFallback}\n\nPlease check your internet connection.`,
          );
        }
      }
    };

    fetchSlipNumber();

    // Fetch branches for dropdown
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data: any) => {
        const branchData = Array.isArray(data) ? data : [];
        setBranches(branchData);
        console.log("Branches fetched:", data);

        // Set default branch based on logged-in user's branch
        if (
          branchData.length > 0 &&
          (!formData.branchId || formData.branchId === "")
        ) {
          const userBranchId = user?.branchId;
          const defaultBranch = userBranchId
            ? branchData.find((b) => b.branch_id === userBranchId) ||
              branchData[0]
            : branchData[0];
          setFormData((prev) => ({
            ...prev,
            branchId: String(defaultBranch.branch_id),
            branch: String(defaultBranch.branch_id),
            createdBy: String(user?.userid || ""),
          }));
        }
      })
      .catch((err: any) => {
        console.error("Error fetching branches:", err);
        setBranches([]);
      });

    const now = new Date().toISOString();
    setFormData((prev) => ({
      ...prev,
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));
    // Don't force online mode - let URL parameter control the initial state
  }, [isReturnMode]);

  const resetForm = () => {
    // When Clear button is pressed, clear everything except Slip No
    const currentSlipNo = formData.slipNo;
    setFormData({
      ...initialFormData,
      slipNo: currentSlipNo,
    });
    setIgpItems([]);
    setIsEditMode(false);
    setEditingWbId(null);
    // Keep current online/offline mode
  };

  const captureFirstWeight = async () => {
    try {
      // Get current weight data
      const response = await fetch("/api/weight/data");
      const weightData = await response.json();

      // Update the firstWeight field with current weight reading
      setFormData((prev) => ({
        ...prev,
        firstWeight: weightData.weight,
      }));

      // Call camera snap manager to capture and read number plate
      try {
        console.log("Calling camera snap manager for number plate reading...");
        const snapResponse = await fetch("/api/cameras/snap-manager", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wbId: editingWbId || null,
          }),
        });

        const snapResult = await snapResponse.json();
        console.log("Camera snap manager response:", snapResult);

        if (snapResult.success && snapResult.plateNumber) {
          // Update vehicle number in form - ensure it's properly set
          const plateNumber = snapResult.plateNumber.trim();
          setFormData((prev) => ({
            ...prev,
            vehicleNo: plateNumber,
          }));

          console.log("Number plate captured and saved:", plateNumber);

          // Show success message with confidence if available
          let statusMessage = `Number plate detected: ${plateNumber}`;
          if (snapResult.confidence && snapResult.confidence > 0) {
            statusMessage += `\nConfidence: ${(snapResult.confidence * 100).toFixed(0)}%`;
          }
          if (snapResult.method) {
            statusMessage += `\nMethod: ${snapResult.method}`;
          }

          alert(statusMessage);

          // Force update the input field if needed
          setTimeout(() => {
            const vehicleInput = document.querySelector(
              'input[name="vehicleNo"]',
            ) as HTMLInputElement;
            if (vehicleInput) {
              vehicleInput.value = plateNumber;
              vehicleInput.dispatchEvent(new Event("input", { bubbles: true }));
            }
          }, 100);
        } else {
          console.log(
            "Plate detection failed:",
            snapResult.error || "No plate detected",
          );
          alert(
            `License plate detection failed!\n\nReason: ${snapResult.error || "No valid plate number found in camera view"}\n\nPlease ensure:\n- Vehicle is properly positioned\n- License plate is clearly visible\n- Camera has good lighting\n\nEnter the plate number manually if needed.`,
          );
        }
      } catch (cameraError) {
        console.error("Camera snap manager error:", cameraError);

        // Generate emergency plate number on frontend error
        const now = new Date();
        const emergencyPlate = `FE${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;

        setFormData((prev) => ({
          ...prev,
          vehicleNo: emergencyPlate,
        }));

        alert(
          `Camera system error. Using emergency plate: ${emergencyPlate}\nPlease verify and update if needed.`,
        );
      }
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

      // Automatically capture second weight image if slip number exists
      if (formData.slipNo) {
        try {
          console.log(
            "Capturing second weight image for slip:",
            formData.slipNo,
          );
          const captureResponse = await fetch("/api/capture/second-weight", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              slipNo: formData.slipNo,
              cameraIp: "10.10.10.146",
              cameraPort: 554,
            }),
          });

          if (captureResponse.ok) {
            const captureResult = await captureResponse.json();
            console.log(
              "Second weight image captured successfully:",
              captureResult,
            );
          } else {
            console.error("Failed to capture second weight image");
          }
        } catch (imageError) {
          console.error("Error capturing second weight image:", imageError);
        }
      }
    } catch (error) {
      console.error("Error fetching weight data:", error);
      alert("Failed to capture weight reading");
    }
  };

  // Calculate weights automatically
  const calculateWeights = () => {
    const firstWeight = parseFloat(formData.firstWeight) || 0;
    const secondWeight = parseFloat(formData.secondWeight) || 0;
    const bardanaWeight = parseFloat(formData.bardanaWeight) || 0;
    const supplierWeight = parseFloat(formData.supplierWeight) || 0;

    // Net Weight = First Weight - Second Weight
    const netWeight = firstWeight - secondWeight - bardanaWeight;

    // Gross Weight = First Weight - Second Weight - Bardana Weight
    const grossWeight = firstWeight - secondWeight;

    // Supplier Weight - Bardana
    const supplierWeightMinusBardana = supplierWeight - bardanaWeight;

    // Supplier Weight - Out Weight = Supplier Weight - Supp Wt - Bardana
    const suppWtMinusBardana =
      parseFloat(formData.supplierWeightMinusBardana) || 0;
    const supplierWeightMinusOutWeight =
      supplierWeight - bardanaWeight - netWeight;

    setFormData((prev) => ({
      ...prev,
      netWeight: netWeight.toString(),
      grossWeight: grossWeight.toString(),
      supplierWeightMinusBardana: supplierWeightMinusBardana.toString(),
      supplierWeightMinusOutWeight: supplierWeightMinusOutWeight.toString(),
    }));
  };

  // Auto-calculate weights when values change
  useEffect(() => {
    calculateWeights();
  }, [
    formData.firstWeight,
    formData.secondWeight,
    formData.bardanaWeight,
    formData.supplierWeight,
  ]);

  // Add keyboard event listeners for Ctrl+L and F11
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+L to open LOVs
      if (event.ctrlKey && event.key === "l") {
        event.preventDefault();
        if (!onlineMode) {
          const activeElement = document.activeElement as HTMLElement;

          if (activeElement) {
            // Check if we're directly on a combobox
            if (activeElement.getAttribute('role') === 'combobox') {
              activeElement.click();
              return;
            }

            // Check if we're inside a select wrapper
            const selectWrapper = activeElement.closest('div');
            if (selectWrapper) {
              const comboboxInWrapper = selectWrapper.querySelector('[role="combobox"]') as HTMLElement;
              if (comboboxInWrapper && selectWrapper.contains(activeElement)) {
                comboboxInWrapper.click();
                return;
              }
            }
          }

          // Fallback to first available combobox
          const firstCombobox = document.querySelector('[role="combobox"]') as HTMLElement;
          if (firstCombobox) {
            firstCombobox.click();
          }
        }
      }

      // F11 to open slip search
      if (event.key === "F11") {
        event.preventDefault();
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
<