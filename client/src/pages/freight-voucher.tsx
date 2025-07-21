import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation } from "wouter";

const FreightVoucher = () => {
  const [, setLocation] = useLocation();
  const [freightVouchers, setFreightVouchers] = useState([]);
  const [freightDetails, setFreightDetails] = useState([]);
  const [selectedFreightId, setSelectedFreightId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("1");
  const [selectedVoucherType, setSelectedVoucherType] = useState("cpv");
  const [freightItems, setFreightItems] = useState([]);

  useEffect(() => {
    fetchFreightVouchers();
  }, []);

  const fetchFreightVouchers = async () => {
    try {
      const response = await fetch("/api/freight-vouchers");
      if (response.ok) {
        const data = await response.json();
        setFreightVouchers(data);
      }
    } catch (error) {
      console.error("Error fetching freight vouchers:", error);
    }
  };

  const fetchFreightDetails = async (freightId) => {
    try {
      const response = await fetch(
        `/api/freight-vouchers/${freightId}/details`,
      );
      if (response.ok) {
        const data = await response.json();
        setFreightDetails(data);
      }
    } catch (error) {
      console.error("Error fetching freight details:", error);
    }
  };

  const fetchFreightItems = async (freightId) => {
    try {
      console.log("Fetching freight items for freight ID:", freightId);
      
      // First try the specific freight items endpoint
      let response = await fetch(`/api/freight-vouchers/${freightId}/items`);
      
      if (!response.ok) {
        console.log("Primary endpoint failed, trying alternative...");
        // Try alternative endpoint if first one fails
        response = await fetch(`/api/freight-items?freightId=${freightId}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Freight items data received:", data);
        console.log("✅ Number of freight items:", data.length);
        
        if (data && data.length > 0) {
          console.log("✅ Setting freight items:", data);
          setFreightItems(data);
        } else {
          console.log("⚠️ No freight items found for this freight ID");
          setFreightItems([]);
        }
      } else {
        console.error("❌ Failed to fetch freight items, status:", response.status);
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        setFreightItems([]);
      }
    } catch (error) {
      console.error("❌ Error fetching freight items:", error);
      setFreightItems([]);
    }
  };

  const handleFreightVoucherClick = (freightId) => {
    setSelectedFreightId(freightId);
    fetchFreightDetails(freightId);
    fetchFreightItems(freightId);
  };

  const handleNewEntry = () => {
    const params = new URLSearchParams();
    params.set("branch", selectedBranch);
    params.set("type", selectedVoucherType);
    setLocation(`/voucher-entry?${params.toString()}`);
  };

  return (
    <div
      className="container-fluid border p-2"
      style={{
        backgroundColor: "#eaf6ec",
        fontSize: "12px",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center px-2 py-1 rounded"
        style={{ backgroundColor: "#336699", color: "#fff" }}
      >
        <strong>Voucher View</strong>
      </div>

      {/* Form Filters */}
      <div className="row mt-3 mb-2">
        <div className="col-md-2">
          <label className="form-label fw-bold text-dark">Status</label>
          <select
            className="form-select form-select-sm"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="create">Create</option>
            <option value="checked">Checked</option>
            <option value="approved">Approved</option>
            <option value="prepared">Prepared</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold text-dark">Branch</label>
          <select
            className="form-select form-select-sm"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="1">Main Branch</option>
            <option value="2">Shahzor</option>
            <option value="3">Secondary Branch</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label fw-bold text-dark">Voucher Type</label>
          <select
            className="form-select form-select-sm"
            value={selectedVoucherType}
            onChange={(e) => setSelectedVoucherType(e.target.value)}
          >
            <option value="cpv">CPV</option>
            <option value="cv">CV</option>
          </select>
        </div>

        {/* New Entry button */}
        <div className="col-md-4 d-flex align-items-end justify-content-end">
          <button className="btn btn-success btn-sm" onClick={handleNewEntry}>
            New Entry
          </button>
        </div>
      </div>

      {/* Voucher Table with Buttons */}
      <div className="d-flex mt-3" style={{ height: "50%" }}>
        {" "}
        {/* slightly reduced mt */}
        <div
          className="table-responsive flex-grow-1"
          style={{
            height: "100%",
            overflowY: "auto",
          }}
        >
          <table
            className="table table-bordered table-sm text-center mb-0"
            style={{ borderSpacing: "0 4px" }}
          >
            <thead
              style={{
                backgroundColor: "#f0f0f0",
                position: "sticky",
                top: 0,
                zIndex: 1,
              }}
            >
              <tr>
                <th></th>
                <th>Date</th>
                <th>Reference #</th>
                <th>Type</th>
                <th>No.</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Account</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {freightVouchers.length > 0
                ? freightVouchers.map((voucher, index) => (
                    <tr
                      key={voucher.freight_id}
                      onClick={() =>
                        handleFreightVoucherClick(voucher.freight_id)
                      }
                      style={{ cursor: "pointer" }}
                      className={
                        selectedFreightId === voucher.freight_id
                          ? "table-active"
                          : ""
                      }
                    >
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={
                            voucher.doc_date
                              ? new Date(voucher.doc_date)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={voucher.wb_doc_no || voucher.doc_no || ""}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={
                            voucher.freight_type ||
                            selectedVoucherType.toUpperCase()
                          }
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={voucher.freight_id || ""}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value=""
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value=""
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={voucher.remarks || ""}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value=""
                          readOnly
                        />
                      </td>
                    </tr>
                  ))
                : Array.from({ length: 15 }).map((_, index) => (
                    <tr key={index}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      {[...Array(8)].map((_, i) => (
                        <td key={i}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {/* Buttons beside table */}
        <div className="d-flex flex-column justify-content-center align-items-start ms-3">
          <button className="btn btn-primary btn-sm mb-2 w-100">Audit</button>
          <button
            className="btn btn-info text-white mb-2"
            style={{ padding: "8px 16px", fontSize: "13px", minWidth: "110px" }}
          >
            Refresh
          </button>
          <div>
            <button className="btn btn-secondary btn-sm w-100">
              Customer Balance
            </button>
          </div>
        </div>
      </div>

      {/* Footer fields */}
      <div className="row mt-1 mb-1">
        {" "}
        {/* reduced mt and mb to 1 */}
        {[
          "Created By",
          "Checked By",
          "Approved By",
          "Modify By",
          "Edited By",
        ].map((label, idx) => (
          <div className="col-md mb-1" key={idx}>
            {" "}
            {/* reduced mb */}
            <label className="fw-bold text-primary">{label}</label>
            <input type="text" className="form-control form-control-sm" />
          </div>
        ))}
      </div>

      {/* Rollovers */}
      <div className="row mb-1 mt-1">
        {" "}
        {/* reduced mt */}
        {Array(5)
          .fill("[ROLLOVER...]")
          .map((val, idx) => (
            <div className="col mb-1" key={idx}>
              <select className="form-select form-select-sm">
                <option>{val}</option>
              </select>
            </div>
          ))}
        <div className="col">
          <div className="form-check">
            <input type="checkbox" className="form-check-input" />
            <label className="form-check-label">Checked</label>
          </div>
        </div>
        <div className="col">
          <button className="btn btn-success btn-sm w-100">Approved</button>
        </div>
        <div className="col">
          <button className="btn btn-danger btn-sm w-100">Un-Approved</button>
        </div>
      </div>

      {/* Detail Table */}
      <div
        className="table-responsive"
        style={{
          height: "40%",
          overflowY: "auto",
        }}
      >
        <table
          className="table table-bordered table-sm text-center mb-0"
          style={{ borderSpacing: "0 4px" }}
        >
          <thead
            style={{
              backgroundColor: "#f0f0f0",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <tr>
              <th>Party</th>
              <th>Account Code</th>
              <th>Description</th>
              <th>Narration</th>
              <th>Division</th>
              <th>Cost Center</th>
              <th>Cycle</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {freightItems && freightItems.length > 0 ? (
              <>
                {console.log("🔄 Rendering freight items in tbody:", freightItems)}
                {freightItems.map((item, index) => {
                  console.log(`🔄 Rendering item ${index + 1}:`, item);
                  return (
                    <tr key={item.freight_item_id || `freight-item-${index}`}>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.vendor_name || "N/A"}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.item_code || "N/A"}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.full_item_desc || item.item_desc || item.remarks || "N/A"}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={`Vehicle: ${item.vehicale_no || "N/A"}, WB ID: ${item.wb_id || "N/A"}`}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.delivery_terms || "N/A"}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.branch_id || "N/A"}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.freight_item_id || "N/A"}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.debit || "0.00"}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={item.credit || item.freight_amount || "0.00"}
                          readOnly
                        />
                      </td>
                    </tr>
                  );
                })}
              </>
            ) : (
              <>
                {console.log("⚠️ No freight items to display, showing empty rows")}
                {Array(10)
                  .fill(null)
                  .map((_, rowIdx) => (
                    <tr key={`empty-row-${rowIdx}`}>
                      {Array(9)
                        .fill(null)
                        .map((_, colIdx) => (
                          <td key={`empty-cell-${rowIdx}-${colIdx}`}>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value=""
                              readOnly
                              placeholder={colIdx === 0 ? "No freight items found" : ""}
                            />
                          </td>
                        ))}
                    </tr>
                  ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FreightVoucher;
