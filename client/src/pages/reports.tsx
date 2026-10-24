import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";




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

  igp_no: string;
  freight: string;
  item_desc: string;
  no_of_bags: string;
  bag_condition: string;
  bardana_type: string;
  wt_per_bag: string;
  remarks: string;

  first_weight: string;
  second_weight: string;
  gross_weight: string;
  bardana_weight: string;
  quality_deduction: string;
  net_weight: string;
  item_code: string;
  weight_per_bags: string;
}

interface SaleRecord {
  wb_id: number;
  slip_no: string;
  slip_in_time: string;
  slip_out_time: string;
   first_weight: string;
  second_weight: string,
  entry_type: string;
  customer_name: string;
  vehicle_no: string;
  branch_id: number;
   do_no: string;      // DO number (agar applicable)
  online_entry: boolean;
 offline_entry: boolean | string;

}

interface Branch {
  branch_id: number;
  branch_name: string;
}


export default function Reports() {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [activeTab, setActiveTab] = useState("purchase");
  const [location, setLocation] = useLocation();
  const [searchslip_no, setSearchslip_no] = useState("");
  const [searchVehicleNo, setSearchVehicleNo] = useState("");
  const { user } = useAuth();
   const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [vendorWise, setVendorWise] = useState(false);
const [pendingPrevDate, setPendingPrevDate] = useState(false);
// Purchase filters states
const [purchase, setPurchase] = useState(false);
const [vendorWisePurchase, setVendorWisePurchase] = useState(false);
const [pendingPurchase, setPendingPurchase] = useState(false);
const [unloaded, setUnloaded] = useState(false);
const [accumulatedUnloaded, setAccumulatedUnloaded] = useState(false);
// React state for Purchase dropdown
const [purchaseFilter, setPurchaseFilter] = useState<string>("PURCHASE");
const [saleFilter, setSaleFilter] = useState<string>("SALE");

// Top of your component
const [reloadingId, setReloadingId] = useState<number | null>(null);


 // Fetch branches
const { data: branches = [] } = useQuery<Branch[]>({
  queryKey: ["/api/branches"],
});

const { data: reportData, refetch } = useQuery({
  queryKey: ["/api/report", selectedBranch, fromDate, toDate],
  queryFn: async () => {
    const res = await fetch(
      `/api/report?branch=${selectedBranch}&from=${fromDate}&to=${toDate}`
    );
    return res.json();
  },
  enabled: false, // sirf button click pe fetch karega
});

// Jab branches load ho jayein, pehli branch ko default set karo
useEffect(() => {
  if (branches.length > 0 && !selectedBranch) {
    setSelectedBranch(branches[0].branch_id.toString());
  }
}, [branches, selectedBranch]);


// Backend se aayi hui slip_date ko parse karne ke liye
const parseSlipDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;

  // Case 1: agar backend ISO timestamp bhej raha hai
  if (!dateStr.includes("/")) {
    return new Date(dateStr);
  }

  // Case 2: agar backend DD/MM/YYYY bhej raha hai
  const [day, month, year] = dateStr.split("/");
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// Frontend date picker se aayi hui from/to ko parse karne ke liye
const parseInputDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  return new Date(dateStr);
};

// toDate ko din ke end tak le jao (inclusive range)
const inDateRange = (recordDate: Date | null, fromStr?: string, toStr?: string) => {
  if (!fromStr && !toStr) return true;               // koi filter nahi → allow
  if (!recordDate) return false;                      // date hi nahi → skip

  const from = parseInputDate(fromStr || null);
  const toRaw = parseInputDate(toStr || null);

  let to: Date | null = toRaw ? new Date(toRaw) : null;
  if (to) to.setHours(23, 59, 59, 999);              // 👈 include full end date

  return (!from || recordDate >= from) && (!to || recordDate <= to);
};

// record ki date safe tarike se nikaalne ke liye
const pickRecordDate = (r: any, keys: string[]) => {
  for (const k of keys) {
    const v = r?.[k];
    if (v) {
      const d = parseSlipDate(v);
      if (d) return d;
    }
  }
  return null;
};


// Fetch purchase records with branch + date filter
const {
  data: purchaseData,
  refetch: refetchPurchase,
  error: purchaseError,
} = useQuery({
  queryKey: ["/api/purchases", selectedBranch, fromDate, toDate], // 👈 include dates in queryKey
  queryFn: async () => {
    let url =
      selectedBranch && selectedBranch !== "all"
        ? `/api/purchases?branch_id=${selectedBranch}`
        : "/api/purchases";

    // 👇 add date filters if available
    if (fromDate && toDate) {
      url += `&from=${fromDate}&to=${toDate}`;
    }

    console.log("Fetching purchase data from:", url);
    const response = await fetch(url);
    const data = await response.json();
    console.log("Purchase API Response with vehicle_no and vendor_name:", data);

    if (!response.ok) {
      console.error("Purchase API error:", data);
      throw new Error(data.error || "Failed to fetch purchase data");
    }
    return data;
  },
});

// 🔑 Apply in filter
const purchaseRecords = Array.isArray(purchaseData)
  ? purchaseData.filter((r: any) => {
      const matchesEntryType =
        r.entry_type?.toUpperCase() === "PURCHASE" ||
        r.entry_type?.toUpperCase() === "PURCHASE_RETURN";

      const matchesslip_no =
        !searchslip_no || (r.slip_no || "").toString().toLowerCase().includes(searchslip_no.toLowerCase());

      const matchesVehicleNo =
        !searchVehicleNo || (r.vehicle_no || "").toString().toLowerCase().includes(searchVehicleNo.toLowerCase());

      const recordDate = pickRecordDate(r, ["slip_date", "creation_date", "slip_in_time"]);
      const matchesDate = inDateRange(recordDate, fromDate, toDate);

      return matchesEntryType && matchesslip_no && matchesVehicleNo && matchesDate;
    })
  : [];


const filteredRecords = purchaseRecords.filter((record) => {
  if (purchaseFilter === "VENDOR_WISE") {
    return record.vendor_name && record.vendor_name !== "";
  }
  return true; // Purchase aur baki filters me sab
});


  // Fetch sales records with branch + date filter
const {
  data: salesData,
  refetch: refetchSales,
  error: salesError,
} = useQuery({
  queryKey: ["/api/sales", selectedBranch, fromDate, toDate], // 👈 include dates
  queryFn: async () => {
    let url =
      selectedBranch && selectedBranch !== "all"
        ? `/api/sales?branch_id=${selectedBranch}`
        : "/api/sales";

    // 👇 add date filters if available
    if (fromDate && toDate) {
      url += `&from=${fromDate}&to=${toDate}`;
    }

    console.log("Fetching sales from:", url);
    const response = await fetch(url);
    const data = await response.json();
    console.log("Sales API Response:", data);

    if (!response.ok) {
      console.error("Sales API error:", data);
      throw new Error(data.error || "Failed to fetch sales data");
    }
    return data;
  },
});

const salesRecords = Array.isArray(salesData)
  ? salesData.filter((r: any) => {
      const matchesEntryType = r.entry_type?.toUpperCase() === "SALE";
      const matchesslip_no =
        !searchslip_no || (r.slip_no || "").toString().toLowerCase().includes(searchslip_no.toLowerCase());
      const matchesVehicleNo =
        !searchVehicleNo || (r.vehicle_no || "").toString().toLowerCase().includes(searchVehicleNo.toLowerCase());

      const recordDate = pickRecordDate(r, ["slip_date", "creation_date", "slip_in_time"]);
      const matchesDate = inDateRange(recordDate, fromDate, toDate);

      return matchesEntryType && matchesslip_no && matchesVehicleNo && matchesDate;
    })
  : [];



  // Fetch offline entries with branch + date filter
const {
  data: offlineData,
  refetch: refetchOffline,
  error: offlineError,
} = useQuery({
  queryKey: ["/api/purchases/offline", selectedBranch, fromDate, toDate], // 👈 include dates
  queryFn: async () => {
    let url =
      selectedBranch && selectedBranch !== "all"
        ? `/api/purchases/offline?branch_id=${selectedBranch}`
        : "/api/purchases/offline";

    // 👇 add date filters if available
    if (fromDate && toDate) {
      url += `&from=${fromDate}&to=${toDate}`;
    }

    console.log("Fetching offline data from URL:", url);
    const response = await fetch(url);
    const data = await response.json();
    console.log("Offline API response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch offline data");
    }
    return data;
  },
  refetchOnMount: true, // Always fetch fresh data
});

const offlineRecords = Array.isArray(offlineData)
  ? offlineData.filter((r: any) => {
      const matchesslip_no =
        !searchslip_no || (r.slip_no || "").toString().toLowerCase().includes(searchslip_no.toLowerCase());
      const matchesVehicleNo =
        !searchVehicleNo || (r.vehicle_no || "").toString().toLowerCase().includes(searchVehicleNo.toLowerCase());

      const recordDate = pickRecordDate(r, ["slip_date", "creation_date", "slip_in_time"]);
      const matchesDate = inDateRange(recordDate, fromDate, toDate);

      return matchesslip_no && matchesVehicleNo && matchesDate;
    })
  : [];


  // Refetch data when branch selection changes
  useEffect(() => {
    refetchPurchase();
    refetchSales();
    refetchOffline();
  }, [selectedBranch, refetchPurchase, refetchSales, refetchOffline]);

 const handleEdit = (wbId: number, entryType?: string) => {
  switch (entryType) {
    case "PURCHASE":
      setLocation(`/purchase-form?form=purchase&edit=${wbId}`);
      break;

    case "SALE":
      setLocation(`/sales-form?form=sales&edit=${wbId}`);
      break;

    case "SOLDNOTE":
      setLocation(`/sold-note?edit=${wbId}`);
      break;

    case "SALE_RETURN":
      setLocation(`/sales-return?form=salereturn&edit=${wbId}`);
      break;

    default:
      console.error("Unknown entry type:", entryType);
  }
};


 const handleOfflineEdit = (record: any) => {
  if (!record) return;

  const isOffline = record.offline_entry === "Yes";
  const modeParam = isOffline ? "offline" : "online";

  switch (record.entry_type?.toUpperCase()) {
    case "PURCHASE":
      setLocation(`/purchase-form?type=${modeParam}&edit=${record.wb_id}`);
      break;
    case "SALE":
      setLocation(`/sales-form?type=sales&edit=${record.wb_id}`);
      break;
    case "SALES_RETURN":
      setLocation(`/sales-return?type=${modeParam}&edit=${record.wb_id}`);
      break;
    case "SOLDNOTE":
      setLocation(`/sold-note?type=${modeParam}&edit=${record.wb_id}`);
      break;
    default:
      alert(`Unknown entry type: ${record.entry_type}`);
      break;
  }
};


// Fetch pending purchase offline entries with date filter
const {
  data: pendingPurchaseData,
  refetch: refetchPendingPurchase,
  error: pendingPurchaseError,
} = useQuery({
  queryKey: ["/api/purchases/offline", selectedBranch, fromDate, toDate], // 👈 include dates
  queryFn: async () => {
    let url =
      selectedBranch && selectedBranch !== "all"
        ? `/api/purchases/offline?branch_id=${selectedBranch}`
        : "/api/purchases/offline";

    // 👇 add date filters in API request
    if (fromDate && toDate) {
      url += `&from=${fromDate}&to=${toDate}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch pending purchase data");
    }

    // Filter only PURCHASE type offline entries
    return Array.isArray(data)
      ? data.filter((r) => r.entry_type?.toUpperCase() === "PURCHASE")
      : [];
  },
  refetchOnMount: true,
});
const pendingPurchaseRecords = Array.isArray(pendingPurchaseData)
  ? pendingPurchaseData.filter((r: any) => {
      const matchesslip_no =
        !searchslip_no || (r.slip_no || "").toString().toLowerCase().includes(searchslip_no.toLowerCase());
      const matchesVehicleNo =
        !searchVehicleNo || (r.vehicle_no || "").toString().toLowerCase().includes(searchVehicleNo.toLowerCase());

      const recordDate = pickRecordDate(r, ["slip_date", "creation_date", "slip_in_time"]);
      const matchesDate = inDateRange(recordDate, fromDate, toDate);

      return matchesslip_no && matchesVehicleNo && matchesDate;
    })
  : [];



// Fetch pending offline SALE entries
const {
  data: pendingSaleData,
  refetch: refetchPendingSale,
  error: pendingSaleError,
} = useQuery({
  queryKey: ["/api/purchases/offline", selectedBranch, fromDate, toDate], // ✅ same API
  queryFn: async () => {
    let url =
      selectedBranch && selectedBranch !== "all"
        ? `/api/purchases/offline?branch_id=${selectedBranch}`
        : "/api/purchases/offline";

    // 👇 add date filters
    if (fromDate && toDate) {
      url += `&from=${fromDate}&to=${toDate}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch offline records");
    }

    // ✅ Only SALE entries
    return Array.isArray(data)
      ? data.filter((r) => r.entry_type?.toUpperCase() === "SALE")
      : [];
  },
  refetchOnMount: true,
});

