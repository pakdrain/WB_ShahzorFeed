
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation } from 'wouter';

const VoucherEntry = () => {
  const [, setLocation] = useLocation();
  const [doNumbers, setDoNumbers] = useState([]);
  const [selectedDoNo, setSelectedDoNo] = useState('');
  const [tableData, setTableData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Fetch DO numbers on component mount
  useEffect(() => {
    fetchDoNumbers();
  }, []);

  const fetchDoNumbers = async () => {
    try {
      const response = await fetch('/api/do-numbers');
      if (response.ok) {
        const data = await response.json();
        setDoNumbers(data);
      }
    } catch (error) {
      console.error('Error fetching DO numbers:', error);
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
      console.error('Error fetching DO data:', error);
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

  const handleSave = () => {
    // Navigate to Voucher View
    setLocation('/voucher-view');
  };

  return (
    <div className="container-fluid p-3" style={{ backgroundColor: '#e6ffee' }}>
      {/* Row 1: Company, Credit Branch, Type */}
      <div className="row mb-3">
        <div className="col-md-4">
          <strong className="text-black">Company</strong>
          <input className="form-control" value="Sabirs' Poultry (Pvt.) Ltd" readOnly />
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
          <input className="form-control" value="CPV" readOnly />
        </div>
      </div>

      {/* Row 2: Doc No, Doc Date, Creation Date */}
      <div className="row mb-3">
        <div className="col-md-4">
          <strong className="text-black">Doc No</strong>
          <select 
            className="form-control" 
            value={selectedDoNo} 
            onChange={handleDoNoChange}
          >
            <option value="">Select DO Number</option>
            {doNumbers.map((doNo, index) => (
              <option key={index} value={doNo}>
                {doNo}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <strong className="text-black">Doc Date</strong>
          <input className="form-control" type="date" />
        </div>
        <div className="col-md-4">
          <strong className="text-black">Creation Date</strong>
          <input className="form-control" type="date" />
        </div>
      </div>

      {/* Row 3: Remarks */}
      <div className="row mb-3">
        <div className="col-12">
          <strong className="text-black">Remarks</strong>
          <textarea className="form-control" rows={1} placeholder="Enter remarks here..."></textarea>
        </div>
      </div>

      {/* Table */}
     <table className="table table-bordered table-sm">
  <thead>
    <tr className="text-center">
      <th>Item</th>         {/* New Column */}
      <th>Part</th>         {/* New Column */}
      <th>Slip No</th>
      <th>Vehicle No</th>
      <th>Delivery Term</th>
      <th>Item Desc</th>
      <th>Party Name</th>
      <th>Debit</th>
      <th>Credit</th>
      <th>Freight Amount</th>
      <th></th> {/* Delete Button */}
    </tr>
  </thead>
  <tbody>
    {tableData.length > 0 ? (
      tableData.map((row, i) => (
        <tr key={i}>
          <td className="text-center">
            <input type="checkbox" className="form-check-input" />
          </td>
          <td className="text-center">
            <input type="checkbox" className="form-check-input" />
          </td>
          <td><input className="form-control form-control-sm" value={row.slip_no || ''} readOnly /></td>
          <td><input className="form-control form-control-sm" value={row.vehicle_no || ''} readOnly /></td>
          <td><input className="form-control form-control-sm" value={row.delivery_term || ''} readOnly /></td>
          <td><input className="form-control form-control-sm" value={row.item_desc || ''} readOnly /></td>
          <td><input className="form-control form-control-sm" value={row.customer_name || ''} readOnly /></td>
          <td><input className="form-control form-control-sm" value={row.debit_amount || ''} /></td>
          <td><input className="form-control form-control-sm" value={row.credit_amount || ''} /></td>
          <td><input className="form-control form-control-sm" value={row.freight_amount || ''} /></td>
          <td>
            <button className="btn btn-sm btn-outline-danger">X</button>
          </td>
        </tr>
      ))
    ) : (
      [...Array(10)].map((_, i) => (
        <tr key={i}>
          <td className="text-center">
            <input type="checkbox" className="form-check-input" />
          </td>
          <td className="text-center">
            <input type="checkbox" className="form-check-input" />
          </td>
          <td><input className="form-control form-control-sm" /></td>
          <td><input className="form-control form-control-sm" /></td>
          <td><input className="form-control form-control-sm" /></td>
          <td><input className="form-control form-control-sm" /></td>
          <td><input className="form-control form-control-sm" /></td>
          <td><input className="form-control form-control-sm" /></td>
          <td><input className="form-control form-control-sm" /></td>
          <td><input className="form-control form-control-sm" /></td>
          <td>
            <button className="btn btn-sm btn-outline-danger">X</button>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>


      {/* Footer Buttons */}
      <div className="row">
        <div className="col-md-6 text-start">
          <button className="btn btn-secondary" onClick={handleSave}>[Save]</button>
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-secondary">[Exit]</button>
        </div>
      </div>
    </div>
  );
};

export default VoucherEntry;
