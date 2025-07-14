import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useLocation } from "wouter";

const VoucherView = () => {
  const [, setLocation] = useLocation();
  const [vouchers, setVouchers] = useState([]);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch("/api/vouchers");
      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
    }
  };

  const handleNewEntry = () => {
    setLocation("/voucher-entry");
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
          <select className="form-select form-select-sm">
            <option value="">Select Status</option>
            <option value="create">Create</option>
            <option value="checked">Checked</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-bold text-dark">Company</label>
          <select className="form-select form-select-sm">
            <option>Sabirs' Poultry (Pvt.) Ltd</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label fw-bold text-dark">Month</label>
          <select className="form-select form-select-sm">
            <option value="">Select Month</option>
            <option value="january">January</option>
            <option value="february">February</option>
            <option value="march">March</option>
            <option value="april">April</option>
            <option value="may">May</option>
            <option value="june">June</option>
            <option value="july">July</option>
            <option value="august">August</option>
            <option value="september">September</option>
            <option value="october">October</option>
            <option value="november">November</option>
            <option value="december">December</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label fw-bold text-dark">Voucher Type</label>
          <select className="form-select form-select-sm">
            <option value="">Select Type</option>
            <option value="cpv">CPV</option>
            <option value="cv">CV</option>
          </select>
        </div>

        {/* New Entry button */}
        <div className="col-md-2 d-flex align-items-end justify-content-end">
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
              {vouchers.length > 0
                ? vouchers.map((voucher, index) => (
                    <tr key={voucher.voucher_id}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={voucher.voucher_date || ""}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={voucher.reference_no || ""}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={voucher.voucher_type || ""}
                          readOnly
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={voucher.voucher_id || ""}
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
                          value={voucher.company_name || ""}
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
            {vouchers.length > 0
              ? vouchers.map((voucher, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={voucher.customer_name || ""}
                        readOnly
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value=""
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={voucher.item_desc || ""}
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
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value=""
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value=""
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value=""
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value=""
                      />
                    </td>
                  </tr>
                ))
              : Array(10)
                  .fill(null)
                  .map((_, rowIdx) => (
                    <tr key={rowIdx}>
                      {Array(9)
                        .fill(null)
                        .map((_, colIdx) => (
                          <td key={colIdx}>
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
  );
};

export default VoucherView;