// Apply search + date filters (like salesRecords)
const pendingSaleRecords = Array.isArray(pendingSaleData)
  ? pendingSaleData.filter((r: any) => {
      const isPendingSale = r.entry_type?.toUpperCase() === "SALE" && !r.slip_out_time;

      const matchesslip_no =
        !searchslip_no || (r.slip_no || "").toString().toLowerCase().includes(searchslip_no.toLowerCase());
      const matchesVehicleNo =
        !searchVehicleNo || (r.vehicle_no || "").toString().toLowerCase().includes(searchVehicleNo.toLowerCase());

      const recordDate = pickRecordDate(r, ["slip_date", "creation_date", "slip_in_time"]);
      const matchesDate = inDateRange(recordDate, fromDate, toDate);

      return isPendingSale && matchesslip_no && matchesVehicleNo && matchesDate;
    })
  : [];


// Fetch Sold Note records with date filter
const {
  data: soldNoteData,
  refetch: refetchSoldNotes,
  error: soldNoteError,
} = useQuery({
  queryKey: ["/api/soldnote", selectedBranch, fromDate, toDate], // 👈 add dates in queryKey
  queryFn: async () => {
    let url =
      selectedBranch && selectedBranch !== "all"
        ? `/api/soldnote?branch_id=${selectedBranch}`
        : "/api/soldnote";

    // 👇 append date filters
    if (fromDate && toDate) {
      url += `&from=${fromDate}&to=${toDate}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch sold note records");
    }

    return Array.isArray(data) ? data : [];
  },
  refetchOnMount: true,
});


const soldNoteRecords = Array.isArray(soldNoteData)
  ? soldNoteData.filter((r: any) => {
      const recordDate = pickRecordDate(r, [
        "sold_date",
        "slip_date",
        "creation_date",
        "slip_in_time",
        "slip_out_time",
      ]);

      const matchesDate = inDateRange(recordDate, fromDate, toDate);

      console.log(
        "SOLD NOTE → Raw:",
        r.sold_date || r.slip_date || r.creation_date,
        "→ Parsed:", recordDate,
        "| From:", parseInputDate(fromDate),
        "| To:", parseInputDate(toDate)
      );

      return matchesDate;
    })
  : [];


const normalizeDateRange = (dateStr: string | null, isEnd: boolean = false): Date | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isEnd
    ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) // 👈 full day include
    : new Date(d.getFullYear(), d.getMonth(), d.getDate()); // 👈 start of day
};



// Fetch Sale Return records with date filter
const {
  data: saleReturnData,
  refetch: refetchSaleReturn,
  error: saleReturnError,
} = useQuery({
  queryKey: ["/api/sales-return", selectedBranch, fromDate, toDate], // 👈 add date filters in queryKey
  queryFn: async () => {
    let url =
      selectedBranch && selectedBranch !== "all"
        ? `/api/sales-return?branch_id=${selectedBranch}`
        : "/api/sales-return";

    // 👇 append from/to date filters
    if (fromDate && toDate) {
      url += `&from=${fromDate}&to=${toDate}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch sale return records");
    }

    return Array.isArray(data) ? data : [];
  },
  refetchOnMount: true,
});

// ✅ Sale Return filter
const saleReturnRecords = Array.isArray(saleReturnData)
  ? saleReturnData.filter((r: any) => {
      const rawDate = r.return_date || r.slip_date || r.creation_date;
      const recordDate = parseSlipDate(rawDate);

      const from = normalizeDateRange(fromDate);
      const to = normalizeDateRange(toDate, true);

      console.log(
        "SALE RETURN:",
        rawDate, "→", recordDate,
        "| From:", from,
        "| To:", to
      );

      const matchesDate =
        (!from || (recordDate && recordDate >= from)) &&
        (!to || (recordDate && recordDate <= to));

      return matchesDate;
    })
  : [];


const handlePrintRecord = async (record: any) => {
  try {
    console.log("Printing record:", record, "Active Tab:", activeTab);

    const entryType = record.entry_type?.toUpperCase();

    // ===== SALE =====
    if (entryType === "SALE") {
     const response = await fetch(`/api/sales/by-wbid/${record.wb_id}`);
if (!response.ok) throw new Error("Failed to fetch complete sale record");

const completeData = await response.json();
console.log("Complete sale record for print:", completeData);


      // Filter details if DO_WISE
      if (saleFilter === "DO_WISE") {
        completeData.details = completeData.details.filter(
          (row: any) => row.do_no && row.do_no !== ""
        );
      }

      // ===== Generate all sales reports =====
      const reports: string[] = [];

      if (completeData.master?.first_weight) {
        reports.push(generateSalesReportHTML(completeData, "first"));
      }
      if (completeData.master?.second_weight) {
        reports.push(generateSalesReportHTML(completeData, "second"));
      }

      // ===== Generate new report =====
      reports.push(generateNewReportHTML(completeData));

      // ===== Print all reports =====
      reports.forEach((reportHTML, index) => {
        const printWindow = window.open("", `_blank${index}`);
        if (!printWindow) return;
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.print();
      });

      return;
    }

   // ===== SALE RETURN =====
if (entryType === "SALE_RETURN") {
  const response = await fetch(`/api/sales-return/${record.wb_id}`);
  if (!response.ok) throw new Error("Failed to fetch complete sale return record");

  const completeData = await response.json();
  console.log("Complete sale return record for print:", completeData);

  // ✅ Pass correct API response
  const reportHTML = generateSaleReturnReportHTML({
    master: completeData.master,    // not masterData
    details: completeData.details,  // not salesData
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return alert("Please allow popups to print the report");

  printWindow.document.write(reportHTML);
  printWindow.document.close();
  printWindow.print();
  return;
}


    // ===== SOLDNOTE or PURCHASE =====
    const endpoint =
      entryType === "SOLDNOTE"
        ? `/api/soldnote/by-wbid/${record.wb_id}`
        : `/api/purchase/by-wbid/${record.wb_id}`;

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error("Failed to fetch record");

    const completeData = await res.json();

    const reportHTML =
      entryType === "SOLDNOTE"
        ? generateSoldNoteReportHTML(completeData)
        : generateDetailedReportHTML(
            completeData,
            purchaseFilter === "PENDING"
              ? `<div style="text-align:left; font-weight:bold; margin-bottom:-3px;">STATUS : OFFLINE</div>`
              : purchaseFilter === "VENDOR_WISE"
              ? `<div style="text-align:left; font-weight:bold; margin-bottom:-3px;">
                   Vendor: ${record.vendor_name || record.customer_name || "---"}
                 </div>`
              : ""
          );

    const printWindow = window.open("", "_blank");
    if (!printWindow) return alert("Please allow popups to print the report");

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();

  } catch (error) {
    console.error("Error printing record:", error);
    alert("Failed to generate print report");
  }
};

function formatDatetimeLocal(datetime: string | null) {
  if (!datetime) return "-";
  return new Date(datetime).toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Karachi"
  }).replace(",", "");
}

  // Function to format numbers with commas (Pakistani style)
  const formatFreightWithCommas = (value: string | number) => {
    if (!value) return "";

    const stringValue = value.toString();
    // Remove all non-digit characters except decimal point
    const cleanValue = stringValue.replace(/[^\d.]/g, "");

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

const generateSaleReturnReportHTML = (data: any) => {
  const record = {
    ...(data.master || {}),
    ...(data.details?.[0] || {}),  // details se pehla row merge
  };

  const currentDate = new Date()
  .toLocaleDateString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
  .toUpperCase()
  .replace(/\s/g, "-");

const currentTime = new Date()
  .toLocaleTimeString("en-GB", {
    timeZone: "Asia/Karachi",
    hour12: true,
  })
  .toUpperCase();

function formatPKTDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ""; // null / undefined / empty string ke liye blank

  const date = new Date(
    new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  if (isNaN(date.getTime())) return ""; // invalid date ke liye blank

  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC",
  ];
  const month = months[date.getMonth()];

  const time = date
    .toLocaleTimeString("en-GB", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .toUpperCase();

  return `${day}-${month}-${year} ${time}`;
}

    const currentUserName = user?.userName || "admin";

    // Process sales data from details
    const salesData = data.details || [];
    const nonEmptyRows = salesData.filter(
      (row: any) =>
        row.igp_no ||
        row.po_no ||
        row.customer_name ||
        row.vehicle_no ||
        row.item_desc ||
        row.igp_qty ||
        row.po_qty,
    );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
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
      margin-bottom: 6px;
    }
      .print-date {
   text-align: right;
    font-size: 12px;
     font-weight: bold;

     }

    .copy-label-right {
  text-align: right;
  font-weight: bold;
  margin-bottom: 4px;
}

.copy-label-left {
  text-align: left;
  font-weight: bold;
  margin-bottom: 8px;
}

    .info-table {
      border-collapse: collapse;
      width: 100%;
    }

    .info-table td {
      border-bottom: 1px solid black;
      padding: 0px 2px;
      font-size: 11px;
      line-height: 1;
    }

    .label-cell {
      width: 24%;
      font-weight: bold; /* bold label */
    }

    .value-cell {
      width: 37%;
      font-weight: bold; /* bold value */
    }

    .image-cell {
      width: 30%;
      border-left: 1px solid black;
      text-align: center;
    }

    .image-box-tall {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid black;
      overflow: hidden;
    }

    .image-box-tall img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }

    .center-box {
      border: 1px solid black;
      text-align: center;
      font-weight: bold;
      width: 100%;
      height: 100px;
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
      font-weight: bold;
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
.vehicle-no {
   font-weight: 900; /* extra bold */
}


  </style>
</head>

<body>

<div class="container">
 <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
  <div class="title">Shahzor  Feed  (Pvt) LTD</div>
  <div style="display: flex; justify-content: space-between;">
    <div class="copy-label-left">Sale Return</div>
    <div class="copy-label-right">Office Copy</div>
  </div>

  <div style="display: flex; justify-content: space-between; border: 1px solid black; border-left: 1px solid black;">
    <!-- LEFT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Slip No:</td>
        <td class="value-cell">${record.slip_no}</td>
        <td class="image-cell" rowspan="3">
          <div class="image-box-tall">
            <img src="/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type || 'SALES_RETURN'}.jpg"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" 
                 alt="First Weight Image" />
            <div style="display: none; font-size: 8px; color: #666;">No Img</div>
          </div>
        </td>
      </tr>
<tr>
  <td class="label-cell">Time In:</td>
  <td class="value-cell">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </td>
</tr>
<tr>
  <td class="label-cell">Time Out:</td>
  <td class="value-cell">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </td>
</tr>

    </table>

    <!-- CENTER -->
    <div class="center-wrapper" style="width: 33.33%; display: flex; align-items: center; justify-content: center;">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
         <span class="vehicle-no">
      ${record.vehicle_no}
    </span>
      </div>
    </div>

    <!-- RIGHT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Tare Weight:</td>
        <td class="value-cell">${record.second_weight}</td>
        <td class="image-cell" rowspan="3">
          <div class="image-box-tall">
            <img src="/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type || 'SALES_RETURN'}.jpg"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" 
                 alt="Second Weight Image" />
            <div style="display: none; font-size: 8px; color: #666;">No Img</div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="label-cell">Loaded Weight:</td>
        <td class="value-cell">${record.first_weight}</td>
      </tr>
      <tr>
        <td class="label-cell">Net Weight:</td>
        <td class="value-cell">${record.net_weight}</td>
      </tr>
    </table>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>SR #</th>
        <th>Party Name</th>
        <th>Feed #</th>
        <th>Feed Name</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${nonEmptyRows.map((row: any) => `
        <tr>
          <td>${row.igp_no || ""}</td>
          <td>${row.customer_name || ""}</td>
          <td>${row.item_code || ""}</td>
          <td>${row.item_desc || ""}</td>
          <td>${row.dc_qty || ""}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formatFreightWithCommas(record.freight || "0")}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc: number, row: any) => acc + (parseFloat(row.dc_qty) || 0), 0)}</div>
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
      <span class="signature-label">Checked By: </span>
      <span class="signature-line">
      <span class="signature-name">${currentUserName}</span>
      </span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>

  <hr class="dashed" />

  <!-- CUSTOMER COPY -->
   <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
  <div class="title">Shahzor  Feed  (Pvt) LTD</div>
  <div style="display: flex; justify-content: space-between;">
    <div class="copy-label-left">Sale Return</div>
    <div class="copy-label-right">Customer Copy</div>
  </div>

  <div style="display: flex; justify-content: space-between; border: 1px solid black; border-left: 1px solid black;">
    <!-- LEFT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Slip No:</td>
        <td class="value-cell">${record.slip_no}</td>
        
      </tr>
 <tr>
  <td class="label-cell">Time In:</td>
  <td class="value-cell">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </td>
</tr>
<tr>
  <td class="label-cell">Time Out:</td>
  <td class="value-cell">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </td>
</tr>


    </table>

    <!-- CENTER -->
    <div class="center-wrapper" style="width: 33.33%; display: flex; align-items: center; justify-content: center;">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
           <span class="vehicle-no">
      ${record.vehicle_no}
    </span>
      </div>
    </div>

    <!-- RIGHT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Tare Weight:</td>
        <td class="value-cell">${record.second_weight}</td>
       
      </tr>
      <tr>
        <td class="label-cell">Loaded Weight:</td>
        <td class="value-cell">${record.first_weight}</td>
      </tr>
      <tr>
        <td class="label-cell">Net Weight:</td>
        <td class="value-cell">${record.net_weight}</td>
      </tr>
    </table>
  </div>

  <table class="table">
    <thead>
      <tr>
        <th>SR #</th>
        <th>Party Name</th>
        <th>Feed #</th>
        <th>Feed Name</th>
        <th>Qty</th>
      </tr>
    </thead>
    <tbody>
      ${nonEmptyRows.map((row: any) => `
        <tr>
          <td>${row.igp_no || ""}</td>
          <td>${row.customer_name || ""}</td>
          <td>${row.item_code || ""}</td>
          <td>${row.item_desc || ""}</td>
          <td>${row.dc_qty || ""}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formatFreightWithCommas(record.freight || "0")}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc: number, row: any) => acc + (parseFloat(row.dc_qty) || 0), 0)}</div>
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
      <span class="signature-line">
      <span class="signature-name">${currentUserName}</span>
      </span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>
