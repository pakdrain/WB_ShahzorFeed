import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation } from "wouter";

const FreightEntry = () => {
  const [, setLocation] = useLocation();
  const [doNumbers, setDoNumbers] = useState([]);
  const [selectedDoNo, setSelectedDoNo] = useState("");
  const [tableData, setTableData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [voucherType, setVoucherType] = useState("CPV");
  const [currentDate, setCurrentDate] = useState("");
  const [maxDocNo, setMaxDocNo] = useState("");
  const [slipData, setSlipData] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [slipDropdownData, setSlipDropdownData] = useState({});

  useEffect(() => {
    fetchDoNumbers();
    fetchMaxDocNo();
    fetchSlipData();

    // Set current date
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const branchParam = urlParams.get("branch");
    const typeParam = urlParams.get("type");

    if (branchParam) {
      // Map branch ID to branch name
      const branchMapping = {
        "1": "Main Branch",
        "2": "Shahzor",
        "3": "Secondary Branch",
      };
      setSelectedBranch(branchMapping[branchParam] || "");
    }

    if (typeParam) {
      setVoucherType(typeParam.toUpperCase());
    }
  }, []);

  const fetchDoNumbers = async () => {
    try {
      const response = await fetch("/api/do-numbers");
      if (response.ok) {
        const data = await response.json();
        setDoNumbers(data);
      }
    } catch (error) {
      console.error("Error fetching DO numbers:", error);
    }
  };

  const fetchMaxDocNo = async () => {
    try {
      const response = await fetch("/api/vouchers/max-doc-no");
      if (response.ok) {
        const data = await response.json();
        setMaxDocNo(data.maxDocNo.toString());
      }
    } catch (error) {
      console.error("Error fetching max Doc No:", error);
      setMaxDocNo("1"); // Fallback value
    }
  };

  const fetchSlipData = async () => {
    try {
      const response = await fetch("/api/vouchers/slip-data");
      if (response.ok) {
        const data = await response.json();
        setSlipData(data);
      }
    } catch (error) {
      console.error("Error fetching slip data:", error);
    }
  };

  const fetchDoData = async (doNo) => {
    try {
      const response = await fetch(`/api/do-data/${doNo}`);
      if (response.ok) {
        const data = await response.json();
        setTableData(data);
      }
    } catch (error) {
      console.error("Error fetching DO data:", error);
    }
  };

  const handleDoNoChange = (e) => {
    const doNo = e.target.value;
    setSelectedDoNo(doNo);
    if (doNo) {
      fetchDoData(doNo);
    } else {
      setTableData([]);
    }
  };

  const handleTableDataChange = (index, field, value) => {
    const updatedData = [...tableData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setTableData(updatedData);
  };

  const handleItemCheckboxChange = (index, checked) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(index);
      // Auto-focus the slip dropdown to open it
      setTimeout(() => {
        const slipDropdown = document.querySelector(`#slip-dropdown-${index}`);
        if (slipDropdown) {
          slipDropdown.click();
        }
      }, 100);
    } else {
      newSelectedRows.delete(index);
      // Clear dropdown data for this row
      const newSlipDropdownData = { ...slipDropdownData };
      delete newSlipDropdownData[index];
      setSlipDropdownData(newSlipDropdownData);

      // Clear the loaded data from this row
      const updatedData = [...tableData];
      updatedData[index] = {
        ...updatedData[index],
        slip_no: "",
        vehicle_no: "",
        item_desc: "",
        vendor_name: "",
        freight_amount: "",
        wb_id: "",
        item_code: "",
        item_id: "",
        vendor_id: "",
      };
      setTableData(updatedData);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleSlipSelection = async (index, slipNo) => {
    if (!slipNo) return;

    try {
      const response = await fetch(`/api/vouchers/slip-data/${slipNo}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const slipRecord = data[0];

          // Update table data with selected slip information
          const updatedData = [...tableData];
          updatedData[index] = {
            ...updatedData[index],
            slip_no: slipRecord.slip_no,
            vehicle_no: slipRecord.vehicle_no,
            item_desc: slipRecord.item_desc,
            vendor_name: slipRecord.vendor_name,
            freight_amount: slipRecord.freight,
            wb_id: slipRecord.wb_id,
            item_code: slipRecord.item_code,
            item_id: slipRecord.item_id,
            vendor_id: slipRecord.vendor_id,
          };
          setTableData(updatedData);

          console.log(`Loaded data for slip ${slipNo}:`, slipRecord);
        }
      }
    } catch (error) {
      console.error("Error fetching slip data:", error);
    }
  };

  const handleSave = async () => {
    try {
      await fetch("/api/create-freight-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const masterData = {
        docNo: maxDocNo,
        voucherType: voucherType,
        docDate: document.querySelector('input[type="date"]')?.value,
        remarks: document.querySelector("textarea")?.value,
        createdBy: 1,
        creationDate: currentDate,
        branch: selectedBranch,
        selectedDoNo: selectedDoNo,
      };

      // Collect slip data from selected rows
      const slipData = [];
      selectedRows.forEach((index) => {
        if (tableData[index]) {
          slipData.push(tableData[index]);
        }
      });

      const response = await fetch("/api/freight/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterData, slipData }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Freight voucher saved successfully:", result);
        alert("Freight voucher saved successfully!");
        setLocation("/freight-voucher");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save freight voucher");
      }
    } catch (error) {
      console.error("Error saving freight voucher:", error);
      alert("Failed to save freight voucher. Please try again.");
    }
  };

  return (
    <div
      className="container-fluid p-2"
      style={{
        backgroundColor: "#e6ffee",
        minHeight: "100vh",
        overflowY: "hidden", // 🚨 Block vertical scroll only
      }}
    >
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center px-2 py-1 rounded"
        style={{ backgroundColor: "#336699", color: "#fff" }}
      >
        <strong>Voucher Entry</strong>
      </div>

      {/* Row 1 */}
      <div className="row mt-3 mb-2">
        <div className="col-md-4">
          <strong className="text-black">Company</strong>
          <input
            className="form-control"
            value="Sabirs' Poultry (Pvt.) Ltd"
            readOnly
          />
        </div>
        <div className="col-md-4">
          <strong className="text-black">Branch</strong>
          <select
            className="form-control"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">Select Branch</option>
            <option value="Shahzor">Shahzor</option>
            <option value="Head Office">Head Office</option>
          </select>
        </div>
        <div className="col-md-4">
          <strong className="text-black">Type</strong>
          <input className="form-control" value={voucherType} readOnly />
        </div>
      </div>

      {/* Row 2 */}
      <div className="row mb-3">
        <div className="col-md-4">
          <strong className="text-black">Doc No</strong>
          <input
            className="form-control"
            value={maxDocNo}
            readOnly
            placeholder="Loading..."
          />
        </div>

        <div className="col-md-4">
          <strong className="text-black">Doc Date</strong>
          <input className="form-control" type="date" />
        </div>
        <div className="col-md-4">
          <strong className="text-black">Creation Date</strong>
          <input
            className="form-control"
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
          />
        </div>
      </div>

      {/* Remarks */}
      <div className="row mb-4">
        <div className="col-12">
          <strong className="text-black">Remarks</strong>
          <textarea
            className="form-control"
            rows={1}
            placeholder="Enter remarks here..."
          ></textarea>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive" style={{ marginTop: "20px" }}>
        {/* 👆 Added marginTop to move table down */}
        <table className="table table-bordered table-sm">
          <thead>
            <tr className="text-center">
              <th>Item</th>
              <th>Part</th>
              <th>Slip No</th>
              <th>Vehicle No</th>
              <th>Delivery Term</th>
              <th>Item Desc</th>
              <th>Party Name</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Freight Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.length > 0
              ? tableData.map((row, i) => (
                  <tr key={i}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedRows.has(i)}
                        onChange={(e) =>
                          handleItemCheckboxChange(i, e.target.checked)
                        }
                      />
                    </td>
                    <td className="text-center">
                      <input type="checkbox" className="form-check-input" />
                    </td>
                    <td>
                      {selectedRows.has(i) ? (
                        <select
                          id={`slip-dropdown-${i}`}
                          className="form-control form-control-sm"
                          value={row.slip_no || ""}
                          onChange={(e) =>
                            handleSlipSelection(i, e.target.value)
                          }
                        >
                          <option value="">Select Slip No</option>
                          {slipData.map((slip, index) => (
                            <option key={index} value={slip.slip_no}>
                              {slip.slip_no} - {slip.vehicle_no} - {slip.item_desc}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="form-control form-control-sm"
                          value={row.slip_no || ""}
                          readOnly
                          placeholder="Check item box to select slip"
                        />
                      )}
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.vehicle_no || ""}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.do_date || row.delivery_term || ""}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.item_desc || ""}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.vendor_name || row.customer_name || ""}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.debit_amount || ""}
                        onChange={(e) =>
                          handleTableDataChange(
                            i,
                            "debit_amount",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.credit_amount || ""}
                        onChange={(e) =>
                          handleTableDataChange(
                            i,
                            "credit_amount",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="form-control form-control-sm"
                        value={row.freight_amount || ""}
                        onChange={(e) =>
                          handleTableDataChange(
                            i,
                            "freight_amount",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger">
                        X
                      </button>
                    </td>
                  </tr>
                ))
              : [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedRows.has(i)}
                        onChange={(e) =>
                          handleItemCheckboxChange(i, e.target.checked)
                        }
                      />
                    </td>
                    <td className="text-center">
                      <input type="checkbox" className="form-check-input" />
                    </td>
                    <td>
                      {selectedRows.has(i) ? (
                        <select
                          id={`slip-dropdown-${i}`}
                          className="form-control form-control-sm"
                          onChange={(e) =>
                            handleSlipSelection(i, e.target.value)
                          }
                        >
                          <option value="">Select Slip No</option>
                          {slipData.map((slip, index) => (
                            <option key={index} value={slip.slip_no}>
                              {slip.slip_no} - {slip.vehicle_no} - {slip.item_desc}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="form-control form-control-sm"
                          placeholder="Check item box to select slip"
                          readOnly
                        />
                      )}
                    </td>
                    <td>
                      <input className="form-control form-control-sm" />
                    </td>
                    <td>
                      <input className="form-control form-control-sm" />
                    </td>
                    <td>
                      <input className="form-control form-control-sm" />
                    </td>
                    <td>
                      <input className="form-control form-control-sm" />
                    </td>
                    <td>
                      <input className="form-control form-control-sm" />
                    </td>
                    <td>
                      <input className="form-control form-control-sm" />
                    </td>
                    <td>
                      <input className="form-control form-control-sm" />
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger">
                        X
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Footer Buttons */}
      <div className="row mt-4">
        {/* 👆 Increased marginTop to move buttons further down */}
        <div className="col-md-6 text-start">
          <button
            className="btn btn-success px-4"
            style={{ fontWeight: "bold" }}
            onClick={handleSave}
          >
            [Save]
          </button>
        </div>
        <div className="col-md-6 text-end">
          <button
            className="btn btn-danger px-4"
            style={{ fontWeight: "bold" }}
          >
            [Exit]
          </button>
        </div>
      </div>
    </div>
  );
};

export default FreightEntry;