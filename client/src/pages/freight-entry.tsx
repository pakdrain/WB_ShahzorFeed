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
      console.log("🔍 Fetching freight items for freight ID:", freightId);

      const response = await fetch(`/api/freight-vouchers/${freightId}/items`);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Freight items response received:", data);
        console.log("✅ Number of freight items:", data?.length || 0);

        if (data && Array.isArray(data)) {
          console.log("✅ Setting freight items:", data);
          setFreightItems(data);

          // Log each item for debugging
          data.forEach((item, index) => {
            console.log(`📋 Item ${index + 1}:`, {
              id: item.freight_item_id,
              vendor: item.vendor_name,
              amount: item.freight_amount,
              vehicle: item.vehicale_no
            });
          });
        } else {
          console.log("⚠️ Invalid data format received");
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
      </div>

      {/* 👇 Added margin between master and details table */}
      <div style={{ height: "100px" }}></div>

      {/* Detail Table */}
     <div
  className="table-responsive"
  style={{
    height: "30%",
    overflowY: "auto",
    marginTop: "-50px", // 👈 Add this line
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
            {freightItems && Array.isArray(freightItems) && freightItems.length > 0 ? (
              freightItems.map((item, index) => {
                console.log(`🔄 Rendering freight item ${index + 1}:`, item);
                return (
                  <tr key={item.freight_item_id || `freight-item-${index}`}>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.vendor_name || "Unknown Vendor"}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.item_code || "Unknown Code"}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={item.full_item_desc || item.item_desc || item.remarks || "Unknown Item"}
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
              })
            ) : (
              <>
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                    <strong>
                      {selectedFreightId ? 
                        "No freight items found for selected freight voucher" : 
                        "Select a freight voucher to view details"
                      }
                    </strong>
                  </td>
                </tr>
                {Array(9)
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