</div>

</body>
</html>
`;
      };


      

 const generateSalesReportHTML = (data: any, weightType: "first" | "second") => {
  const record = {
    ...(data.master || {}),
    ...(data.details?.[0] || {}),
  };

  const currentDate = new Date()
    .toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "2-digit", month: "short", year: "2-digit" })
    .toUpperCase().replace(/\s/g, "-");

  const currentTime = new Date()
    .toLocaleTimeString("en-GB", { timeZone: "Asia/Karachi", hour12: true })
    .toUpperCase();

  function formatPKTDateTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEPT","OCT","NOV","DEC"];
    const month = months[date.getMonth()];
    const time = date.toLocaleTimeString("en-GB", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }).toUpperCase();
    return `${day}-${month}-${year} ${time}`;
  }

  const currentUserName = user?.userName || "admin";

  const firstWeight = weightType === "first" ? record.first_weight : "";
  const secondWeight = weightType === "second" ? record.second_weight : "";
  const netWeight = weightType === "second" ? record.net_weight : "";

  const firstImg = weightType === "first"
    ? `/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type || 'sale'}.jpg`
    : "";

  const secondImg = weightType === "second"
    ? `/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type || 'sale'}.jpg`
    : "";

  const salesData = data.details || [];
  const nonEmptyRows = salesData.filter(
    (row: any) =>
      row.igp_no || row.po_no || row.customer_name || row.vehicle_no || row.item_desc || row.igp_qty || row.po_qty
  );

  const formatFreightWithCommas = (value: string | number) => {
    if (!value) return "";
    const stringValue = value.toString();
    const cleanValue = stringValue.replace(/[^\d.]/g, "");
    const parts = cleanValue.split(".");
    let integerPart = parts[0];
    const decimalPart = parts[1];
    if (integerPart.length > 3) {
      const rightPart = integerPart.slice(-3);
      let leftPart = integerPart.slice(0, -3);
      const leftPartFormatted = leftPart.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
      integerPart = leftPartFormatted + "," + rightPart;
    }
    return decimalPart !== undefined ? integerPart + "." + decimalPart : integerPart;
  };
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
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
      margin-bottom: 6px;
    }

    .copy-label {
      text-align: left;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .info-table {
      border-collapse: collapse;
      width: 100%;
    }

    .info-table td {
      border-bottom: 1px solid black;
      padding: 0px 2px;
      font-size: 11px;
      line-height: 1;
    }

    .label-cell {
      width: 24%;
      font-weight: bold; /* bold label */
    }
 .print-date {
   text-align: right;
    font-size: 12px;
     font-weight: bold;

     }

    .value-cell {
      width: 37%;
      font-weight: bold; /* bold value */
    }

    .image-cell {
      width: 30%;
      border-left: 1px solid black;
      text-align: center;
    }

    .image-box-tall {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid black;
      overflow: hidden;
    }

    .image-box-tall img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }

    .center-box {
      border: 1px solid black;
      text-align: center;
      font-weight: bold;
      width: 100%;
      height: 100px;
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
      font-weight: bold;
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

.vehicle-no {
   font-weight: 900; /* extra bold */
}

  </style>
</head>

<body>

<div class="container">
<div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
  <div class="title">Shahzor  Feed  (Pvt) LTD</div>
  <div class="copy-label">Office Copy</div>

  <div style="display: flex; justify-content: space-between; border: 1px solid black; border-left: 1px solid black;">
    <!-- LEFT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Slip No:</td>
        <td class="value-cell">${record.slip_no}</td>
        <td class="image-cell" rowspan="3">
          <div class="image-box-tall">
            <img src="/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type || 'sale'}.jpg"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" 
                 alt="First Weight Image" />
            <div style="display: none; font-size: 8px; color: #666;">No Img</div>
          </div>
        </td>
      </tr>
     <tr>
  <td class="label-cell">Time In:</td>
  <td class="value-cell">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </td>
</tr>
<tr>
  <td class="label-cell">Time Out:</td>
  <td class="value-cell">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </td>
</tr>

    </table>

    <!-- CENTER -->
    <div class="center-wrapper" style="width: 33.33%; display: flex; align-items: center; justify-content: center;">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
         <span class="vehicle-no">
      ${record.vehicle_no}
    </span>
      </div>
    </div>

    <!-- RIGHT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Tare Weight:</td>
        <td class="value-cell">${record.second_weight}</td>
        <td class="image-cell" rowspan="3">
          <div class="image-box-tall">
            <img src="/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type || 'sale'}.jpg"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" 
                 alt="Second Weight Image" />
            <div style="display: none; font-size: 8px; color: #666;">No Img</div>
          </div>
        </td>
      </tr>
      <tr>
        <td class="label-cell">Loaded Weight:</td>
        <td class="value-cell">${record.first_weight}</td>
      </tr>
      <tr>
        <td class="label-cell">Net Weight:</td>
        <td class="value-cell">${record.net_weight}</td>
      </tr>
    </table>
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
      ${nonEmptyRows.map((row: any) => `
        <tr>
          <td>${row.igp_no || ""}</td>
          <td>${row.po_no || ""}</td>
          <td>${row.customer_name || ""}</td>
          <td>${row.item_code || ""}</td>
          <td>${row.item_desc || ""}</td>
          <td>${row.igp_qty || ""}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formatFreightWithCommas(record.freight || "0")}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc: number, row: any) => acc + (parseFloat(row.igp_qty) || 0), 0)}</div>
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
      <span class="signature-line">
      <span class="signature-name">${currentUserName}</span>
      </span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>

  <hr class="dashed" />

  <!-- CUSTOMER COPY -->
  <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
  <div class="title">Shahzor  Feed  (Pvt) LTD</div>
  <div class="copy-label">Customer Copy</div>

  <div style="display: flex; justify-content: space-between; border: 1px solid black; border-left: 1px solid black;">
    <!-- LEFT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Slip No:</td>
        <td class="value-cell">${record.slip_no}</td>
       
      </tr>
    <tr>
  <td class="label-cell">Time In:</td>
  <td class="value-cell">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </td>
</tr>
<tr>
  <td class="label-cell">Time Out:</td>
  <td class="value-cell">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </td>
