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

  // Fetch all first weight records
  const { data: firstWeightRecords = [] } = useQuery({
    queryKey: ["/api/purchase/first-weight-records"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Fetch offline records specifically
  const { data: offlineRecords = [] } = useQuery({
    queryKey: ["/api/purchases/offline"],
    refetchInterval: 3000, // Refresh every 3 seconds
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
          bardanaType: firstItem.bardanatype || "",
          wtPerBag: firstItem.wtperbag ? String(firstItem.wtperbag) : "",
          igpDate: firstItem.igp_date || "",
          igpId: firstItem.igp_id || "",
          itemId: firstItem.item_id || "",
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
  const checkVehicleNumberExists = async (vehicleNo: string, excludeWbId?: number) => {
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
  const checkIGPVehicleNumberExists = async (vehicleNo: string, igpNo: string, excludeWbId?: number) => {
    if (!vehicleNo || vehicleNo.trim() === "" || !igpNo || igpNo.trim() === "") return false;

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
      if (weightStr.includes('%')) {
        percentageValue = parseFloat(weightStr.replace('%', '')) || 0;
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
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Split into integer and decimal parts
    const parts = cleanValue.split('.');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Add commas to integer part (Pakistani style: 12,34,567)
    if (integerPart.length > 3) {
      // First, handle the rightmost 3 digits
      const rightPart = integerPart.slice(-3);
      let leftPart = integerPart.slice(0, -3);

      // Add commas every 2 digits from right to left for the remaining part
      const leftPartFormatted = leftPart.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

      integerPart = leftPartFormatted + ',' + rightPart;
    }

    // Combine integer and decimal parts
    return decimalPart !== undefined ? integerPart + '.' + decimalPart : integerPart;
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Prevent editing IGP-fetched fields in online mode when IGP data has been fetched
    if (onlineMode && igpDataFetched && !isEditMode) {
      const igpFetchedFields = [
        "driverName",
        "vendor",
        "vehicleNo",
        "noOfBags",
        "bardanaType",
        "wtPerBag",
        "igpDate",
      ];
      if (igpFetchedFields.includes(name)) {
        alert("This field cannot be edited after IGP data has been fetched.");
        return;
      }
    }

    // Vehicle number validation - allow editing existing records but not new entries with duplicate vehicles
    if (name === "vehicleNo" && value.trim() !== "" && !isEditMode) {
      // Only check for duplicates in new entries, not in edit mode
      const vehicleExists = await checkVehicleNumberExists(value);
      if (vehicleExists) {
        alert(
          `Vehicle number ${value} already has an entry for today. Please use a different vehicle number.`,
        );
        return;
      }
    }

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

  // Fetch vendor data for offline mode and clear IGP field when switching to offline
  useEffect(() => {
    if (!onlineMode) {
      const fetchVendorData = async () => {
        try {
          console.log("Fetching vendor data for offline mode...");
          const response = await fetch("/api/vendor-data");
          if (response.ok) {
            const data = await response.json();
            setVendorData(data);
            console.log("Vendor data fetched successfully:", data);
          } else {
            console.error("Failed to fetch vendor data");
          }
        } catch (error) {
          console.error("Error fetching vendor data:", error);
        }
      };

      // Fetch proper vendors from inv_vendors table
      const fetchVendorsData = async () => {
        try {
          console.log("Fetching vendors from inv_vendors table...");
          const response = await fetch("/api/vendors");
          if (response.ok) {
            const data = await response.json();
            setVendorsData(data);
            console.log("Vendors data fetched successfully:", data);
          } else {
            console.error("Failed to fetch vendors data");
          }
        } catch (error) {
          console.error("Error fetching vendors data:", error);
        }
      };

      fetchVendorData();
      fetchVendorsData();
    }

    // Clear IGP field when switching to offline mode (only if not in edit mode)
    if (!onlineMode && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        igpNo: "",
      }));
      console.log("Cleared IGP field when switching to offline mode");
    }
  }, [onlineMode, isEditMode]);

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
          total: item.bags * item.pb,
        }));
        setBagTableData(formattedData);

        // Populate weight and bags fields from first deduction entry
        if (formattedData.length > 0) {
          const firstEntry = formattedData[0];
          setFormData((prev) => ({
            ...prev,
            weight: firstEntry.weight ? String(firstEntry.weight) : "",
            bags: firstEntry.bags ? String(firstEntry.bags) : "",
          }));
        }

        console.log("Loaded existing deduction data:", formattedData);
      }
    } catch (error) {
      console.error("Error loading deduction data:", error);
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

    if (!formData.vehicleNo || formData.vehicleNo.trim() === "") {
      alert("Vehicle number is required");
      setLoading(false);
      return;
    }

    // Check for duplicate vehicle number only for new entries, not in edit mode
    if (!isEditMode) {
      if (formData.igpNo && formData.igpNo.trim() !== "") {
        const igpVehicleExists = await checkIGPVehicleNumberExists(formData.vehicleNo, formData.igpNo);
        if (igpVehicleExists) {
          alert(
            `Vehicle number ${formData.vehicleNo} with IGP ${formData.igpNo} already has an entry for today. Please use a different vehicle number or IGP number.`,
          );
          setLoading(false);
          return;
        }
      } else {
        const vehicleExists = await checkVehicleNumberExists(formData.vehicleNo);
        if (vehicleExists) {
          alert(
            `Vehicle number ${formData.vehicleNo} already has an entry for today. Please use a different vehicle number.`,
          );
          setLoading(false);
          return;
        }
      }
    }

    // Determine entry type based on selected form and return mode
    let currentEntryType = "PURCHASE";
    if (selectedForm === "sales") {
      currentEntryType = isReturnMode ? "SALE_RETURN" : "SALE";
    } else {
      currentEntryType = isReturnMode ? "PURCHASE_RETURN" : "PURCHASE";
    }

    // Check if a record with this slip number already exists
    let existingRecord = null;
    try {
      const checkResponse = await fetch(
        `/api/purchase/by-slip/${formData.slipNo}`,
      );
      if (checkResponse.ok) {
        existingRecord = await checkResponse.json();
        console.log("Found existing record:", existingRecord);
      }
    } catch (error) {
      console.log("No existing record found for slip:", formData.slipNo);
    }

    // Debug the online/offline mode state
    console.log("Before saving - onlineMode state:", onlineMode);
    console.log("Before saving - formData.onlineEntry:", formData.onlineEntry);
    console.log(
      "Before saving - formData.offlineEntry:",
      formData.offlineEntry,
    );

    // Prepare master data payload with safe parsing
    const masterPayload = {
      slip_no: formData.slipNo || null,
      slip_in_time: formatISODate(formData.slipInTime),
      first_weight:
        formData.firstWeight &&
        formData.firstWeight !== "undefined" &&
        formData.firstWeight.trim() !== ""
          ? parseFloat(formData.firstWeight)
          : null,
      second_weight:
        formData.secondWeight &&
        formData.secondWeight !== "undefined" &&
        formData.secondWeight.trim() !== ""
          ? parseFloat(formData.secondWeight)
          : null,
      net_weight:
        formData.netWeight &&
        formData.netWeight !== "undefined" &&
        formData.netWeight.trim() !== ""
          ? parseFloat(formData.netWeight)
          : null,
      bardana_weight:
        formData.bardanaWeight &&
        formData.bardanaWeight !== "undefined" &&
        formData.bardanaWeight.trim() !== ""
          ? parseFloat(formData.bardanaWeight)
          : null,
      gross_weight:
        formData.grossWeight &&
        formData.grossWeight !== "undefined" &&
        formData.grossWeight.trim() !== ""
          ? parseFloat(formData.grossWeight)
          : null,
      freight:
        formData.freight &&
        formData.freight !== "undefined" &&
        formData.freight.trim() !== ""
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
      online_entry: onlineMode ? "Yes" : null,
      offline_entry: onlineMode ? null : "Yes",
      created_by: user?.userid ? parseInt(user.userid.toString()) : null,
      creation_date: formData.creationDate || null,
      last_updated_by:
        formData.lastUpdatedBy &&
        formData.lastUpdatedBy !== "undefined" &&
        formData.lastUpdatedBy.trim() !== ""
          ? parseInt(formData.lastUpdatedBy, 10)
          : null,
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
      if (
        (existingRecord &&
          existingRecord.master &&
          existingRecord.master.wb_id) ||
        (isEditMode && editingWbId)
      ) {
        const updateWbId =
          existingRecord && existingRecord.master
            ? existingRecord.master.wb_id
            : editingWbId;

        if (!updateWbId) {
          throw new Error("No valid wb_id found for update operation");
        }

        // Handle online/offline status updates properly
        if (isEditMode && updateWbId) {
          console.log(
            "Updating online/offline status - onlineMode:",
            onlineMode,
          );
        }

        console.log("Updating record with wb_id:", updateWbId);
        console.log("Edit mode:", isEditMode, "editingWbId:", editingWbId);

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
          po_qty:
            formData.poQty &&
            formData.poQty !== "undefined" &&
            formData.poQty.trim() !== ""
              ? parseFloat(formData.poQty)
              : null,
          igp_qty:
            formData.igpQty &&
            formData.igpQty !== "undefined" &&
            formData.igpQty.trim() !== ""
              ? parseFloat(formData.igpQty)
              : null,
          balance_qty:
            formData.balanceQty &&
            formData.balanceQty !== "undefined" &&
            formData.balanceQty.trim() !== ""
              ? parseFloat(formData.balanceQty)
              : null,
          igp_date: formData.igpDate || null,
          weight_per_bags:
            formData.wtPerBag &&
            formData.wtPerBag !== "undefined" &&
            formData.wtPerBag.trim() !== ""
              ? parseFloat(formData.wtPerBag)
              : null,
          no_of_bags:
            formData.noOfBags &&
            formData.noOfBags !== "undefined" &&
            formData.noOfBags.trim() !== ""
              ? parseInt(formData.noOfBags)
              : null,
          bardana_type: formData.bardanaType || null,
        };

        console.log("Update payload being sent:", updatePayload);

        masterResponse = await fetch(`/api/purchase/update/${updateWbId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
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
        masterResponse = await fetch("/api/purchases", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(masterPayload),
        });
      }

      if (!masterResponse.ok) {
        const errorData = await masterResponse.json().catch(() => ({}));
        const errorMessage =
          errorData.details ||
          errorData.error ||
          `HTTP error! status: ${masterResponse.status}`;
        console.error("Server error response:", errorData);
        throw new Error(errorMessage);
      }

      const masterData = await masterResponse.json();
      console.log("Master purchase saved/updated:", masterData);

      // Get the WB_ID from saved master data for new records
      if (!isEditMode) {
        savedWbId = masterData.wb_id;
      } else if (editingWbId) {
        savedWbId = editingWbId;
      } else {
        savedWbId = masterData.wb_id || 0;
      }

      // For Sales entries, save sales data to details table using standard purchase items API
      if (selectedForm === "sales") {
        // Filter valid sales rows (at least one field filled)
        const validSalesRows = salesData.filter(
          (row) =>
            row.customerName ||
            row.vehicleNo ||
            row.itemDescription ||
            row.dcNo ||
            row.doNo,
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
                do_qty: row.doQty ? parseFloat(row.doQty) : null, // Additional do_qty field
                dc_qty: row.dcQty ? parseFloat(row.dcQty) : null, // Map DC Qty to dc_qty field
              };

              const salesItemResponse = await fetch("/api/purchase-items", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(salesItemPayload),
              });

              if (salesItemResponse.ok) {
                console.log("Sales item saved to Details table:", row);
              } else {
                console.error(
                  "Failed to save sales item to Details table:",
                  row,
                );
              }
            }
            console.log(
              "All sales detail data saved successfully to Details table",
            );
          } catch (salesError) {
            console.error("Error saving sales detail data:", salesError);
          }
        }
      } else {
        // Only save items data for new Purchase entries (not for updates)
        if (!isEditMode && !existingRecord) {
          // Prepare items data payload for Purchase entries - use first IGP item if available, otherwise form data
          const firstIgpItem: any = igpItems.length > 0 ? igpItems[0] : {};

          console.log("Form data for items:", formData);
          console.log("IGP items available:", igpItems);

          const itemsPayload = {
            wb_id: savedWbId!,
            baradana_type: formData.bardanaType || null,
            igp_no: formData.igpNo || null,
            vehicle_no: formData.vehicleNo || null,
            weight_per_bags: formData.wtPerBag
              ? parseFloat(formData.wtPerBag)
              : null,
            igp_date: formData.igpDate || null,
            supplier_weight: formData.supplierWeight
              ? parseFloat(formData.supplierWeight)
              : null,
            quality_deduction: formData.qualityDeduction
              ? parseFloat(formData.qualityDeduction)
              : null,
            bardana_weight: formData.bardanaWeight
              ? parseFloat(formData.bardanaWeight)
              : null, // New Bardana Wht field
            no_of_bags: formData.noOfBags ? parseInt(formData.noOfBags) : null,
            vendor_name: firstIgpItem?.vendor_name || formData.vendor || null,
            bag_condition: formData.bagCondition || null,
            po_no: firstIgpItem?.po_no || formData.po_no || null,
            item_code: firstIgpItem?.item_code || formData.itemCode || null,
            item_desc: firstIgpItem?.item_desc || formData.itemDesc || null,
            po_qty: firstIgpItem?.po_qty
              ? parseFloat(firstIgpItem.po_qty)
              : formData.poQty
                ? parseFloat(formData.poQty)
                : null,
            igp_qty: firstIgpItem?.igp_qty
              ? parseFloat(firstIgpItem.igp_qty)
              : formData.igpQty
                ? parseFloat(formData.igpQty)
                : null,
            balance_qty: firstIgpItem?.balance_qty
              ? parseFloat(firstIgpItem.balance_qty)
              : formData.balanceQty
                ? parseFloat(formData.balanceQty)
                : null,
            dc_qty: firstIgpItem?.dc_qty
              ? parseFloat(firstIgpItem.dc_qty)
              : null,
            igp_id: firstIgpItem?.igp_id
              ? parseInt(firstIgpItem.igp_id)
              : formData.igpId
                ? parseInt(formData.igpId)
                : null,
            item_id: firstIgpItem?.item_id
              ? parseInt(firstIgpItem.item_id)
              : formData.itemId
                ? parseInt(formData.itemId)
                : null,
          };

          console.log("Items payload being sent:", itemsPayload);

          // Save items data for Purchase entries
          const itemsResponse = await fetch("/api/purchase-items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(itemsPayload),
          });

          if (!itemsResponse.ok) {
            console.error("Failed to save purchase items");
          }
        }
      }

      // Automatically capture first weight image (only for new entries with first weight but no second weight)
      if (formData.firstWeight && !formData.secondWeight) {
        try {
          console.log(
            "Capturing first weight image for slip:",
            formData.slipNo,
          );
          const captureResponse = await fetch("/api/capture/first-weight", {
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
            const captureData = await captureResponse.json();
            console.log(
              "First weight image captured successfully:",
              captureData.message,
            );
          } else {
            console.log(
              "First weight image capture failed, but continuing with form submission",
            );
          }
        } catch (imageError) {
          console.log(
            "First weight image capture error, but continuing:",
            imageError,
          );
        }
      }

      // Automatically capture second weight image when both weights are present
      if (formData.firstWeight && formData.secondWeight) {
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
            const captureData = await captureResponse.json();
            console.log(
              "Second weight image captured successfully:",
              captureData.message,
            );
          } else {
            console.log(
              "Second weight image capture failed, but continuing with form submission",
            );
          }
        } catch (imageError) {
          console.log(
            "Second weight image capture error, but continuing:",
            imageError,
          );
        }
      }

      // Save bag data to deduction table if available
      if (bagTableData.length > 0) {
        try {
          console.log("Saving deduction data for wb_id:", savedWbId);
          const deductionResponse = await fetch("/api/deduction/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              wbId: savedWbId!,
              bagTableData: bagTableData,
            }),
          });

          if (deductionResponse.ok) {
            console.log("Deduction data saved successfully to database");
          } else {
            const errorText = await deductionResponse.text();
            console.error("Failed to save deduction data:", errorText);
            alert("Warning: Main data saved but deduction data failed to save");
          }
        } catch (bagError) {
          console.error("Error saving deduction data:", bagError);
          alert("Warning: Main data saved but deduction data failed to save");
        }
      }

      // Save sales data when active tab is sale
      if (activeTab === "sale" && salesData.length > 0) {
        try {
          const validSalesData = salesData.filter(
            (item) =>
              item.doNo ||
              item.customerName ||
              item.vehicleNo ||
              item.itemDescription ||
              item.dcNo,
          );

          if (validSalesData.length > 0) {
            console.log("Saving sales data to details table:", validSalesData);

            const salesPayload = {
              salesData: validSalesData.map((item) => ({
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
                branch: item.branch || null,
              })),
              entryType: "SALE",
            };

            const salesResponse = await fetch("/api/sales/save", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(salesPayload),
            });

            if (salesResponse.ok) {
              console.log("Sales detail data saved successfully to database");
            } else {
              const errorText = await salesResponse.text();
              console.error("Failed to save sales detail data:", errorText);
              alert(
                "Warning: Main data saved but sales detail data failed to save",
              );
            }
          }
        } catch (salesError) {
          console.error("Error saving sales data:", salesError);
          alert("Warning: Main data saved but sales data failed to save");
        }
      }

      // Increment slip number for next entry
      const currentSlipNo = parseInt(formData.slipNo);
      const nextSlipNo = (currentSlipNo + 1).toString();

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

      if (isEditMode) {
        alert("Record updated successfully!");
        // Auto-print after successful update
        setTimeout(() => {
          try {
            const printHTML = `
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
          <div class="left-section">
            <div style="margin-top: 10px;">W.B # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipNo || ""}</div>

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
        // Reset form to clean state after edit
        resetFormToInitial();
      } else {
        alert("Purchase data saved successfully!");
        // Auto-print after successful save
        setTimeout(() => {
          try {
            const printHTML = `
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
          <div class="left-section">
            <div style="margin-top: 10px;">W.B # &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formData.slipNo || ""}</div>

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
        setFormData((prev) => ({
          ...prev,
          slipNo: nextSlipNo,
        }));
      }, 100);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save purchase.";
      alert(errorMessage);
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItems = async () => {
    setLoading(true);
    const payload = {
      wb_item_p_id: formData.wbItemPId
        ? parseInt(formData.wbItemPId, 10)
        : null,
      wb_id: formData.wbId ? parseInt(formData.wbId, 10) : null,
      manual_dc_no: formData.manualDcNo || null,
      do_id: formData.doId ? parseInt(formData.doId, 10) : null,
      do_no: formData.doNo || null,
      customer_id: formData.customerId
        ? parseInt(formData.customerId, 10)
        : null,
      customer_name: formData.customerName || null,
      vehicle_no: formData.vehicleNo || null,
      do_date: formData.doDate || null,
      item_id: formData.itemId ? parseInt(formData.itemId, 10) : null,
      item_code: formData.itemCode || null,
      item_desc: formData.itemDesc || null,
      created_by: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      creation_date: formData.creationDate || null,
      last_updated_by: formData.lastUpdatedBy
        ? parseInt(formData.lastUpdatedBy, 10)
        : null,
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
      bardana_weight: formData.bardanaWeight
        ? parseFloat(formData.bardanaWeight)
        : null,
      igp_date: formData.igpDate || null,
      quality_deduction: formData.qualityDeduction
        ? parseFloat(formData.qualityDeduction)
        : null,
      supplier_weight: formData.supplierWeight
        ? parseFloat(formData.supplierWeight)
        : null,
      sup_weight_wthout_bardana: formData.supplierWeightMinusBardana
        ? parseFloat(formData.supplierWeightMinusBardana)
        : null,
      net_supplier_weight: formData.supplierWeightMinusOutWeight
        ? parseFloat(formData.supplierWeightMinusOutWeight)
        : null,
      bag_condition: formData.bagCondition || null,
      bardana_type_id: formData.bardanaTypeId
        ? parseInt(formData.bardanaTypeId, 10)
        : null,
    };

    try {
      const response = await fetch("/api/purchase-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      alert("Purchase items saved successfully!");
      console.log("Items saved:", data);
    } catch (err) {
      alert("Failed to save purchase items.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-100 p-1 overflow-hidden relative">
      {/* Weight Display Table - Upper Right Side */}
      <div className={`absolute ${isEditMode ? 'top-20' : 'top-20'} right-14 z-50`}>
        <div className="bg-white border-2 border-gray-400 rounded-md shadow-lg w-96 mb-6">
          {/* Header Row */}
          <div className="flex border-b border-gray-400">
            <div className="bg-gray-200 border-r border-gray-400 p-2 text-center text-sm font-semibold text-black w-32">
              Slip No
            </div>
            <div className="bg-gray-200 border-r border-gray-400 p-2 text-center text-sm font-semibold text-black w-32">
              Vehicle No
            </div>
            <div className="bg-gray-200 p-2 text-center text-sm font-semibold text-black w-32">
              Entry Type
            </div>
          </div>
          {/* Search Row - positioned under headers */}
          <div className="flex border-b border-gray-400 bg-blue-50">
            <div className="border-r border-gray-400 p-1 w-32">
              <Input
                placeholder="Search Slip No"
                value={searchSlipNo}
                onChange={(e) => setSearchSlipNo(e.target.value)}
                className="h-5 text-xs text-black placeholder:text-gray-500 bg-white border-gray-300"
              />
            </div>
            <div className="border-r border-gray-400 p-1 w-32">
              <Input
                placeholder="Search Vehicle"
                value={searchVehicleNo}
                onChange={(e) => setSearchVehicleNo(e.target.value)}
                className="h-5 text-xs text-black placeholder:text-gray-500 bg-white border-gray-300"
              />
            </div>
            <div className="p-1 w-32">
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
                  className="flex border-b border-gray-400 hover:bg-gray-50"
                >
                  <button
                    className="border-r border-gray-400 p-2 text-center text-xs text-blue-600 hover:text-blue-800 hover:underline bg-white w-32"
                    onClick={() => {
                      console.log("Clicked record:", record);
                      console.log("wb_id:", record.wb_id);
                      console.log("entry_type:", record.entry_type);
                      console.log("offline_entry:", record.offline_entry);

                      if (record.wb_id) {
                        // Check if this is an offline entry
                        const isOfflineEntry = record.offline_entry === "Yes";

                        // Navigate based on entry type
                        // Determine the correct mode parameter
                        const modeParam = isOfflineEntry ? "offline" : "online";

                        if (record.entry_type === "SALE") {
                          const targetUrl = `/sales-form?type=${modeParam}&edit=${record.wb_id}`;
                          console.log(
                            "Navigating to sales form in edit mode:",
                            targetUrl,
                          );
                          setLocation(targetUrl);
                        } else if (record.entry_type === "SALE_RETURN") {
                          const targetUrl = `/sales-return?type=${modeParam}&edit=${record.wb_id}`;
                          console.log(
                            "Navigating to sales return form:",
                            targetUrl,
                          );
                          window.location.href = targetUrl;
                        } else if (record.entry_type === "PURCHASE_RETURN") {
                          const targetUrl = `/purchase-return?type=${modeParam}&edit=${record.wb_id}`;
                          console.log(
                            "Navigating to purchase return form:",
                            targetUrl,
                          );
                          window.location.href = targetUrl;
                        } else if (record.entry_type === "SALE") {
                          // For SALE entries, navigate to sales form in edit mode
                          const targetUrl = `/sales-form?type=${modeParam}&edit=${record.wb_id}`;
                          console.log(
                            "Navigating to sales form in edit mode:",
                            targetUrl,
                          );
                          setLocation(targetUrl);
                        } else if (record.entry_type === "SALE_RETURN") {
                          // For SALE_RETURN entries, navigate to sales return form
                          const targetUrl = `/sales-return?type=${modeParam}&edit=${record.wb_id}`;
                          console.log(
                            "Navigating to sales return form:",
                            targetUrl,
                          );
                          window.location.href = targetUrl;
                        } else {
                          // For PURCHASE entries, load data in current form
                          loadDataByWbId(record.wb_id);
                        }
                      }
                    }}
                  >
                    {record.slip_no || "---"}
                  </button>
                  <div className="border-r border-gray-400 p-2 text-center text-xs text-black bg-white w-32">
                    {record.vehicle_no || "---"}
                  </div>
                  <div className="p-2 text-center text-xs text-blue-600 font-semibold bg-white w-32">
                    {record.entry_type || "PURCHASE"}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex border-b border-gray-400">
                <div className="border-r border-gray-400 p-2 text-center text-xs text-gray-500 bg-white w-32">
                  {searchSlipNo || searchVehicleNo
                    ? "No matches"
                    : "No records"}
                </div>
                <div className="border-r border-gray-400 p-2 text-center text-xs text-gray-500 bg-white w-32">
                  ---
                </div>
                <div className="p-2 text-center text-xs text-gray-500 bg-white w-32">
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
      {selectedForm === "purchase" && (
        <div className={`absolute ${isEditMode ? 'top-50' : 'top-50'} right-14 z-50`}
          <div className="bg-white border-2 border-gray-400 rounded-sm shadow-lg w-96">
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
              <div className="bg-gray-200 p-1 text-center text-xs font-semibold text-black"></div>
            </div>

            {/* Dynamic Data Rows */}
            <div className="max-h-32 overflow-y-auto">
              {bagTableData.length === 0 ? (
                <div className="grid grid-cols-6 border-b border-gray-300">
                  <div className="col-span-6 p-2 text-center text-xs text-gray-500">
                    No bag data available. Click Deduction+ to add data.
                  </div>
                </div>
              ) : (
                bagTableData.map((item, index) => (
                  <div
                    key={item.bagId}
                    className="grid grid-cols-6 border-b border-gray-300"
                  >
                    <div className="border-r border-gray-300 p-1 text-center text-xs text-black">
                      {String(item.bagId).padStart(3, "0")}
                    </div>
                    <div className="border-r border-gray-300 p-1 text-center text-xs text-black">
                      {item.bags}
                    </div>
                    <div className="border-r border-gray-300 p-1 text-center text-xs text-black">
                      {Number(item.pb ?? 0).toFixed(1)}
                    </div>
                    <div className="border-r border-gray-300 p-1 text-center text-xs text-black">
                      {Number(item.percentage ?? 0).toFixed(1)}
                    </div>

                    <div className="border-r border-gray-300 p-1">
                      <div className="w-full text-center text-xs text-black">
                        {Number(item.weight || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="p-1 text-center flex flex-col items-center gap-1">
                      <input
                        type="checkbox"
                        checked={percentageMode[item.bagId] || false}
                        onChange={(e) =>
                          setPercentageMode((prev) => ({
                            ...prev,
                            [item.bagId]: e.target.checked,
                          }))
                        }
                        className="w-3 h-3"
                        title="Percentage mode"
                      />
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
                  value={bagTableData
                    .reduce((sum, item) => sum + item.total, 0)
                    .toFixed(1)}
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
            className={`h-8 px-2 text-sm font-medium ${selectedForm === "purchase" ? "bg-blue-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
            onClick={(e) => {
              e.preventDefault();
              if (isEditMode) {
                // Always navigate to new purchase form
                const urlParams = new URLSearchParams(window.location.search);
                const typeMode = urlParams.get("type") || "online";
                const targetUrl = `/purchase-form?type=${typeMode}`;
                // Clear any edit state and force navigation
                sessionStorage.removeItem("purchaseFormEditMode");
                window.location.href = targetUrl;
              } else {
                setSelectedForm("purchase");
              }
            }}
          >
            Purchase
          </Button>
          <Button
            className={`h-8 px-2 text-sm font-medium ${selectedForm === "sales" ? "bg-rose-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}`}
            onClick={(e) => {
              e.preventDefault();
              if (isEditMode) {
                // Always navigate to new sales form
                const urlParams = new URLSearchParams(window.location.search);
                const typeMode = urlParams.get("type") || "online";
                const targetUrl = `/sales-form?type=${typeMode}`;
                // Clear any edit state and force navigation
                sessionStorage.removeItem("purchaseFormEditMode");
                window.location.href = targetUrl;
              } else {
                setSelectedForm("sales");
              }
            }}
          >
            Sale
          </Button>
          <Button
            className={`h-8 px-2 text-sm font-medium ${selectedForm === "offline" ? "bg-yellow-600 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
            onClick={(e) => {
              e.preventDefault();
              setSelectedForm("offline");
            }}
          >
            Offline
          </Button>
          <Button
            className="h-8 px-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            onClick={navigateToFirst}
          >
            First
          </Button>
          <Button
            className="h-8 px-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium"
            onClick={navigateToPrev}
          >
            Prev
          </Button>
          <Button
            className="h-8 px-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white font-medium"
            onClick={navigateToNext}
          >
            Next
          </Button>
          <Button
            className="h-8 px-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium"
            onClick={navigateToLast}
          >
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

      {/* Main Form Layout - 100% visible without scrolling */}
      <div className="bg-white p-1 rounded border h-[calc(100vh-30px)] overflow-hidden">
        <div className="grid grid-cols-12 gap-1 h-full">
          {/* Left Side - Main Form (Columns 1-8) */}
          <div className="col-span-8">
            {/* Master Table Section */}
            <div className="bg-blue-50 p-2 rounded border mb-4 w-full">
              <div className="grid grid-cols-9 gap-4">
                {/* Column 1 - Left Form Fields */}
                <div className="col-span-3 flex flex-col gap-2 items-start">
                  {/* Slip No */}
                  <div className="flex items-center gap-[2px]">
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
                  <div className="flex items-center gap-[2px]">
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
                  <div className="flex items-center gap-[2px]">
                    <Label className="text-xs text-black w-20">Freight</Label>
                    <Input
                      name="freight"
                      value={formData.freight}
                      onChange={handleChange}
                      className="h-8 text-xs text-black w-52"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="flex items-start gap-[2px]">
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

                {/* Column 2 - Weight Fields */}
                <div className="col-span-3 flex flex-col gap-2 items-start">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-black w-24">
                      First Weight
                    </Label>
                    <Input
                      name="firstWeight"
                      value={formData.firstWeight}
                      onChange={handleChange}
                      className={`h-8 text-xs w-52 ${isEditMode ? "text-gray-600 bg-gray-100 cursor-not-allowed" : "text-black"}`}
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
                      className={`h-8 text-xs w-52 ${isEditMode ? "text-gray-600 bg-gray-100 cursor-not-allowed" : "text-green-600"}`}
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
                        value={formData.branch}
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

                {/* Column 3 - Driver & Branch */}
                <div className="col-span-3 flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    {/* Branch Field */}

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
                      />
                    </div>
                  </div>

                  {/* Buttons & Camera */}
                  <div className="flex flex-col gap-2 mt-2">
                    {/* First & Second Weight Buttons */}
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {" "}
                      {/* Slight space below */}
                      <Button
                        className={`h-8 text-xs ${
                          formData.firstWeight &&
                          formData.firstWeight.trim() !== ""
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
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

                    {/* Camera Feed */}
                    <div className="h-40 w-full overflow-hidden mb-1 rounded border">
                      {" "}
                      {/* Reduced mb */}
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

                    {/* Clear & Exit Buttons */}
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
            {/* Large Label Between Sections */}
            <div className="text-center py-1 mb-3">
              <div
                className={`inline-block px-4 py-1 rounded-lg shadow-md ${
                  onlineMode === true
                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                }`}
              >
                <h2 className="text-3xl font-bold tracking-wide">
                  {isReturnMode
                    ? onlineMode === true
                      ? selectedForm === "sales"
                        ? "Sale Return Online"
                        : "Purchase Return Online"
                      : selectedForm === "sales"
                        ? "Sale Return Offline"
                        : "Purchase Return Offline"
                    : onlineMode === true
                      ? selectedForm === "sales"
                        ? "Sale Online"
                        : "Purchase Online"
                      : selectedForm === "sales"
                        ? "Sale Offline"
                        : "Purchase Offline"}
                </h2>
              </div>
            </div>

            {/* Top buttons row - above details section */}
            <div className="flex gap-1">
              <Button
                className={`h-6 text-xs px-3 ${selectedForm === "purchase" ? "bg-blue-600 text-white" : "bg-gray-300 text-black"}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedForm("purchase");
                }}
              >
                Purchase
              </Button>

              <Button
                className={`h-6 text-xs px-3 ${selectedForm === "sales" ? "bg-blue-600 text-white" : "bg-gray-300 text-black"}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedForm("sales");
                }}
              >
                Sales
              </Button>

              <Button
                className={`h-6 text-xs px-3 ${selectedForm === "offline" ? "bg-blue-600 text-white" : "bg-gray-300 text-black"}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedForm("offline");
                }}
              >
                Offline
              </Button>
            </div>

            {/* Details Section */}
            <div className="bg-blue-50 p-2 rounded border">
              {/* Show Purchase Form when selectedForm is 'purchase' */}
              {selectedForm === "purchase" && (
                <div className="mt-1">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    {/* First Column */}
                    <div className="flex flex-col gap-2">
                      {/* Bardana Type */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">
                          Bardana Type
                        </span>
                        {onlineMode ? (
                          <Input
                            name="bardanaType"
                            value={formData.bardanaType}
                            onChange={handleChange}
                            className={`h-8 text-xs text-black w-60 ${
                              igpDataFetched && !isEditMode
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            }`}
                            placeholder="Enter bardana type"
                            readOnly={igpDataFetched && !isEditMode}
                          />
                        ) : (
                          <Select
                            name="bardanaType"
                            value={formData.bardanaType}
                            onValueChange={(value) => {
                              const selectedBardana = bardanaTypes.find(
                                (item) => item.type === value,
                              );
                              setFormData((prev) => ({
                                ...prev,
                                bardanaType: value,
                                wtPerBag:
                                  selectedBardana?.data_config_segment1 ||
                                  prev.wtPerBag,
                              }));
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs text-black w-60">
                              <SelectValue
                                placeholder="Select bardana type"
                                className="text-black"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Search Box at top */}
                              <div className="px-2 py-1 sticky top-0 bg-white z-10">
                                <Input
                                  type="text"
                                  placeholder="Search Bardana Type..."
                                  value={bardanaSearchQuery}
                                  onChange={(e) =>
                                    setBardanaSearchQuery(e.target.value)
                                  }
                                  className="h-6 text-xs border-gray-300"
                                />
                              </div>

                              {/* Filtered Bardana Types */}
                              {bardanaTypes
                                .filter((bardanaType) =>
                                  bardanaType.type
                                    .toLowerCase()
                                    .includes(bardanaSearchQuery.toLowerCase()),
                                )
                                .map((bardanaType) => (
                                  <SelectItem
                                    key={bardanaType.data_config_segment1}
                                    value={bardanaType.type}
                                  >
                                    {bardanaType.type}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Wt per Bag */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">
                          Wt per Bag
                        </span>
                        <Input
                          name="wtPerBag"
                          value={formData.wtPerBag}
                          onChange={handleChange}
                          className={`h-8 text-xs text-black w-60 ${
                            onlineMode && igpDataFetched && !isEditMode
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          readOnly={onlineMode && igpDataFetched && !isEditMode}
                        />
                      </div>

                      {/* No of Bags */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">
                          No of Bags
                        </span>
                        <Input
                          name="noOfBags"
                          value={formData.noOfBags}
                          onChange={handleChange}
                          className={`h-8 text-xs text-black w-60 ${
                            onlineMode && igpDataFetched && !isEditMode
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          readOnly={onlineMode && igpDataFetched && !isEditMode}
                        />
                      </div>

                      {/* Bardana Weight */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">
                          Bardana Weight
                        </span>
                        <Input
                          name="bardanaWeight"
                          value={formData.bardanaWeight}
                          onChange={handleChange}
                          className={`h-8 text-xs text-black w-60 ${
                            onlineMode && igpDataFetched && !isEditMode
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          readOnly={onlineMode && igpDataFetched && !isEditMode}
                        />
                      </div>

                      {/* Quality */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">Quality</span>
                        <Input
                          name="qualityDeduction"
                          value={formData.qualityDeduction}
                          onChange={handleChange}
                          className="h-8 text-xs text-black w-60"
                        />
                      </div>
                    </div>

                    {/* Second Column */}
                    <div className="flex flex-col gap-2">
                      {/* IGP No */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">IGP No</span>
                        <Input
                          name="igpNo"
                          value={formData.igpNo}
                          onChange={handleChange}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && onlineMode && !isEditMode) {
                              fetchIgpData();
                            }
                          }}
                          className={`h-8 text-xs w-60 ${
                            !onlineMode || isEditMode 
                              ? "text-gray-500 bg-gray-100 cursor-not-allowed" 
                              : "text-black"
                          }`}
                          placeholder={
                            isEditMode
                              ? "Non-editable in edit mode"
                              : onlineMode
                              ? "Press Enter to fetch"
                              : "Not available in offline mode"
                          }
                          readOnly={!onlineMode || isEditMode}
                        />
                      </div>

                      {/* IGP Date */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">
                          IGP Date
                        </span>
                        <Input
                          name="igpDate"
                          value={formData.igpDate}
                          onChange={handleChange}
                          className={`h-8 text-xs text-black w-60 ${
                            onlineMode && igpDataFetched && !isEditMode
                              ? "bg-gray-100 cursor-not-allowed"
                              : ""
                          }`}
                          placeholder={
                            onlineMode
                              ? "Press Enter to fetch"
                              : "Enter IGP Date"
                          }
                          readOnly={onlineMode && igpDataFetched && !isEditMode}
                        />
                      </div>

                      {/* Vendor */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">Vendor</span>
                        {onlineMode ? (
                          <Input
                            name="vendor"
                            value={formData.vendor}
                            onChange={handleChange}
                            className={`h-8 text-xs text-black w-60 ${
                              igpDataFetched && !isEditMode
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            }`}
                            readOnly={igpDataFetched && !isEditMode}
                          />
                        ) : (
                          <Select
                            name="vendor"
                            value={formData.vendor}
                            onValueChange={(value) => {
                              const selectedVendor = vendorsData.find(
                                (vendor) => vendor.vendor_name === value,
                              );
                              setFormData((prev) => ({
                                ...prev,
                                vendor: value,
                                vendorId: selectedVendor
                                  ? selectedVendor.vendor_id.toString()
                                  : prev.vendorId,
                              }));
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs text-black w-60">
                              <SelectValue
                                placeholder="Select vendor"
                                className="text-black"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {vendorsData.map((vendor) => (
                                <SelectItem
                                  key={vendor.vendor_id}
                                  value={vendor.vendor_name}
                                >
                                  {vendor.vendor_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {/* Vehicle No */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">
                          Vehicle No
                        </span>
                        <div className="flex gap-1 w-60">
                          <Input
                            name="vehicleNo"
                            value={formData.vehicleNo}
                            onChange={handleChange}
                            className={`h-8 text-xs text-black flex-1 ${
                              onlineMode && igpDataFetched && !isEditMode
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            }`}
                            readOnly={
                              onlineMode && igpDataFetched && !isEditMode
                            }
                          />
                        </div>
                      </div>

                      {/* Weight */}
                      {/* Weight, Bags & % toggle in one row */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-black w-28">Weight</span>
                        <div className="flex gap-1 w-60">
                          {/* Weight Input */}
                          {formData.isPercentageMode ? (
                            <Select
                              name="weight"
                              value={formData.weight}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  weight: value,
                                }))
                              }
                            >
                              <SelectTrigger className="h-8 text-xs text-black flex-1">
                                <SelectValue
                                  placeholder="Select weight"
                                  className="text-black"
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {onlineMode
                                  ? percentageData.map((item, index) => (
                                      <SelectItem
                                        key={index}
                                        value={item.data_config_desc}
                                      >
                                        {item.data_config_desc}
                                      </SelectItem>
                                    ))
                                  : vendorData.map((vendor, index) => (
                                      <SelectItem
                                        key={index}
                                        value={vendor.view}
                                      >
                                        {vendor.view}
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              name="weight"
                              value={formData.weight}
                              onChange={handleChange}
                              className="h-8 text-xs text-black flex-1"
                            />
                          )}

                          {/* Bags Input */}
                          <Input
                            name="bags"
                            value={formData.bags}
                            onChange={handleChange}
                            className="h-8 text-xs text-black flex-1"
                            placeholder="Bags"
                          />

                          {/* % Mode Checkbox */}
                          <div className="flex items-center gap-0.5">
                            <input
                              type="checkbox"
                              checked={formData.isPercentageMode || false}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  isPercentageMode: e.target.checked,
                                  weight: "",
                                }))
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-xs text-black">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Third Column */}
                    <div className="space-y-2">
                      {/* Supplier Weight */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-28">
                          Supplier Weight
                        </span>
                        <Input
                          name="supplierWeight"
                          value={formData.supplierWeight}
                          onChange={handleChange}
                          className="h-8 text-xs text-black w-60"
                        />
                      </div>

                      {/* Supplier Weight - Bardana */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-28">
                          Supp Wt - Bardana
                        </span>
                        <Input
                          name="supplierWeightMinusBardana"
                          value={formData.supplierWeightMinusBardana}
                          readOnly
                          className="h-8 text-xs text-gray-600 bg-gray-100 w-60"
                        />
                      </div>

                      {/* Supplier Weight - Out Weight */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-black w-28">
                          Supp Wt - Out Wt
                        </span>
                        <Input
                          name="supplierWeightMinusOutWeight"
                          value={formData.supplierWeightMinusOutWeight}
                          readOnly
                          className="h-8 text-xs text-gray-600 bg-gray-100 w-60"
                        />
                      </div>

                      {/* IGP ID - Hidden but keeping functionality */}
                      <div
                        className="flex items-center gap-2"
                        style={{ display: "none" }}
                      >
                        <span className="text-xs text-black w-28">IGP ID</span>
                        <Input
                          name="igpId"
                          value={formData.igpId}
                          onChange={handleChange}
                          className="h-8 text-xs text-black w-60"
                        />
                      </div>

                      {/* Item ID - Hidden but keeping functionality */}
                      <div
                        className="flex items-center gap-2"
                        style={{ display: "none" }}
                      >
                        <span className="text-xs text-black w-28">Item ID</span>
                        <Input
                          name="itemId"
                          value={formData.itemId}
                          onChange={handleChange}
                          className="h-8 text-xs text-black w-60"
                        />
                      </div>

                      {/* Deduction Button */}
                      <div className="mt-5 flex justify-center">
                        <Button
                          className="h-8 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium"
                          onClick={handleDeduction}
                        >
                          Deduction+
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Compact Table with IGP Data - aligned with master form */}
                  <div
                    className="border rounded text-xs h-[calc(100%-200px)] overflow-auto mt-4 ml-4"
                    style={{ width: "calc(100% - 1.8rem)" }}
                  >
                    <table className="w-full text-center font-bold text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="border p-1 text-xs text-black">
                            Po No
                          </th>
                          <th className="border p-1 text-xs text-black">
                            Item Code
                          </th>
                          <th className="border p-1 text-xs text-black">
                            Item Description
                          </th>
                          <th className="border p-1 text-xs text-black">
                            PO Quantity
                          </th>
                          <th className="border p-1 text-xs text-black">
                            IGP Quantity
                          </th>
                          <th className="border p-1 text-xs text-black">
                            Balance Quantity
                          </th>
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
                                <td className="border p-1 h-4 text-xs text-black">
                                  {item.po_no || ""}
                                </td>
                                <td className="border p-1 h-4 text-xs text-black">
                                  {item.item_code || ""}
                                </td>
                                <td className="border p-1 h-4 text-xs text-black">
                                  {item.item_desc || ""}
                                </td>
                                <td className="border p-1 h-4 text-xs text-black">
                                  {poQty.toFixed(2)}
                                </td>
                                <td className="border p-1 h-4 text-xs text-black">
                                  {igpQty.toFixed(2)}
                                </td>
                                <td className="border p-1 h-4 text-xs text-black">
                                  {balanceQty.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        ) : onlineMode ? (
                          <tr>
                            <td
                              className="border p-1 h-4 text-xs text-black"
                              colSpan={6}
                            >
                              {isEditMode
                                ? "Loading saved record data..."
                                : "No IGP data available"}
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td className="border p-1 h-4 text-xs text-black">
                              <Input
                                name="poNo"
                                value={formData.poNo}
                                onChange={handleChange}
                                className="h-4 text-xs text-black w-full border-none bg-transparent"
                                placeholder="Enter PO No"
                              />
                            </td>
                            <td className="border p-1 h-4 text-xs text-black">
                              <Select
                                name="itemCode"
                                value={formData.itemCode}
                                onValueChange={(value) => {
                                  try {
                                    const selectedItem = invItems.find(
                                      (item) => item.item_code === value,
                                    );
                                    setFormData((prev) => ({
                                      ...prev,
                                      itemCode: value || "",
                                      itemDesc: selectedItem?.item_desc || "",
                                      itemId: selectedItem?.item_id
                                        ? String(selectedItem.item_id)
                                        : "",
                                    }));
                                  } catch (error) {
                                    console.error(
                                      "Error selecting item:",
                                      error,
                                    );
                                  }
                                }}
                              >
                                <SelectTrigger className="h-4 text-xs text-black w-full border-none bg-transparent">
                                  <SelectValue
                                    placeholder="Select item code"
                                    className="text-black"
                                  />
                                </SelectTrigger>

                                <SelectContent>
                                  {/* Search Box at top */}
                                  <div className="px-2 py-1 sticky top-0 bg-white z-10">
                                    <Input
                                      type="text"
                                      placeholder="Search Item Code..."
                                      value={searchQuery}
                                      onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                      }
                                      className="h-6 text-xs border-gray-300"
                                    />
                                  </div>

                                  {/* Filtered Items */}
                                  {invItems
                                    .filter((item) =>
                                      item.item_code
                                        .toLowerCase()
                                        .includes(searchQuery.toLowerCase()),
                                    )
                                    .map((item) => (
                                      <SelectItem
                                        key={item.item_id}
                                        value={item.item_code}
                                      >
                                        {item.item_code} - {item.item_desc}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="border p-1 h-4 text-xs text-black">
                              <Input
                                name="itemDesc"
                                value={formData.itemDesc}
                                onChange={handleChange}
                                className="h-4 text-xs text-black w-full border-none bg-transparent"
                                placeholder="Auto-filled from Item Code"
                                readOnly
                              />
                            </td>
                            <td className="border p-1 h-4 text-xs text-black">
                              <Input
                                name="poQty"
                                value={formData.poQty}
                                onChange={handleChange}
                                className="h-4 text-xs text-black w-full border-none bg-transparent"
                                placeholder="PO Qty"
                                type="number"
                              />
                            </td>
                            <td className="border p-1 h-4 text-xs text-black">
                              <Input
                                name="igpQty"
                                value={formData.igpQty}
                                onChange={handleChange}
                                className="h-4 text-xs text-black w-full border-none bg-transparent"
                                placeholder="IGP Qty"
                                type="number"
                              />
                            </td>
                            <td className="border p-1 h-4 text-xs text-black">
                              <Input
                                name="balanceQty"
                                value={formData.balanceQty}
                                onChange={handleChange}
                                className="h-4 text-xs text-black w-full border-none bg-transparent"
                                placeholder="Balance"
                                type="number"
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Show Sales Form when selectedForm is 'sales' */}
              {selectedForm === "sales" && (
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
                              handleSalesDataChange(
                                index,
                                "dcNo",
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const dcNo = salesData[index]?.dcNo;
                                if (dcNo && dcNo.trim() !== "") {
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
                            className="w-full h-6 text-xs text-black px-2 border-none bg-transparent focus:outline-none"
                            value={salesData[index]?.branch || ""}
                            onChange={(e) =>
                              handleSalesDataChange(
                                index,
                                "branch",
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

                  {/* Bottom section with Weight Per Bags, Total Weight Out, and Total Feed Bags - matching image layout */}
                  <div
                    className="bg-gray-100 p-2 flex justify-between items-center border border-gray-300 mt-2"
                    style={{ width: "1220px" }}
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

              {/* Show Sales Form when selectedForm is 'sales' */}
              {selectedForm === "sales" && (
                <div className="h-full flex flex-col">
                  {/* Sales form content will go here */}
                  <div className="text-center p-4">
                    <p>Sales form functionality coming soon</p>
                  </div>
                </div>
              )}

              {/* Show Offline Form when selectedForm is 'offline' */}
              {selectedForm === "offline" && (
                <div
                  className="h-full flex flex-col"
                  style={{ maxWidth: "100%", width: "100%" }}
                >
                  <div
                    className="bg-white p-4 rounded border"
                    style={{ maxWidth: "100%", width: "100%" }}
                  >
                    <h3 className="text-lg font-semibold mb-4 text-black">
                      Purchase Offline Entries
                    </h3>

                    {/* Offline entries table with scroll */}
                    <div
                      className="overflow-auto"
                      style={{ maxHeight: "600px", height: "600px" }}
                    >
                      <table className="w-full text-sm border-collapse border border-black">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              Slip No
                            </th>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              Slip Date
                            </th>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              Entry Type
                            </th>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              First Weight
                            </th>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              Second Weight
                            </th>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              Vehicle No
                            </th>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              Company Name
                            </th>
                            <th className="px-3 py-2 text-left border border-black text-black">
                              Manual Trans #
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(offlineRecords) &&
                          offlineRecords.length > 0 ? (
                            offlineRecords.map((record: any) => (
                              <tr
                                key={record.wb_id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-3 py-2 border border-black text-black">
                                  <button
                                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                                    onClick={() => {
                                      console.log(
                                        "Clicked offline record:",
                                        record,
                                      );
                                      console.log("wb_id:", record.wb_id);
                                      console.log(
                                        "entry_type:",
                                        record.entry_type,
                                      );
                                      console.log(
                                        "offline_entry:",
                                        record.offline_entry,
                                      );

                                      if (record.wb_id) {
                                        // Check if this is an offline entry
                                        const isOfflineEntry =
                                          record.offline_entry === "Yes";
                                        const modeParam = isOfflineEntry
                                          ? "offline"
                                          : "online";

                                        // Navigate based on entry type
                                        if (record.entry_type === "SALE") {
                                          const targetUrl = `/sales-form?type=${modeParam}&edit=${record.wb_id}`;
                                          console.log(
                                            "Navigating to sales form:",
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
                                        } else if (
                                          record.entry_type ===
                                          "PURCHASE_RETURN"
                                        ) {
                                          const targetUrl = `/purchase-return?type=${modeParam}&edit=${record.wb_id}`;
                                          console.log(
                                            "Navigating to purchase return form:",
                                            targetUrl,
                                          );
                                          window.location.href = targetUrl;
                                        } else {
                                          // For purchase entries, stay on purchase form
                                          const targetUrl = `/purchase-form?form=purchase&type=${modeParam}&edit=${record.wb_id}`;
                                          console.log(
                                            "Navigating to purchase form:",
                                            targetUrl,
                                          );
                                          window.location.href = targetUrl;
                                        }
                                      }
                                    }}
                                  >
                                    {record.slip_no}
                                  </button>
                                </td>
                                <td className="px-3 py-2 border border-black text-black">
                                  {record.slip_in_time
                                    ? new Date(
                                        record.slip_in_time,
                                      ).toLocaleDateString()
                                    : "---"}
                                </td>
                                <td className="px-3 py-2 border border-black text-black">
                                  {record.entry_type || "PURCHASE"}
                                </td>
                                <td className="px-3 py-2 border border-black text-black">
                                  {record.first_weight || "---"}
                                </td>
                                <td className="px-3 py-2 border border-black text-black">
                                  {record.second_weight || "---"}
                                </td>
                                <td className="px-3 py-2 border border-black text-black">
                                  {record.vehicle_no || "---"}
                                </td>
                                <td className="px-3 py-2 border border-black text-black">
                                  {record.vendor_name || "---"}
                                </td>
                                <td className="px-3 py-2 border border-black text-black">
                                  ---
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={8}
                                className="text-center py-8 text-black border border-black"
                              >
                                No offline records found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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

export default PurchaseForm;