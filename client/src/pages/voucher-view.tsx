
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation } from 'wouter';

const VoucherView = () => {
  const [, setLocation] = useLocation();

  const handleNewEntry = () => {
    setLocation('/voucher-entry');
  };

  return (
    <div
      className="container-fluid border p-2"
      style={{ backgroundColor: '#eaf6ec', fontSize: '12px' }}
    >
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center px-2 py-1"
        style={{ backgroundColor: '#336699', color: '#fff' }}
      >
        <strong>Voucher View</strong>
        <button 
          className="btn btn-light btn-sm"
          onClick={handleNewEntry}
        >
          New Entry
        </button>
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
      </div>

      {/* Voucher Table with Buttons on Right Center and Scrollable */}
      <div className="d-flex mt-2">
        {/* Scrollable Table */}
        <div
          className="table-responsive flex-grow-1"
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          <table className="table table-bordered table-sm text-center mb-0">
            <thead style={{ backgroundColor: '#f0f0f0', position: 'sticky', top: 0, zIndex: 1 }}>
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
              {Array.from({ length: 15 }).map((_, index) => (
                <tr key={index}>
                  <td><input type="checkbox" /></td>
                  {[...Array(8)].map((_, i) => (
                    <td key={i}>
                      <input type="text" className="form-control form-control-sm" />
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
            style={{ padding: '8px 16px', fontSize: '13px', minWidth: '110px' }}
          >
            Refresh
          </button>
          <div className="mt-2">
            <button className="btn btn-secondary btn-sm w-100">Customer Balance</button>
          </div>
        </div>
      </div>

      {/* Footer fields */}
      <div className="row mb-2 mt-3">
        {['Created By', 'Checked By', 'Approved By', 'Modify By', 'Edited By'].map((label, idx) => (
          <div className="col-md" key={idx}>
            <label className="fw-bold text-primary">{label}</label>
            <input type="text" className="form-control form-control-sm" />
          </div>
        ))}
      </div>

      {/* Rollovers */}
      <div className="row mb-2">
        {Array(5).fill('[ROLLOVER...]').map((val, idx) => (
          <div className="col" key={idx}>
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

      {/* Detail Table with Scroll */}
      <div
        className="table-responsive mb-2"
        style={{ maxHeight: '250px', overflowY: 'auto' }}
      >
        <table className="table table-bordered table-sm text-center mb-0">
          <thead style={{ backgroundColor: '#f0f0f0', position: 'sticky', top: 0, zIndex: 1 }}>
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
            {Array(10).fill(null).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array(9).fill(null).map((_, colIdx) => (
                  <td key={colIdx}>
                    <input type="text" className="form-control form-control-sm" />
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