</tr>

    </table>

    <!-- CENTER -->
    <div class="center-wrapper" style="width: 33.33%; display: flex; align-items: center; justify-content: center;">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
          <span class="vehicle-no">
      ${record.vehicle_no}
    </span>
      </div>
    </div>

    <!-- RIGHT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Tare Weight:</td>
        <td class="value-cell">${record.second_weight}</td>
       
      </tr>
      <tr>
        <td class="label-cell">Loaded Weight:</td>
        <td class="value-cell">${record.first_weight}</td>
      </tr>
      <tr>
        <td class="label-cell">Net Weight:</td>
        <td class="value-cell">${record.net_weight}</td>
      </tr>
    </table>
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
      ${nonEmptyRows.map((row: any) => `
        <tr>
          <td>${row.igp_no || ""}</td>
          <td>${row.po_no || ""}</td>
          <td>${row.customer_name || ""}</td>
          <td>${row.item_code || ""}</td>
          <td>${row.item_desc || ""}</td>
          <td>${row.igp_qty || ""}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formatFreightWithCommas(record.freight || "0")}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc: number, row: any) => acc + (parseFloat(row.igp_qty) || 0), 0)}</div>
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
      <span class="signature-line">
       <span class="signature-name">${currentUserName}</span>
       </span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>
</div>

</body>
</html>
`;
      };

      // ⭐⭐⭐ NEW REPORT FUNCTION — paste your NEW HTML inside return
const generateNewReportHTML = (data : any) => {
  const record = {
    ...(data.master || {}),
    ...(data.details?.[0] || {}),
  };

  const currentDate = new Date()
    .toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "2-digit", month: "short", year: "2-digit" })
    .toUpperCase().replace(/\s/g, "-");

  const currentTime = new Date()
    .toLocaleTimeString("en-GB", { timeZone: "Asia/Karachi", hour12: true })
    .toUpperCase();

  function formatPKTDateTime(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    if (isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEPT","OCT","NOV","DEC"];
    const month = months[date.getMonth()];
    const time = date.toLocaleTimeString("en-GB", { hour12: true, hour: "2-digit", minute: "2-digit", second: "2-digit" }).toUpperCase();
    return `${day}-${month}-${year} ${time}`;
  }

  const currentUserName = user?.userName || "admin";

 const salesData = data.details || [];
  const nonEmptyRows = salesData.filter(
    (row: any) =>
      row.igp_no || row.po_no || row.customer_name || row.vehicle_no || row.item_desc || row.igp_qty || row.po_qty
  );

 return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
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
      margin-bottom: 6px;
    }

    .copy-label {
      text-align: left;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .info-table {
      border-collapse: collapse;
      width: 100%;
    }

    .info-table td {
      border-bottom: 1px solid black;
      padding: 0px 2px;
      font-size: 11px;
      line-height: 1;
    }

    .label-cell {
      width: 24%;
      font-weight: bold; /* bold label */
    }
 .print-date {
   text-align: right;
    font-size: 12px;
     font-weight: bold;

     }

    .value-cell {
      width: 37%;
      font-weight: bold; /* bold value */
    }

    .image-cell {
      width: 30%;
      border-left: 1px solid black;
      text-align: center;
    }

    .image-box-tall {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      border: 1px solid black;
      overflow: hidden;
    }

    .image-box-tall img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }

    .center-box {
      border: 1px solid black;
      text-align: center;
      font-weight: bold;
      width: 100%;
      height: 100px;
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
      font-weight: bold;
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

.vehicle-no {
   font-weight: 900; /* extra bold */
}

  </style>
</head>

<body>

<div class="container">
<div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
  <div class="title">Shahzor  Feed  (Pvt) LTD</div>
  <div class="title">Feeds Dispatch Order</div>
  <div class="copy-label">Office Copy</div>

  <div style="display: flex; justify-content: space-between; border: 1px solid black; border-left: 1px solid black;">
    <!-- LEFT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Slip No:</td>
        <td class="value-cell">${record.slip_no}</td>
        <td class="image-cell" rowspan="3">
          <div class="image-box-tall">
            <img src="/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type || 'sale'}.jpg"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" 
                 alt="First Weight Image" />
            <div style="display: none; font-size: 8px; color: #666;">No Img</div>
          </div>
        </td>
      </tr>
     <tr>
  <td class="label-cell">Time In:</td>
  <td class="value-cell">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </td>
</tr>
<tr>

</tr>

    </table>

    <!-- CENTER -->
    <div class="center-wrapper" style="width: 33.33%; display: flex; align-items: center; justify-content: center;">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
         <span class="vehicle-no">
      ${record.vehicle_no}
    </span>
      </div>
    </div>

    <!-- RIGHT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">First Weight:</td>
        <td class="value-cell">${record.first_weight}</td>
        <td class="image-cell" rowspan="3">
          <div class="image-box-tall">
            <img src="/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type || 'sale'}.jpg"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" 
                 alt="Second Weight Image" />
            <div style="display: none; font-size: 8px; color: #666;">No Img</div>
          </div>
        </td>
      </tr>
      
    </table>
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
      ${nonEmptyRows.map((row: any) => `
        <tr>
          <td>${row.igp_no || ""}</td>
          <td>${row.po_no || ""}</td>
          <td>${row.customer_name || ""}</td>
          <td>${row.item_code || ""}</td>
          <td>${row.item_desc || ""}</td>
          <td>${row.igp_qty || ""}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formatFreightWithCommas(record.freight || "0")}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc: number, row: any) => acc + (parseFloat(row.igp_qty) || 0), 0)}</div>
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
      <span class="signature-line">
      <span class="signature-name">${currentUserName}</span>
      </span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>

  <hr class="dashed" />

  <!-- CUSTOMER COPY -->
  <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
  <div class="title">Shahzor  Feed  (Pvt) LTD</div>
  <div class="copy-label">Customer Copy</div>

  <div style="display: flex; justify-content: space-between; border: 1px solid black; border-left: 1px solid black;">
    <!-- LEFT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">Slip No:</td>
        <td class="value-cell">${record.slip_no}</td>
       
      </tr>
    <tr>
  <td class="label-cell">Time In:</td>
  <td class="value-cell">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </td>
</tr>
<tr>
 
</tr>

    </table>

    <!-- CENTER -->
    <div class="center-wrapper" style="width: 33.33%; display: flex; align-items: center; justify-content: center;">
      <div class="center-box">
        <div class="truck-label">Truck #</div>
          <span class="vehicle-no">
      ${record.vehicle_no}
    </span>
      </div>
    </div>

    <!-- RIGHT SIDE TABLE -->
    <table class="info-table" style="width: 33.33%; border-right: 1px solid black;">
      <tr>
        <td class="label-cell">First Weight:</td>
        <td class="value-cell">${record.first_weight}</td>
       
      </tr>
     
    </table>
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
      ${nonEmptyRows.map((row: any) => `
        <tr>
          <td>${row.igp_no || ""}</td>
          <td>${row.po_no || ""}</td>
          <td>${row.customer_name || ""}</td>
          <td>${row.item_code || ""}</td>
          <td>${row.item_desc || ""}</td>
          <td>${row.igp_qty || ""}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Please Pay Freight RS: ${formatFreightWithCommas(record.freight || "0")}</div>
    <div>Grand Total: ${nonEmptyRows.reduce((acc: number, row: any) => acc + (parseFloat(row.igp_qty) || 0), 0)}</div>
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
      <span class="signature-line">
       <span class="signature-name">${currentUserName}</span>
       </span>
    </div>
    <div class="signature-block" style="text-align: right;">
      <span class="signature-label">Production Manager:</span>
      <span class="signature-line"></span>
    </div>
  </div>
</div>

</body>
</html>
`;
};



// reports.tsx me ya jahan aapke report functions hain
const generateSoldNoteReportHTML = (data: { master: any; details?: any[] }) => {
  // Merge master + first detail
  const record = {
    ...(data.master || {}),
    ...(data.details?.[0] || {}),
  };

   const currentDate = new Date()
  .toLocaleDateString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
  .toUpperCase()
  .replace(/\s/g, "-");

const currentTime = new Date()
  .toLocaleTimeString("en-GB", {
    timeZone: "Asia/Karachi",
    hour12: true,
  })
  .toUpperCase();

  function formatPKTDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ""; // null / undefined / empty string ke liye blank

  const date = new Date(
    new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  if (isNaN(date.getTime())) return ""; // invalid date ke liye blank

  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC",
  ];
  const month = months[date.getMonth()];

  const time = date
    .toLocaleTimeString("en-GB", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .toUpperCase();

  return `${day}-${month}-${year} ${time}`;
}

// Function to format numbers with commas (Pakistani style)
  const formatFreightWithCommas = (value: string | number) => {
    if (!value) return "";

    const stringValue = value.toString();
    // Remove all non-digit characters except decimal point
    const cleanValue = stringValue.replace(/[^\d.]/g, "");

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

    const calculateAvgWeight = () => {
      const netWeight = parseFloat(record.net_weight || "0");
      const quantity = parseInt(record.no_of_bags || "0");
      if (quantity === 0) return "0";
      return (netWeight / quantity).toFixed(2);
    };


  const currentUserName = "admin"; // ya phir user?.userName pass kar do

 
    return `
   <!DOCTYPE html>
  <html>
  <head>
    <title>Weighbridge Slip - ${record.slip_no}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; font-weight: 600; }
     .page-container {
  /* height: 140vh; */  /* Remove this */
  display: flex;
  flex-direction: column;
}

      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .copy-label { font-weight: bold; }
      .print-date { font-size: 10px; }

      .slip-section {
  border: 2px solid #000; 
  margin-bottom: 10px; 
  padding: 10px; 
  /* height: 155vh; */  /* Remove this */
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
         display: inline-block;
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
  body { font-size: 9px; }
  .fields div { gap: 2px; }
  .two-column { gap: 5px; }
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

        <div class="company-name">Shahzor  Feed </div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGHBRIDGE  SLIP</div>

        <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${record.igp_no || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div class="fields">
              <div><span class="label">W.B #</span><span class="value">${record.slip_no || ""}</span></div>
              <div><span class="label">Truck #</span><span class="value">${record.vehicle_no || ""}</span></div>
              <div><span class="label">Freight Payment</span><span class="value">${formatFreightWithCommas(record.freight || "")}</span></div>
            </div>
          </div>
          <div class="right-section">
            <div class="fields">
              <div><span class="label">Party:</span><span class="value">${record.vendor_name || record.customer_name || ""}</span></div>
         <div>
  <span class="label">Slip_in_time:</span>
  <span class="value">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </span>
</div>

<div>
  <span class="label">Slip_out_time:</span>
  <span class="value">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </span>
</div>

            </div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">COMMODITY</span><span class="value">${record.item_code ? record.item_code + " - " + (record.item_desc || "") : record.item_desc || ""}</span></div>
              <div><span class="label">QUANTITY</span><span class="value">${record.no_of_bags || ""}</span></div>
              <div><span class="label">BAG CONDITION</span><span class="value">${record.weight_per_bags || ""}</span></div>
              <div><span class="label">BAG TYPE</span><span class="value">${record.bardana_type || ""}</span></div>
              <div><span class="label">AVG. WEIGHT</span><span class="value">${calculateAvgWeight()}</span></div>
              <div><span class="label">REMARKS</span><span class="value">${record.remarks || ""}</span></div>
            </div>
            <div class="image-box">
              <img src="/captured_images/first_weight/slip_${record.slip_no}_${record.entryType || 'SOLDNOTE'}.jpg"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                   alt="First Weight Image" />
              <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
            </div>
          </div>

          <!-- Gross Weight Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">GROSS WEIGHT</span> ${record.first_weight || "0"}</div>
              <div><span class="label">TARE WEIGHT</span> ${record.second_weight || "0"}</div>
              <div><span class="label">WITH BARDANA WEIGHT</span> ${record.gross_weight || "0"}</div>
              <div><span class="label">BARDANA WEIGHT</span> ${record.bardana_weight || "0"}</div>
              <div><span class="label">QUALITY DEDUCTION</span> ${record.quality_deduction || "0"}</div>
              <div><span class="label">NET WEIGHT</span> ${record.net_weight || "0"}</div>
            </div>
            <div class="image-box">
              <img src="/captured_images/second_weight/slip_${record.slip_no}_${record.entryType || 'SOLDNOTE'}.jpg"
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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
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
               <div class="company-name">Shahzor  Feed </div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGHBRIDGE  SLIP</div>
              </div>
              <div class="header-right"></div>
            </div>
           <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${record.igp_no || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div class="fields">
              <div><span class="label">W.B #</span><span class="value">${record.slip_no || ""}</span></div>
              <div><span class="label">Truck #</span><span class="value">${record.vehicle_no || ""}</span></div>
              <div><span class="label">Freight Payment</span><span class="value">${formatFreightWithCommas(record.freight || "")}</span></div>
            </div>
          </div>
          <div class="right-section">
            <div class="fields">
              <div><span class="label">Party:</span><span class="value">${record.vendor_name || record.customer_name || ""}</span></div>
         <div>
  <span class="label">Slip_in_time:</span>
  <span class="value">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </span>
</div>

<div>
  <span class="label">Slip_out_time:</span>
  <span class="value">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </span>
</div>

            </div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">COMMODITY</span><span class="value">${record.item_code ? record.item_code + " - " + (record.item_desc || "") : record.item_desc || ""}</span></div>
              <div><span class="label">QUANTITY</span><span class="value">${record.no_of_bags || ""}</span></div>
              <div><span class="label">BAG CONDITION</span><span class="value">${record.weight_per_bags || ""}</span></div>
              <div><span class="label">BAG TYPE</span><span class="value">${record.bardana_type || ""}</span></div>
              <div><span class="label">AVG. WEIGHT</span><span class="value">${calculateAvgWeight()}</span></div>
              <div><span class="label">REMARKS</span><span class="value">${record.remarks || ""}</span></div>
            </div>
            <div class="image-box">
               <img src="/captured_images/first_weight/slip_${record.slip_no}_${record.entryType || 'SOLDNOTE'}.jpg"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                   alt="First Weight Image" />
              <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
            </div>
          </div>

          <!-- Gross Weight Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">GROSS WEIGHT</span> ${record.first_weight || "0"}</div>
              <div><span class="label">TARE WEIGHT</span> ${record.second_weight || "0"}</div>
              <div><span class="label">WITH BARDANA WEIGHT</span> ${record.gross_weight || "0"}</div>
              <div><span class="label">BARDANA WEIGHT</span> ${record.bardana_weight || "0"}</div>
              <div><span class="label">QUALITY DEDUCTION</span> ${record.quality_deduction || "0"}</div>
              <div><span class="label">NET WEIGHT</span> ${record.net_weight || "0"}</div>
            </div>
            <div class="image-box">
               <img src="/captured_images/second_weight/slip_${record.slip_no}_${record.entryType || 'SOLDNOTE'}.jpg"
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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
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
               <div class="company-name">Shahzor  Feed </div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGHBRIDGE  SLIP</div>
              </div>
        <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${record.igp_no || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div class="fields">
              <div><span class="label">W.B #</span><span class="value">${record.slip_no || ""}</span></div>


            </div>
          </div>
          <div class="right-section">
            <div class="fields">
              <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
            </div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">Party:</span><span class="value">${record.vendor_name || record.customer_name || ""}</span></div>
              <div><span class="label">COMMODITY</span><span class="value">${record.item_code ? record.item_code + " - " + (record.item_desc || "") : record.item_desc || ""}</span></div>
              <div><span class="label">Truck #</span><span class="value">${record.vehicle_no || ""}</span></div>
                <div><span class="label">Freight Payment</span><span class="value">${formatFreightWithCommas(record.freight || "")}</span></div>

            </div>
           
          </div>

          <!-- Gross Weight Section -->
          <div class="section-box">
            <div class="fields">
            <div><span class="label">QUANTITY</span><span class="value">${record.no_of_bags || ""}</span></div>
                  <div>
  <span class="label">NET WEIGHT</span>
  ${Math.min(Number(record.supplier_weight || 0), Number(record.net_weight || 0))}
</div>

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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
            <div class="signature-line"></div>
            <div>Checked By</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div>Production Manager</div>
          </div>
        </div>


      </div> <!-- .slip-section ends -->
    </div> <!-- .page-container ends -->
  </body>
  </html>`;
  };

  

 const generateDetailedReportHTML = (data: any, vendorHeaderHTML: string) => {
    // ✅ Merge master + details[0] into one object
    const record = {
      ...(data.master || {}),
      ...(data.details?.[0] || {}),
    };
  console.log("✅ Merged record for report:", record);

  const currentDate = new Date()
  .toLocaleDateString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
  .toUpperCase()
  .replace(/\s/g, "-");

const currentTime = new Date()
  .toLocaleTimeString("en-GB", {
    timeZone: "Asia/Karachi",
    hour12: true,
  })
  .toUpperCase();

  function formatPKTDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ""; // null / undefined / empty string ke liye blank

  const date = new Date(
    new Date(dateStr).toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  if (isNaN(date.getTime())) return ""; // invalid date ke liye blank

  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC",
  ];
  const month = months[date.getMonth()];

  const time = date
    .toLocaleTimeString("en-GB", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .toUpperCase();

  return `${day}-${month}-${year} ${time}`;
}

 // Function to format numbers with commas (Pakistani style)
  const formatFreightWithCommas = (value: string | number) => {
    if (!value) return "";

    const stringValue = value.toString();
    // Remove all non-digit characters except decimal point
    const cleanValue = stringValue.replace(/[^\d.]/g, "");

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

    

    const calculateAvgWeight = () => {
      const netWeight = parseFloat(record.net_weight || "0");
      const quantity = parseInt(record.no_of_bags || "0");
      if (quantity === 0) return "0";
      return (netWeight / quantity).toFixed(2);
    };

    // Get the actual logged-in user name from auth context
    const currentUserName = user?.userName || "admin";

    return `
   <!DOCTYPE html>
  <html>
  <head>
    <title>Weighbridge Slip - ${record.slip_no}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 10px; font-size: 10px; font-weight: 600; }
      .page-container {
  /* height: 140vh; */  /* Remove this */
  display: flex;
  flex-direction: column;
}

      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .copy-label { font-weight: bold; }
      .print-date { font-size: 10px; }

     .slip-section {
  border: 2px solid #000; 
  margin-bottom: 10px; 
  padding: 10px; 
  /* height: 155vh; */  /* Remove this */
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
         display: inline-block;
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
  body { font-size: 9px; }
  .fields div { gap: 2px; }
  .two-column { gap: 5px; }
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
        ${vendorHeaderHTML} <!-- vendor name yahan show hoga -->
        <div class="company-name">Shahzor  Feed </div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGHBRIDGE  SLIP</div>

        <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${record.igp_no || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div class="fields">
              <div><span class="label">W.B #</span><span class="value">${record.slip_no || ""}</span></div>
              <div><span class="label">Truck #</span><span class="value">${record.vehicle_no || ""}</span></div>
              <div><span class="label">Freight Payment</span><span class="value">${formatFreightWithCommas(record.freight || "")}</span></div>
            </div>
          </div>
          <div class="right-section">
            <div class="fields">
              <div><span class="label">Party:</span><span class="value">${record.vendor_name || record.customer_name || ""}</span></div>
         <div>
  <span class="label">Slip_in_time:</span>
  <span class="value">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </span>
</div>

<div>
  <span class="label">Slip_out_time:</span>
  <span class="value">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </span>
</div>


            </div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">COMMODITY</span><span class="value">${record.item_code ? record.item_code + " - " + (record.item_desc || "") : record.item_desc || ""}</span></div>
              <div><span class="label">QUANTITY</span><span class="value">${record.no_of_bags || ""}</span></div>
              <div><span class="label">BAG CONDITION</span><span class="value">${record.weight_per_bags || ""}</span></div>
              <div><span class="label">BAG TYPE</span><span class="value">${record.bardana_type || ""}</span></div>
              <div><span class="label">AVG. WEIGHT</span><span class="value">${calculateAvgWeight()}</span></div>
              <div><span class="label">REMARKS</span><span class="value">${record.remarks || ""}</span></div>
            </div>
            <div class="image-box">
              <img src="/captured_images/first_weight/slip_${record.slip_no}_${record.entryType || 'purchase'}.jpg"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                   alt="First Weight Image" />
              <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
            </div>
          </div>

          <!-- Gross Weight Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">GROSS WEIGHT</span> ${record.first_weight || "0"}</div>
              <div><span class="label">TARE WEIGHT</span> ${record.second_weight || "0"}</div>
              <div><span class="label">WITH BARDANA WEIGHT</span> ${record.gross_weight || "0"}</div>
              <div><span class="label">BARDANA WEIGHT</span> ${record.bardana_weight || "0"}</div>
              <div><span class="label">QUALITY DEDUCTION</span> ${record.quality_deduction || "0"}</div>
              <div><span class="label">NET WEIGHT</span> ${record.net_weight || "0"}</div>
            </div>
            <div class="image-box">
              <img src="/captured_images/second_weight/slip_${record.slip_no}_${record.entryType || 'purchase'}.jpg"
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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
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
               <div class="company-name">Shahzor  Feed </div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGHBRIDGE  SLIP</div>
              </div>
              <div class="header-right"></div>
            </div>
           <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${record.igp_no || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div class="fields">
              <div><span class="label">W.B #</span><span class="value">${record.slip_no || ""}</span></div>
              <div><span class="label">Truck #</span><span class="value">${record.vehicle_no || ""}</span></div>
              <div><span class="label">Freight Payment</span><span class="value">${formatFreightWithCommas(record.freight || "")}</span></div>
            </div>
          </div>
          <div class="right-section">
            <div class="fields">
              <div><span class="label">Party:</span><span class="value">${record.vendor_name || record.customer_name || ""}</span></div>
             <div>
  <span class="label">Slip_in_time:</span>
  <span class="value">
    ${record.slip_in_time ? formatPKTDateTime(record.slip_in_time) : "-"}
  </span>
</div>

<div>
  <span class="label">Slip_out_time:</span>
  <span class="value">
    ${record.slip_out_time ? formatPKTDateTime(record.slip_out_time) : "-"}
  </span>
</div>

            </div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">COMMODITY</span><span class="value">${record.item_code ? record.item_code + " - " + (record.item_desc || "") : record.item_desc || ""}</span></div>
              <div><span class="label">QUANTITY</span><span class="value">${record.no_of_bags || ""}</span></div>
              <div><span class="label">BAG CONDITION</span><span class="value">${record.weight_per_bags || ""}</span></div>
              <div><span class="label">BAG TYPE</span><span class="value">${record.bardana_type || ""}</span></div>
              <div><span class="label">AVG. WEIGHT</span><span class="value">${calculateAvgWeight()}</span></div>
              <div><span class="label">REMARKS</span><span class="value">${record.remarks || ""}</span></div>
            </div>
            <div class="image-box">
               <img src="/captured_images/first_weight/slip_${record.slip_no}_${record.entryType || 'purchase'}.jpg"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                   alt="First Weight Image" />
              <div style="display: none; color: #666; font-size: 10px;">No Image Available</div>
            </div>
          </div>

          <!-- Gross Weight Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">GROSS WEIGHT</span> ${record.first_weight || "0"}</div>
              <div><span class="label">TARE WEIGHT</span> ${record.second_weight || "0"}</div>
              <div><span class="label">WITH BARDANA WEIGHT</span> ${record.gross_weight || "0"}</div>
              <div><span class="label">BARDANA WEIGHT</span> ${record.bardana_weight || "0"}</div>
              <div><span class="label">QUALITY DEDUCTION</span> ${record.quality_deduction || "0"}</div>
              <div><span class="label">NET WEIGHT</span> ${record.net_weight || "0"}</div>
            </div>
            <div class="image-box">
               <img src="/captured_images/second_weight/slip_${record.slip_no}_${record.entryType || 'purchase'}.jpg"
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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
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
               <div class="company-name">Shahzor  Feed </div>
        <div style="height: 10px;"></div>
        <div class="slip-title">WEIGHBRIDGE  SLIP</div>
              </div>
        <div><b>IGP #</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span class="value">${record.igp_no || ""}</span></div>

        <div class="two-column">
          <div class="left-section">
            <div class="fields">
              <div><span class="label">W.B #</span><span class="value">${record.slip_no || ""}</span></div>


            </div>
          </div>
          <div class="right-section">
            <div class="fields">
              <div class="print-date">Print Date: ${currentDate} ${currentTime}</div>
            </div>
          </div>
        </div>

        <!-- Commodity + Gross Weight Section in One Row -->
        <div class="commodity-gross-row">
          <!-- Commodity Section -->
          <div class="section-box">
            <div class="fields">
              <div><span class="label">Party:</span><span class="value">${record.vendor_name || record.customer_name || ""}</span></div>
              <div><span class="label">COMMODITY</span><span class="value">${record.item_code ? record.item_code + " - " + (record.item_desc || "") : record.item_desc || ""}</span></div>
              <div><span class="label">Truck #</span><span class="value">${record.vehicle_no || ""}</span></div>
                <div><span class="label">Freight Payment</span><span class="value">${formatFreightWithCommas(record.freight || "")}</span></div>

            </div>
          
          </div>

          <!-- Gross Weight Section -->
          <div class="section-box">
            <div class="fields">
            <div><span class="label">QUANTITY</span><span class="value">${record.no_of_bags || ""}</span></div>
                  <div>
  <span class="label">NET WEIGHT</span>
  ${Math.min(Number(record.supplier_weight || 0), Number(record.net_weight || 0))}
</div>

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
           <div style="font-size: 10px; margin-bottom: 2px;">${currentUserName}</div>
            <div class="signature-line"></div>
            <div>Checked By</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div>Production Manager</div>
          </div>
        </div>


      </div> <!-- .slip-section ends -->
    </div> <!-- .page-container ends -->
  </body>
  </html>`;
  };


 const isRecordOffline = (record: any, tab: string): boolean => {
  // If we are in Offline tab, everything is offline
  if (tab === "offline") return true;

  // Otherwise, check offline/online flags
  return (
    record.offline_entry === "Yes" ||
    record.offline_entry === "YES" ||
    record.offline_entry === "yes" ||
    record.offline_entry === true ||
    record.offline_entry === "true" ||
    record.offline_entry === 1 ||
    record.online_entry === "No" ||
    record.online_entry === "NO" ||
    record.online_entry === false ||
    record.online_entry === "0"
  );
};

// Updated handlePrintTabReport
const handlePrintTabReport = () => {
  const tabRecordsMap: { [key: string]: any[] } = {
    purchase: purchaseRecords, 
    sale: salesRecords,  
    soldnote: soldNoteRecords,
    salereturn: saleReturnRecords,
    offline: offlineRecords,
  };

  const recordsToPrint = tabRecordsMap[activeTab] || [];
  if (recordsToPrint.length === 0) {
    alert("No records to print for this tab.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  let html = `
    <html>
      <head>
        <title>${activeTab.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h2 { text-align: center; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px; }
          th, td { border: 1px solid black; padding: 5px; text-align: left; }
          th { background-color: #f0f0f0; }
          img { width: 50px; height: 40px; object-fit: cover; }
        </style>
      </head>
      <body>
        <h1 style="text-align:center">${activeTab.toUpperCase()} Combined Report</h1>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <h2>${activeTab.toUpperCase()} Records</h2>
        <table>
          <thead>
            <tr>
              <th>Slip No</th>
              <th>Vehicle In Time</th>
              <th>Vehicle Out Time</th>
              <th>Entry Type</th>
              <th>Vehicle No</th>
              <th>Customer</th>
              <th>Status</th>
              <th>First Weight Image</th>
              <th>Second Weight Image</th>
            </tr>
          </thead>
          <tbody>
  `;

  recordsToPrint.forEach(r => {
    const slipIn = r.slip_in_time ? new Date(r.slip_in_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "---";
    const slipOut = r.slip_out_time ? new Date(r.slip_out_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "---";
    const customer = r.vendor_name || r.customer_name || "---";

 const statusHTML = tabRecordsMap[activeTab] === offlineRecords
  ? `<div style="font-weight:bold; color:red;">Offline</div>` // Force offline for Offline tab
  : isRecordOffline(r, activeTab)
    ? `<div style="font-weight:bold; color:red;">Offline</div>`
    : `<div style="font-weight:bold; color:green;">Online</div>`;




    html += `
      <tr>
        <td>${r.slip_no}</td>
        <td>${slipIn}</td>
        <td>${slipOut}</td>
        <td>${r.entry_type || "---"}</td>
        <td>${r.vehicle_no || "---"}</td>
        <td>${customer}</td>
        <td>${statusHTML}</td>
        <td>${r.first_weight_image ? `<img src="${r.first_weight_image}" />` : "No Image"}</td>
        <td>${r.second_weight_image ? `<img src="${r.second_weight_image}" />` : "No Image"}</td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.print();
};


useEffect(() => {
  if (!fromDate) {
    const today = new Date();
    setFromDate(today.toISOString().split("T")[0]); // yyyy-mm-dd
  }
}, []); // empty dependency array => sirf component mount par run hoga


useEffect(() => {
  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd format
  if (!fromDate) setFromDate(today);
  if (!toDate) setToDate(today);
}, []);




// Report page main yeh function add karein
// Report page main yeh function add karein
const handleReload = async (wbId: any, record: PurchaseRecord) => {
  try {
    // ✅ Check if entry is online - Case insensitive check
    const isOnline = record.online_entry && 
                    record.online_entry.toString().toUpperCase() === 'YES';
    
    if (!isOnline) {
      alert(`⚠️ This record is not online. Only online records can be reloaded.\n\nCurrent Status: ${record.online_entry || 'Not specified'}\nWB ID: ${wbId}`);
      return;
    }
    
    console.log(`🔄 Reloading ONLINE record ${wbId}...`);
    console.log(`📊 Online Entry Status: ${record.online_entry}`);
    
    // Determine entry type from record
    const entryType = record.entry_type || 'PURCHASE'; // Default to PURCHASE
    
    // Fetch data using common function
    const dbData = await fetchDataForIGP(wbId, entryType);
    
    if (!dbData) {
      throw new Error(`${entryType} record ${wbId} not found in database`);
    }

    console.log(`📥 ${entryType} data fetched for reload:`, dbData);
    
    // ✅ Use the correct API endpoint based on entry type
    let apiEndpoint = '';
    switch (entryType) {
      case 'PURCHASE':
        apiEndpoint = "http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/wb-update-on-igp";
        break;
      case 'SALE':
        apiEndpoint = "http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/wb-update-on-igp"; 
        break;
      case 'SALE_RETURN':
        apiEndpoint = "http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/wb-update-on-igp"; 
        break;
      case 'SOLDNOTE':
        apiEndpoint = "http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/wb-update-on-igp"; 
        break;
      default:
        apiEndpoint = "http://portal.sabirsgroup.com:8184/ords/sabroso_ords/webridge_igp/wb-update-on-igp";
    }
    
    console.log(`📤 Sending ${entryType} data to IGP API: ${apiEndpoint}`);
    
    // ✅ NEW: Beautiful JSON payload print in console
    console.log(`📦 PAYLOAD being sent to IGP API:`);
    console.log(JSON.stringify({
      metadata: {
        entryType: entryType,
        wbId: wbId,
        onlineStatus: record.online_entry,
        apiEndpoint: apiEndpoint,
        timestamp: new Date().toISOString()
      },
      payload: dbData
    }, null, 2));
    
    // ✅ NEW: Also print in table format for better readability
    console.log(`📊 PAYLOAD Summary Table:`);
    console.table({
      'Entry Type': entryType,
      'WB ID': wbId,
      'Online Status': record.online_entry,
      'Master Fields Count': dbData.master ? Object.keys(dbData.master).length : 0,
      'Details Count': dbData.details ? dbData.details.length : 0,
      'API Endpoint': apiEndpoint
    });
    
    // ✅ NEW: Show key fields being sent
    if (dbData.master) {
      console.log(`🔑 Key Master Fields:`);
      Object.entries(dbData.master).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    if (dbData.details && dbData.details.length > 0) {
      console.log(`📋 First Detail Item:`);
      console.table(dbData.details[0]);
    }
    
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dbData),
    });
    
    const text = await response.text();
    
    // ✅ NEW: Print response details beautifully
    console.log(`📡 ${entryType} API Response Details:`);
    console.groupCollapsed(`Response Status: ${response.status} ${response.statusText}`);
    console.log(`Response Headers:`, Object.fromEntries([...response.headers]));
    console.log(`Response Body (first 1000 chars):`);
    console.log(text.substring(0, 1000));
    
    if (text.length > 1000) {
      console.log(`... (${text.length - 1000} more characters)`);
    }
    console.groupEnd();
    
    console.log(`📄 Full Response (formatted if JSON):`);
    try {
      // Try to parse as JSON for better display
      const jsonResponse = JSON.parse(text);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch {
      // If not JSON, show raw text
      console.log(text);
    }
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(text);
        console.log(`✅ ${entryType} reloaded successfully:`, jsonData);
        alert(`✅ ${entryType} record ${wbId} successfully reloaded!`);
      } catch {
        alert(`✅ ${entryType} record ${wbId} successfully reloaded!`);
      }
    } else {
      let errorMsg = `HTTP Error ${response.status}`;
      if (text.includes("ORA-")) {
        const oraMatch = text.match(/ORA-\d+:[\s\S]*?(?=<br>|<\/)/i);
        errorMsg = oraMatch ? oraMatch[0].substring(0, 200) : "Oracle database error";
        
        // ✅ NEW: Print Oracle error details
        console.error(`🛑 Oracle Database Error:`);
        console.error(`Error Code: ${oraMatch ? oraMatch[0].substring(0, 9) : 'Unknown'}`);
        console.error(`Error Message: ${errorMsg}`);
      }
      
      console.error(`❌ API Error Response:`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Response: ${text}`);
      
      alert(`❌ ${entryType} reload failed: ${errorMsg}`);
    }
    
  } catch (error) {
    console.error(`🛑 ${record.entry_type || 'Record'} reload error:`, error);
    console.error(`Stack trace:`, error.stack);
    alert(`❌ Failed to reload record ${wbId}:\n\n${error.message}`);
  }
};

const fetchDataForIGP = async (wbId: any, entryType: string) => {
  try {
    console.log(`🔍 Fetching ${entryType} data for IGP API, wbId:`, wbId);
    
    let apiEndpoint = '';
    
    // Determine API endpoint based on entry type
    switch (entryType) {
      case 'PURCHASE':
        apiEndpoint = `/api/purchase/by-wbid/${wbId}`;
        break;
      case 'SALE':
        apiEndpoint = `/api/sales/by-wbid/${wbId}`;
        break;
      case 'SALE_RETURN':
        apiEndpoint = `/api/sales-return/${wbId}`;
        break;
      case 'SOLDNOTE':
        apiEndpoint = `/api/soldnote/by-wbid/${wbId}`;
        break;
      default:
        console.error(`❌ Unknown entry type: ${entryType}`);
        return null;
    }
    
    console.log(`🌐 Calling API: ${apiEndpoint}`);
    
    const response = await fetch(apiEndpoint);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${entryType} data: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Raw ${entryType} data from DB:`, data);

    // ✅ DIRECT FROM DB - NO MODIFICATIONS
    // Return exactly what we get from database
    return {
      ...data,
      _entryType: entryType, // Add entry type for reference
      _apiEndpoint: apiEndpoint // Add endpoint for debugging
    };

  } catch (error) {
    console.error(`❌ Error fetching ${entryType} data:`, error);
    return null;
  }
};




  return (
    <div className="p-2 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4 text-black">Reports</h1>
{/* Filters + Search Section */}
<div className="mb-6 grid grid-cols-2 gap-2 items-start">
  {/* Left Column: Company + Branch + Dates */}
  <div className="flex flex-col gap-2">
    {/* Company Selection */}
    <div className="flex items-center gap-2">
      <label className="w-20 text-sm font-medium text-black">
        Company:
      </label>
      <Select
        value={selectedBranch}
        onValueChange={setSelectedBranch}
      >
        <SelectTrigger className="w-40 border-black text-black">
          <SelectValue placeholder="Select Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-black">
            All Branches
          </SelectItem>
          {branches.map((branch) => (
            <SelectItem
              key={branch.branch_id}
              value={branch.branch_id.toString()}
              className="text-black"
            >
              {branch.branch_name}
            </SelectItem>
          ))}
        </SelectContent>
        
      </Select>
      {/* From Date */}
       <label className="w-20 text-sm font-medium text-black">From:</label>
    <input
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
      className="border border-black rounded px-2 py-1 text-black"
    />
    </div>

    {/* Branch Selection */}
    <div className="flex items-center gap-2">
      <label className="w-20 text-sm font-medium text-black">
        Branch:
      </label>
      <Select
        value={selectedBranch}
        onValueChange={setSelectedBranch}
      >
        <SelectTrigger className="w-40 border-black text-black">
          <SelectValue placeholder="Select Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-black">
            All Branches
          </SelectItem>
          {branches.map((branch) => (
            <SelectItem
              key={branch.branch_id}
              value={branch.branch_id.toString()}
              className="text-black"
            >
              {branch.branch_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {/* To Date */}
       <label className="w-20 text-sm font-medium text-black">To:</label>
    <input
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
      className="border border-black rounded px-2 py-1 text-black"
    />

       {/* Filter Button
  <button
    onClick={() => {
      refetchPurchase();
      refetchSales();
      refetchOffline();
      refetchPendingPurchase();
      refetchPendingSale();
      refetchSoldNotes();
      refetchSaleReturn();
    }}
    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
  >
    Apply Filter
  </button> */}
    </div>

    </div>
  {/* Right Column: Search + Purchase Section */}
  <div className="flex flex-col gap-2">
    {/* Search Section */}
    <div className="flex justify-end">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-black">Search:</label>
        <Input
          placeholder="Search by Slip No."
          value={searchslip_no}
          onChange={(e) => setSearchslip_no(e.target.value)}
          className="w-40 border-black text-black"
        />
        <Input
          placeholder="Search by Vehicle No."
          value={searchVehicleNo}
          onChange={(e) => setSearchVehicleNo(e.target.value)}
          className="w-40 border-black text-black"
        />
        <Button
          onClick={() => {
            setSearchslip_no("");
            setSearchVehicleNo("");
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white"
        >
          Clear Search
        </Button>
      </div>
    </div>
  </div>
</div>
</div>

     <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="grid w-full grid-cols-5 gap-1">
  {/* Purchase Tab */}
  <TabsTrigger
    value="purchase"
    className="border-2 border-black rounded-none data-[state=active]:bg-blue-200 flex justify-center items-center text-sm"
  >
    <select
      value={purchaseFilter}
      onChange={(e) => setPurchaseFilter(e.target.value)}
      className="border-none bg-transparent text-black text-center w-auto max-w-[120px]"
    >
      <option value="PURCHASE">Purchase</option>
      <option value="VENDOR_WISE">Vendor Wise Purchase</option>
      <option value="PENDING">Pending Purchase</option>
      <option value="UNLOAD">Unloaded</option>
      <option value="ACCUMULATED_UNLOADED">Accumulated Unloaded</option>
    </select>
  </TabsTrigger>

  {/* Sale Tab */}
  <TabsTrigger
    value="sale"
    className="border-2 border-black rounded-none data-[state=active]:bg-blue-200 flex justify-center items-center text-sm"
  >
    <select
      value={saleFilter}
      onChange={(e) => setSaleFilter(e.target.value)}
      className="border-none bg-transparent text-black text-center w-auto max-w-[120px]"
    >
      <option value="SALE">Sale</option>
      <option value="DO_WISE">DO Wise</option>
      <option value="PENDING">Pending Sale</option>
      <option value="FINAL">Final</option>
    </select>
  </TabsTrigger>

  {/* Sold Note Tab */}
  <TabsTrigger
    value="soldnote"
    className="border-2 border-black rounded-none data-[state=active]:bg-blue-200 flex justify-center items-center text-sm"
  >
    Sold Note
  </TabsTrigger>

  {/* Sale Return Tab */}
  <TabsTrigger
    value="salereturn"
    className="border-2 border-black rounded-none data-[state=active]:bg-blue-200 flex justify-center items-center text-sm"
  >
    Sale Return
  </TabsTrigger>

  {/* Offline Tab */}
  <TabsTrigger
    value="offline"
    className="border-2 border-black rounded-none data-[state=active]:bg-blue-200 flex justify-center items-center text-sm"
  >
    Offline
  </TabsTrigger>
</TabsList>


{/* Purchase Tab */}
<TabsContent value="purchase" className="space-y-4">
  <div className="bg-white rounded-lg shadow border-2 border-black">
    <div className="p-4 border-b-2 border-black flex justify-between items-center">
      <h2 className="text-lg font-semibold text-black">
        {purchaseFilter === "VENDOR_WISE"
          ? "Vendor Wise Purchase Entries"
          : purchaseFilter === "PENDING"
          ? "Pending Purchase Entries"
          : "Purchase Entries"}
      </h2>
{/* <Button
  size="sm"
  className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 focus:ring-0 focus:outline-none border-none shadow-none"
  onClick={handlePrintTabReport}
>
  Print Combined Report
</Button> */}


    </div>

    <div className="overflow-x-auto">
      {(() => {
        const displayedPurchaseRecords =
          purchaseFilter === "PENDING"
            ? (offlineRecords || [])
                .filter((r) => r.entry_type?.toUpperCase() === "PURCHASE")
                .map((r) => ({ ...r, offline_entry: true }))
            : purchaseRecords || [];

        // ✅ Debugging logs
        console.log("Displayed Purchase Records:", displayedPurchaseRecords);

        return (
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50">
  <tr>
    <th className="px-4 py-2 text-left border border-black text-black">Slip No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Slip In Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Slip Out Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Entry Type</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vendor</th>
    <th className="px-4 py-2 text-left border border-black text-black">Status</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Actions</th>
  </tr>
</thead>
<tbody>
  {displayedPurchaseRecords.map((record: PurchaseRecord) => (
    <tr key={record.wb_id} className="hover:bg-gray-50">
      <td className="px-4 py-2 border border-black text-black">{record.slip_no}</td>
      <td className="px-4 py-2 border border-black text-black">
        {record.slip_in_time
          ? new Date(record.slip_in_time).toLocaleTimeString("en-GB", {
              hour12: true,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "Asia/Karachi",
            })
          : "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">
        {record.slip_out_time
          ? new Date(record.slip_out_time).toLocaleTimeString("en-GB", {
              hour12: true,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "Asia/Karachi",
            })
          : "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">{record.entry_type || "PURCHASE"}</td>
      <td className="px-4 py-2 border border-black text-black">{record.vehicle_no || "---"}</td>
      <td className="px-4 py-2 border border-black text-black">{record.vendor_name || "---"}</td>
      <td className="px-4 py-2 border border-black text-black">
        {record.offline_entry ? (
          <span className="text-red-600 font-semibold">Offline</span>
        ) : (
          <span className="text-green-600 font-semibold">Online</span>
        )}
      </td>

      {/* ✅ First Weight */}
      <td className="px-4 py-2 border border-black text-center">
        <span className="text-black font-semibold">{record.first_weight ?? "---"}</span>
      </td>

      {/* First Weight Image */}
      <td className="px-4 py-2 border border-black text-center">
        <img
          src={`/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
          alt="First Weight"
          className="w-16 h-12 object-contain mx-auto cursor-pointer"
          onClick={() =>
            window.open(`/captured_images/first_weight/slip_${record.slip_no}.jpg`, "_blank")
          }
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      </td>

      {/* ✅ Second Weight */}
      <td className="px-4 py-2 border border-black text-center">
        <span className="text-black font-semibold">{record.second_weight ?? "---"}</span>
      </td>

      {/* Second Weight Image */}
      <td className="px-4 py-2 border border-black text-center">
        <img
          src={`/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
          alt="Second Weight"
          className="w-16 h-12 object-contain mx-auto cursor-pointer"
          onClick={() =>
            window.open(`/captured_images/second_weight/slip_${record.slip_no}.jpg`, "_blank")
          }
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      </td>

<td className="px-4 py-2 border border-black">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      className="border-black text-black hover:bg-gray-100"
      onClick={() => handleEdit(record.wb_id, "PURCHASE")}
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

    <Button
  size="sm"
  variant="outline"
  disabled={reloadingId === record.wb_id}
  className={`border-black text-black hover:bg-gray-100 ${
    reloadingId === record.wb_id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  onClick={async () => {
    setReloadingId(record.wb_id);
    try {
      await handleReload(record.wb_id, record);
    } catch (error) {
      console.error("Reload failed:", error);
    } finally {
      setReloadingId(null);
    }
  }}
>
  {reloadingId === record.wb_id ? 'Reloading...' : 'Reload'}
</Button>
  </div>
</td>


    </tr>
  ))}
</tbody>

          </table>
        );
      })()}

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


{/* Sold Note Tab */}
<TabsContent value="soldnote" className="space-y-4">
  <div className="bg-white rounded-lg shadow border-2 border-black">
    <div className="p-4 border-b-2 border-black flex justify-between items-center">
      <h2 className="text-lg font-semibold text-black">Sold Note Entries</h2>
      {/* <Button
  size="sm"
  className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 focus:ring-0 focus:outline-none border-none shadow-none"
  onClick={handlePrintTabReport}
>
  Print Combined Report
</Button> */}
    </div>

    <div className="overflow-x-auto">
      {(() => {
        // ✅ Filter Sold Note records based on search inputs
        const filteredSoldNoteRecords = (soldNoteRecords || []).filter(record => {
          const slipMatch = record.slip_no?.toLowerCase().includes(searchslip_no.toLowerCase());
          const vehicleMatch = record.vehicle_no?.toLowerCase().includes(searchVehicleNo.toLowerCase());
          return slipMatch && vehicleMatch;
        });

        return (
          <table className="w-full text-sm border-collapse">
           <thead className="bg-gray-50">
  <tr>
    <th className="px-4 py-2 text-left border border-black text-black">Slip No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle In Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle Out Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Entry Type</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Customer</th>
    <th className="px-4 py-2 text-left border border-black text-black">Status</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Actions</th>
  </tr>
</thead>
<tbody>
  {filteredSoldNoteRecords.map((record: any) => (
    <tr key={record.wb_id} className="hover:bg-gray-50">
      <td className="px-4 py-2 border border-black text-black">{record.slip_no}</td>
      <td className="px-4 py-2 border border-black text-black">
        {record.slip_in_time && record.slip_in_time !== "null" && record.slip_in_time !== ""
          ? new Date(record.slip_in_time).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
              timeZone: "Asia/Karachi",
            })
          : "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">
        {record.slip_out_time && record.slip_out_time !== "null" && record.slip_out_time !== ""
          ? new Date(record.slip_out_time).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
              timeZone: "Asia/Karachi",
            })
          : "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">{record.entry_type || "SOLDNOTE"}</td>
      <td className="px-4 py-2 border border-black text-black">{record.vehicle_no || "---"}</td>
      <td className="px-4 py-2 border border-black text-black">{record.customer_name || "---"}</td>
      <td className="px-4 py-2 border border-black text-black">
        {record.offline_entry === "Yes" ? (
          <span className="text-red-600 font-semibold">Offline</span>
        ) : (
          <span className="text-green-600 font-semibold">Online</span>
        )}
      </td>

      {/* ✅ First Weight Value */}
      <td className="px-4 py-2 border border-black text-center">
        <span className="text-black font-semibold">{record.first_weight ?? "---"} </span>
      </td>

      {/* First Weight Image */}
      <td className="px-4 py-2 border border-black text-center">
        <img
          src={`/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
          alt="First Weight"
          className="w-16 h-12 object-contain mx-auto cursor-pointer"
          onClick={() =>
            window.open(`/captured_images/first_weight/slip_${record.slip_no}.jpg`, "_blank")
          }
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </td>

      {/* ✅ Second Weight Value */}
      <td className="px-4 py-2 border border-black text-center">
        <span className="text-black font-semibold">{record.second_weight ?? "---"} </span>
      </td>

      {/* Second Weight Image */}
      <td className="px-4 py-2 border border-black text-center">
        <img
          src={`/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
          alt="Second Weight"
          className="w-16 h-12 object-contain mx-auto cursor-pointer"
          onClick={() =>
            window.open(`/captured_images/second_weight/slip_${record.slip_no}.jpg`, "_blank")
          }
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </td>

     <td className="px-4 py-2 border border-black">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      className="border-black text-black hover:bg-gray-100"
      onClick={() => handleEdit(record.wb_id, "SOLDNOTE")}
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

    <Button
  size="sm"
  variant="outline"
  disabled={reloadingId === record.wb_id}
  className={`border-black text-black hover:bg-gray-100 ${
    reloadingId === record.wb_id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  onClick={async () => {
    setReloadingId(record.wb_id);
    try {
      await handleReload(record.wb_id, record);
    } catch (error) {
      console.error("Reload failed:", error);
    } finally {
      setReloadingId(null);
    }
  }}
>
  {reloadingId === record.wb_id ? 'Reloading...' : 'Reload'}
</Button>
  </div>
</td>

    </tr>
  ))}
</tbody>

          </table>
        );
      })()}

      {soldNoteError && (
        <div className="text-center py-8 text-red-500 border border-black">
          Error loading Sold Note records. Please try again.
        </div>
      )}
      {!soldNoteError && soldNoteRecords.length === 0 && (
        <div className="text-center py-8 text-black border border-black">
          No Sold Note records found
        </div>
      )}
    </div>
  </div>
</TabsContent>


{/* Sale Return Tab */}
<TabsContent value="salereturn" className="space-y-4">
  <div className="bg-white rounded-lg shadow border-2 border-black">
    <div className="p-4 border-b-2 border-black flex justify-between items-center">
      <h2 className="text-lg font-semibold text-black">Sale Return Entries</h2>
           {/* <Button
  size="sm"
  className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 focus:ring-0 focus:outline-none border-none shadow-none"
  onClick={handlePrintTabReport}
>
  Print Combined Report
</Button> */}
    </div>

    <div className="overflow-x-auto">
      {(() => {
        // ✅ Filter Sale Return records based on search inputs
        const filteredSaleReturnRecords = (saleReturnRecords || []).filter(record => {
          const slipMatch = record.slip_no?.toLowerCase().includes(searchslip_no.toLowerCase());
          const vehicleMatch = record.vehicle_no?.toLowerCase().includes(searchVehicleNo.toLowerCase());
          return slipMatch && vehicleMatch;
        });

        return (
          <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
  <tr>
    <th className="px-4 py-2 text-left border border-black text-black">Slip No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle In Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle Out Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Entry Type</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Customer</th>
    <th className="px-4 py-2 text-left border border-black text-black">Status</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Actions</th>
  </tr>
</thead>
<tbody>
  {filteredSaleReturnRecords.map((record: any) => (
    <tr key={record.wb_id} className="hover:bg-gray-50">
      <td className="px-4 py-2 border border-black text-black">{record.slip_no}</td>
      <td className="px-4 py-2 border border-black text-black">
        {record.slip_in_time && record.slip_in_time !== "null" && record.slip_in_time !== ""
          ? new Date(record.slip_in_time).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
              timeZone: "Asia/Karachi",
            })
          : "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">
        {record.slip_out_time && record.slip_out_time !== "null" && record.slip_out_time !== ""
          ? new Date(record.slip_out_time).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
              timeZone: "Asia/Karachi",
            })
          : "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">{record.entry_type || "SALES_RETURN"}</td>
      <td className="px-4 py-2 border border-black text-black">{record.vehicle_no || "---"}</td>
      <td className="px-4 py-2 border border-black text-black">{record.customer_name || "---"}</td>
      <td className="px-4 py-2 border border-black text-black">
        {record.offline_entry === "Yes" ? (
          <span className="text-red-600 font-semibold">Offline</span>
        ) : (
          <span className="text-green-600 font-semibold">Online</span>
        )}
      </td>

      {/* ✅ First Weight Value */}
      <td className="px-4 py-2 border border-black text-center">
        <span className="text-black font-semibold">{record.first_weight ?? "---"}</span>
      </td>

      {/* First Weight Image */}
      <td className="px-4 py-2 border border-black text-center">
        <img
          src={`/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
          alt="First Weight"
          className="w-16 h-12 object-cover mx-auto cursor-pointer"
          onClick={() =>
            window.open(`/captured_images/first_weight/slip_${record.slip_no}.jpg`, "_blank")
          }
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </td>

      {/* ✅ Second Weight Value */}
      <td className="px-4 py-2 border border-black text-center">
        <span className="text-black font-semibold">{record.second_weight ?? "---"}</span>
      </td>

      {/* Second Weight Image */}
      <td className="px-4 py-2 border border-black text-center">
        <img
          src={`/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
          alt="Second Weight"
          className="w-16 h-12 object-cover mx-auto cursor-pointer"
          onClick={() =>
            window.open(`/captured_images/second_weight/slip_${record.slip_no}.jpg`, "_blank")
          }
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </td>

     <td className="px-4 py-2 border border-black">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      className="border-black text-black hover:bg-gray-100"
      onClick={() => handleEdit(record.wb_id, "SALE_RETURN")}
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

    <Button
  size="sm"
  variant="outline"
  disabled={reloadingId === record.wb_id}
  className={`border-black text-black hover:bg-gray-100 ${
    reloadingId === record.wb_id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  onClick={async () => {
    setReloadingId(record.wb_id);
    try {
      await handleReload(record.wb_id, record);
    } catch (error) {
      console.error("Reload failed:", error);
    } finally {
      setReloadingId(null);
    }
  }}
>
  {reloadingId === record.wb_id ? 'Reloading...' : 'Reload'}
</Button>
  </div>
</td>

    </tr>
  ))}
</tbody>

          </table>
        );
      })()}

      {saleReturnError && (
        <div className="text-center py-8 text-red-500 border border-black">
          Error loading Sale Return records. Please try again.
        </div>
      )}
      {!saleReturnError && saleReturnRecords.length === 0 && (
        <div className="text-center py-8 text-black border border-black">
          No Sale Return records found
        </div>
      )}
    </div>
  </div>
</TabsContent>


{/* Sale Tab */}
<TabsContent value="sale" className="space-y-4">
  <div className="bg-white rounded-lg shadow border-2 border-black">
    <div className="p-4 border-b-2 border-black flex justify-between items-center">
      <h2 className="text-lg font-semibold text-black">
        {saleFilter === "DO_WISE"
          ? "DO Wise Sale Entries"
          : saleFilter === "PENDING"
          ? "Pending Sale Entries"
          : saleFilter === "SOLDNOTE"
          ? "Sold Note Entries"
          : saleFilter === "FINAL"
          ? "Final Sale Entries"
          : "Sale Entries"}
      </h2>
           {/* <Button
  size="sm"
  className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 focus:ring-0 focus:outline-none border-none shadow-none"
  onClick={handlePrintTabReport}
>
  Print Combined Report
</Button> */}
    </div>

    <div className="overflow-x-auto">
      {(() => {
        // ✅ Apply correct records based on filter
        const displayedSaleRecords =
          saleFilter === "PENDING"
            ? (offlineRecords || [])
                .filter((r) => r.entry_type?.toUpperCase() === "SALE")
                .map((r) => ({ ...r, offline_entry: true })) // force offline flag
            : saleFilter === "SOLDNOTE"
            ? soldNoteRecords
            : salesRecords;

        return (
          <table className="w-full text-sm border-collapse">
           <thead className="bg-gray-50">
  <tr>
    <th className="px-4 py-2 text-left border border-black text-black">Slip No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle In Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle Out Time</th>
    <th className="px-4 py-2 text-left border border-black text-black">Entry Type</th>
    <th className="px-4 py-2 text-left border border-black text-black">Vehicle No</th>
    <th className="px-4 py-2 text-left border border-black text-black">Customer</th>
    <th className="px-4 py-2 text-left border border-black text-black">Status</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">First Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight</th>
    <th className="px-4 py-2 text-left border border-black text-black">Second Weight Image</th>
    <th className="px-4 py-2 text-left border border-black text-black">Actions</th>
  </tr>
</thead>
<tbody>
  {displayedSaleRecords
    .filter((record: SaleRecord) => {
      switch (saleFilter) {
        case "DO_WISE":
          return record.entry_type?.toUpperCase() === "SALE" && record.do_no?.trim() !== "";
        case "PENDING":
          return record.entry_type?.toUpperCase() === "SALE" && !record.slip_out_time;
        case "SALE":
          return record.entry_type?.toUpperCase() === "SALE";
        case "SOLDNOTE":
          return record.entry_type?.replace(/[_\s]/g, "").toUpperCase() === "SOLDNOTE";
        case "FINAL":
          return record.entry_type?.toUpperCase() === "FINAL";
        default:
          return true;
      }
    })
    .map((record: SaleRecord) => (
      <tr key={record.wb_id} className="hover:bg-gray-50">
        <td className="px-4 py-2 border border-black text-black">{record.slip_no}</td>
        <td className="px-4 py-2 border border-black text-black">
          {record.slip_in_time && record.slip_in_time !== "null" && record.slip_in_time !== ""
            ? new Date(record.slip_in_time).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: "Asia/Karachi",
              })
            : "---"}
        </td>
        <td className="px-4 py-2 border border-black text-black">
          {record.slip_out_time && record.slip_out_time !== "null" && record.slip_out_time !== ""
            ? new Date(record.slip_out_time).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: "Asia/Karachi",
              })
            : "---"}
        </td>
        <td className="px-4 py-2 border border-black text-black">{record.entry_type || "SALE"}</td>
        <td className="px-4 py-2 border border-black text-black">{record.vehicle_no || "---"}</td>
        <td className="px-4 py-2 border border-black text-black">{record.customer_name || "---"}</td>
        <td className="px-4 py-2 border border-black text-black">
          {record.offline_entry ? (
            <span className="text-red-600 font-semibold">Offline</span>
          ) : (
            <span className="text-green-600 font-semibold">Online</span>
          )}
        </td>

        {/* ✅ First Weight Value */}
        <td className="px-4 py-2 border border-black text-center">
          <span className="text-black font-semibold">{record.first_weight ?? "---"}</span>
        </td>

        {/* First Weight Image */}
        <td className="px-4 py-2 border border-black text-center">
          <img
            src={`/captured_images/first_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
            alt="First Weight"
            className="w-16 h-12 object-cover mx-auto cursor-pointer"
            onClick={() =>
              window.open(`/captured_images/first_weight/slip_${record.slip_no}.jpg`, "_blank")
            }
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        </td>

        {/* ✅ Second Weight Value */}
        <td className="px-4 py-2 border border-black text-center">
          <span className="text-black font-semibold">{record.second_weight ?? "---"}</span>
        </td>

        {/* Second Weight Image */}
        <td className="px-4 py-2 border border-black text-center">
          <img
            src={`/captured_images/second_weight/slip_${record.slip_no}_${record.entry_type?.toUpperCase()}.jpg`}
            alt="Second Weight"
            className="w-16 h-12 object-cover mx-auto cursor-pointer"
            onClick={() =>
              window.open(`/captured_images/second_weight/slip_${record.slip_no}.jpg`, "_blank")
            }
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        </td>

 <td className="px-4 py-2 border border-black">
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      className="border-black text-black hover:bg-gray-100"
      onClick={() => handleEdit(record.wb_id, "SALE")}
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

    <Button
  size="sm"
  variant="outline"
  disabled={reloadingId === record.wb_id}
  className={`border-black text-black hover:bg-gray-100 ${
    reloadingId === record.wb_id ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  onClick={async () => {
    setReloadingId(record.wb_id);
    try {
      await handleReload(record.wb_id, record);
    } catch (error) {
      console.error("Reload failed:", error);
    } finally {
      setReloadingId(null);
    }
  }}
>
  {reloadingId === record.wb_id ? 'Reloading...' : 'Reload'}
</Button>
  </div>
</td>


      </tr>
    ))}
</tbody>

          </table>
        );
      })()}

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
    <div className="p-4 border-b-2 border-black flex justify-between items-center">
      <h2 className="text-lg font-semibold text-black">
        Offline Entries 
      </h2>
           {/* <Button
  size="sm"
  className="bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-700 focus:ring-0 focus:outline-none border-none shadow-none"
  onClick={handlePrintTabReport}
>
  Print Combined Report
</Button> */}
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
    <th className="px-4 py-2 text-left border border-black text-black">Status</th>
    <th className="px-4 py-2 text-left border border-black text-black">Actions</th>
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
        {record.slip_in_time
          ? new Date(record.slip_in_time).toLocaleDateString()
          : "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">
        {record.entry_type || "PURCHASE"}
      </td>
      {/* ✅ First Weight */}
      <td className="px-4 py-2 border border-black text-black font-semibold">
        {record.first_weight ?? "---"}
      </td>
      {/* ✅ Second Weight */}
      <td className="px-4 py-2 border border-black text-black font-semibold">
        {record.second_weight ?? "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">
        {record.vehicle_no || "---"}
      </td>
      <td className="px-4 py-2 border border-black text-black">
        {record.vendor_name || "---"}
      </td>
      <td className="px-4 py-2 border border-black text-red-600 font-semibold">
        Offline
      </td>
      <td className="px-4 py-2 border border-black">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-black text-black hover:bg-gray-100"
            onClick={() => handleOfflineEdit(record)}
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
