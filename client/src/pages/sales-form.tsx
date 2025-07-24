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
 <<div class="commodity-gross-row">
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
        <span class="label">DC Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.dcQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
      </div>

      <div>
        <span class="label">DO Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.doQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
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
 <<div class="commodity-gross-row">
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
        <span class="label">DC Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.dcQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
      </div>

      <div>
        <span class="label">DO Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.doQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
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
 <<div class="commodity-gross-row">
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
        <span class="label">DC Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.dcQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
      </div>

      <div>
        <span class="label">DO Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.doQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
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
        <hr style="border: 1px solid #000; margin: 20px 0;" />


           </div> <!-- .slip-section ends -->
    </div> <!-- .page-container ends -->
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

  // Fetch all first weight records
  const { data: firstWeightRecords = [] } = useQuery({
    queryKey: ["/api/purchase/first-weight-records"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch offline records specifically
  const { data: offlineRecords = [] } = useQuery({
    queryKey: ["/api/purchases/offline"],
    refetchInterval: 10000, // Refresh every 10 seconds
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
            doDate: item.dc_date || "",
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
        const response = await fetch("/api/purchases/next-slip?entry_type=SALE");
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
      console.log("Edit mode detected from URL parameter, loading data for wb_id:", editWbId);
      loadDataByWbId(parseInt(editWbId));
      return; // Exit early to prevent any other initialization
    } else {
      // No edit parameter in URL, reset to new form only if not already in edit mode
      if (isEditMode) {
        console.log("No edit parameter in URL but currently in edit mode, resetting to new form");
        setIsEditMode(false);
        setEditingWbId(null);
        setTimeout(() => {
          resetFormToInitial();
        }, 100);
      } else if (!formData.slipNo || formData.slipNo === "") {
        // Only reset if we don't have form data already
        console.log("No edit parameter and no form data, initializing new form");
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
          vendor_name: salesData.find(row => row.customerName)?.customerName || null,
          vehicle_no: salesData.find(row => row.vehicleNo)?.vehicleNo || formData.vehicleNo || null,
          po_no: salesData.find(row => row.doNo)?.doNo || null,
          igp_no: salesData.find(row => row.dcNo)?.dcNo || null,
          item_desc: salesData.find(row => row.itemDescription)?.itemDescription || null,
          po_qty: salesData.find(row => row.doQty)?.doQty ? parseFloat(salesData.find(row => row.doQty)?.doQty!) : null,
          igp_qty: salesData.find(row => row.dcQty)?.dcQty ? parseFloat(salesData.find(row => row.dcQty)?.dcQty!) : null,
          igp_date: salesData.find(row => row.doDate)?.doDate || null,
        };

        const updateResponse = await fetch(`/api/purchase/update/${editingWbId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

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
              row.doQty && row.doQty.trim() !== "" ? parseFloat(row.doQty) : null,
            igp_qty:
              row.dcQty && row.dcQty.trim() !== "" ? parseFloat(row.dcQty) : null,
            balance_qty: null,
            customer_name: row.customerName || null,
            do_no: row.doNo || null,
            do_qty:
              row.doQty && row.doQty.trim() !== "" ? parseFloat(row.doQty) : null,
            dc_qty:
              row.dcQty && row.dcQty.trim() !== "" ? parseFloat(row.dcQty) : null,
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
      alert(isEditMode ? "Sales data updated successfully!" : "Sales data saved successfully!");

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
 <<div class="commodity-gross-row">
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
        <span class="label">DC Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.dcQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
      </div>

      <div>
        <span class="label">DO Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.doQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
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
 <<div class="commodity-gross-row">
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
        <span class="label">DC Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.dcQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
      </div>

      <div>
        <span class="label">DO Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.doQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
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
 <<div class="commodity-gross-row">
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
        <span class="label">DC Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.dcQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
      </div>

      <div>
        <span class="label">DO Qty</span>
        <span class="value">${nonEmptyRows.map((row) => row.doQty || "").join("&nbsp;&nbsp;&nbsp;&nbsp;")}</span>
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
        <hr style="border: 1px solid #000; margin: 20px 0;" />


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
      }

      // Reset form to clean state and increment slip number for next entry
      resetFormToInitial();
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
                        } else if (record.entry_type === "SALE_RETURN") {
                          // Navigate to sales return form
                          const urlParams = new URLSearchParams(
                            window.location.search,
                          );
                          const typeMode = urlParams.get("type") || "online";
                          const targetUrl = `/sales-return?type=${typeMode}&edit=${record.wb_id}`;
                          setLocation(targetUrl);
                        } else {
                          // Load the data for editing (sales entries)
                          loadDataByWbId(record.wb_id);
                        }
                      }
                    }}
                  >
                    {record.slip_no || "---"}
                  </button>
                  <div className="border-r border-gray-400 p-1 text-center text-xs text-black bg-white">
                    {record.vehicle_no || "---"}
                  </div>
                  <div className="p-1 text-center text-xs text-blue-600 font-semibold bg-white">
                    {record.entry_type || "SALE"}
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
            className="bg-green-600 hover:bg-green-700 h-8 px-3 text-sm text-white font-medium"
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
                          className="h-5 text-xs text-black flex-1"
                        />
                        <Button
                          onClick={searchAndLoadBySlipNo}
                          className="h-5 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
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
                        className="h-5 text-xs text-black w-20"
                      />
                    )}
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
                    <Label className="text-xs text-black">Freight</Label>
                    <Input
                      name="freight"
                      value={formData.freight}
                      onChange={handleChange}
                      className="h-5 text-xs text-black w-28"
                    />
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

                {/* Column 3 - Driver & Branch */}
                <div className="col-span-3 space-y-1">
                  <div>
                    <Label className="text-xs text-black">Branch</Label>
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
                        className="h-5 text-xs text-black bg-gray-100"
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
                        <SelectTrigger className="h-5 text-xs text-black">
                          <SelectValue
                            placeholder={
                              branches.find(
                                (b) =>
                                  b.branch_id.toString() ===
                                  (formData.branchId || formData.branch),
                              )?.branch_name || "Select branch"
                            }
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
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        className="h-5 bg-yellow-500 text-xs"
                        onClick={resetForm}
                      >
                        Clear
                      </Button>
                      <Button className="h-5 bg-red-500 text-xs">Exit</Button>
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

            {/* Sales Details Section or Offline Entries */}
            <div className="bg-blue-50 p-2 rounded border">
              {showOfflineEntries ? (
                /* Offline Entries Table */
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
                /* Regular Sales Form */
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
                                  fetchDcData(dcNo.trim(), index); // ✅ index pass kar rahe hain
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