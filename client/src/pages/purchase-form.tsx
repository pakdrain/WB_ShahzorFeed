import React, { useState, useEffect } from 'react';

const PurchaseForm = () => {
  const initialFormData = {
    slipNo: '',
    slipInTime: '',
    firstWeight: '',
    secondWeight: '',
    netWeight: '',
    bardanaWeight: '',
    grossWeight: '',
    freight: '',
    remarks: '',
    po_no: '',
    driverName: '',
    vendor: '',
    companyId: '',
    branchId: '',
    branch: '',
    onlineEntry: 'Yes',
    offlineEntry: '',
    createdBy: '',
    creationDate: '',
    lastUpdatedBy: '',
    lastUpdatedDate: '',
    manualDcNo: '',
    entryType: 'PURCHASE',
    slipOutTime: '',
    status: '',
    slipDate: '',
    igpNo: '',
    vehicleNo: '',
  };

  const initialItemData = {
    wb_item_p_id: '',
    wb_id: '',
    manual_dc_no: '',
    do_id: '',
    do_no: '',
    customer_id: '',
    customer_name: '',
    vehicle_no: '',
    do_date: '',
    item_id: '',
    item_code: '',
    item_desc: '',
    created_by: '',
    creation_date: '',
    last_updated_by: '',
    last_updated_date: '',
    po_id: '',
    po_no: '',
    po_qty: '',
    igp_qty: '',
    balance_qty: '',
    bardana_type: '',
    igp_no: '',
    manual_igp_no: '',
    igp_id: '',
    vendor_id: '',
    vendor_name: '',
    no_of_bags: '',
    weight_per_bags: '',
    bardana_weight: '',
    igp_date: '',
    quality_deduction: '',
    supplier_weight: '',
    sup_weight_wthout_bardana: '',
    net_supplier_weight: '',
    bag_condition: '',
    bardana_type_id: '',
    rate: '',
    amount: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [itemData, setItemData] = useState(initialItemData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);
  const [igpItems, setIgpItems] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Handle changes for master form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle changes for item details inputs
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle online/offline
  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  useEffect(() => {
    // Fetch max slip no logic
    fetch('/api/purchases')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const maxSlip = data.reduce((max: number, curr: any) => {
            const slip = parseInt(curr.slip_no, 10);
            return slip > max ? slip : max;
          }, 0);
          const nextSlip = (maxSlip + 1).toString();
          setFormData(prev => ({ ...prev, slipNo: nextSlip }));
        } else {
          setFormData(prev => ({ ...prev, slipNo: '1' }));
        }
      })
      .catch(err => {
        console.error('Error fetching purchases:', err);
      });

    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: now.slice(0, 16),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));

    toggleOnlineMode(true);
  }, []);

  // Reset all forms
  const resetForm = () => {
    setFormData(initialFormData);
    setItemData(initialItemData);
    toggleOnlineMode(true);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Prepare master data exactly as your working index.js expects
      const payload = {
        slip_no: formData.slipNo || null,
        slip_in_time: formData.slipInTime || null,
        first_weight: formData.firstWeight ? parseFloat(formData.firstWeight) : null,
        second_weight: formData.secondWeight ? parseFloat(formData.secondWeight) : null,
        net_weight: formData.netWeight ? parseFloat(formData.netWeight) : null,
        bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
        gross_weight: formData.grossWeight ? parseFloat(formData.grossWeight) : null,
        freight: formData.freight ? parseFloat(formData.freight) : null,
        remarks: formData.remarks || null,
        driver_name: formData.driverName || null,
        vendor: formData.vendor || null,
        vehicle_no: formData.vehicleNo || null,
        igp_no: formData.igpNo || null,
        entry_type: 'PURCHASE',
        online_entry: onlineMode ? 'Yes' : 'No',
        purchase_items: purchaseItems.map((item: any) => ({
          wb_item_p_id: item.wb_item_p_id ? parseInt(item.wb_item_p_id, 10) : null,
          manual_dc_no: item.manual_dc_no || null,
          do_id: item.do_id ? parseInt(item.do_id, 10) : null,
          item_id: item.item_id ? parseInt(item.item_id, 10) : null,
          item_desc: item.item_desc || null,
          created_by: item.created_by ? parseInt(item.created_by, 10) : null,
          creation_date: item.creation_date || null,
          last_updated_by: item.last_updated_by ? parseInt(item.last_updated_by, 10) : null,
          last_updated_date: item.last_updated_date || null,
          po_id: item.po_id ? parseInt(item.po_id, 10) : null,
          po_no: item.po_no || null,
          po_qty: item.po_qty ? parseFloat(item.po_qty) : null,
          igp_qty: item.igp_qty ? parseFloat(item.igp_qty) : null,
          balance_qty: item.balance_qty ? parseFloat(item.balance_qty) : null,
          bardana_type: item.bardana_type || null,
          igp_no: item.igp_no || null,
          manual_igp_no: item.manual_igp_no || null,
          igp_id: item.igp_id ? parseInt(item.igp_id, 10) : null,
          vendor_id: item.vendor_id ? parseInt(item.vendor_id, 10) : null,
          vendor_name: item.vendor_name || null,
          no_of_bags: item.no_of_bags ? parseInt(item.no_of_bags, 10) : null,
          weight_per_bags: item.weight_per_bags ? parseFloat(item.weight_per_bags) : null,
          bardana_weight: item.bardana_weight ? parseFloat(item.bardana_weight) : null,
          igp_date: item.igp_date || null,
          quality_deduction: item.quality_deduction ? parseFloat(item.quality_deduction) : null,
          supplier_weight: item.supplier_weight ? parseFloat(item.supplier_weight) : null,
          sup_weight_wthout_bardana: item.sup_weight_wthout_bardana ? parseFloat(item.sup_weight_wthout_bardana) : null,
          net_supplier_weight: item.net_supplier_weight ? parseFloat(item.net_supplier_weight) : null,
          bag_condition: item.bag_condition || null,
          bardana_type_id: item.bardana_type_id ? parseInt(item.bardana_type_id, 10) : null,
        }))
      };

      // POST payload to backend
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        console.log('Data saved:', result);
        alert('Data saved successfully!');
        resetForm();
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#d7e9f7' }}>
      {/* Top Bar Buttons */}
      <div className="d-flex flex-wrap justify-content-between align-items-center bg-light border rounded p-2 mb-2">
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary">Purc</button>
          <button className="btn btn-outline-secondary">Sale</button>
          <button className="btn btn-outline-secondary">Edit</button>
          <button className="btn btn-outline-secondary">|&lt; First</button>
          <button className="btn btn-outline-secondary">&lt; Prev</button>
          <button className="btn btn-outline-secondary">Next &gt;</button>
          <button className="btn btn-outline-secondary">Last &gt;|</button>
          <button className="btn btn-success me-2" onClick={handleSaveAll} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button className="btn btn-outline-secondary">Print</button>
          <button className="btn btn-outline-secondary">Rej</button>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-dark">ONLINE</button>
          <button className="btn btn-dark">OFFLINE</button>
        </div>
        <div className="display-6 text-success fw-bold">2500</div>
      </div>

      {/* Main Form Section */}
      <div className="bg-white p-2 rounded border mb-2">
        <div className="row mb-2">
          <div className="col-md-2">
            <label>Slip No</label>
            <input
              className="form-control mb-4"
              name="slipNo"
              value={formData.slipNo}
              readOnly
            />
            <label className="mt-4">Net Weight</label>
            <input
              className="form-control bg-warning mb-2"
              name="netWeight"
              value={formData.netWeight}
              onChange={handleChange}
            />
            <label className="mt-2">Freight</label>
            <input
              className="form-control"
              name="freight"
              value={formData.freight}
              onChange={handleChange}
            />
            <textarea
              className="form-control mt-4 mb-3"
              placeholder="Add remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              style={{ height: '50px', width: '558px' }}
            />
          </div>

          <div className="col-md-2">
            <label>First Weight</label>
            <input
              className="form-control"
              name="firstWeight"
              value={formData.firstWeight}
              onChange={handleChange}
            />
            <label>Second Weight</label>
            <input
              className="form-control text-success"
              name="secondWeight"
              value={formData.secondWeight}
              onChange={handleChange}
            />
            <label>Bardana Weight</label>
            <input
              className="form-control"
              name="bardanaWeight"
              value={formData.bardanaWeight}
              onChange={handleChange}
            />
            <label>Gross Weight</label>
            <input
              className="form-control"
              name="grossWeight"
              value={formData.grossWeight}
              readOnly
            />
          </div>

          <div className="col-md-2">
            <label>Branch</label>
            <select
              className="form-select"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
            >
              <option value="">Select branch</option>
              <option value="Branch 1">Branch 1</option>
              <option value="Branch 2">Branch 2</option>
            </select>

            <label>Driver Name</label>
            <input
              className="form-control"
              placeholder="Enter driver name"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
            />

            <label>Date & Time</label>
            <input
              className="form-control"
              value="30-04-25 09:10:30 AM"
              readOnly
            />

            <div className="mt-3">
              <div className="d-flex gap-2 mb-2">
                <button className="btn btn-success w-50">1st WHT</button>
                <button className="btn btn-secondary w-50">2nd WHT</button>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-warning w-50">Clear</button>
                <button className="btn btn-danger w-50">Exit</button>
              </div>
            </div>
          </div>

          <div className="col-md-2">
            <label>Vendor</label>
            <input
              className="form-control"
              placeholder="Enter vendor name"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
            />

            <label>Vehicle No</label>
            <input
              className="form-control"
              placeholder="Enter vehicle number"
              name="vehicleNo"
              value={formData.vehicleNo}
              onChange={handleChange}
            />

            <label>PO No</label>
            <input
              className="form-control"
              placeholder="Enter PO number"
              name="po_no"
              value={formData.po_no}
              onChange={handleChange}
            />

            <label>IGP No</label>
            <input
              className="form-control"
              placeholder="Enter IGP number"
              name="igpNo"
              value={formData.igpNo}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-2">
            <div className="p-3 border rounded bg-light">
              <div className="row">
                <div className="col-6">
                  <div className="text-center mb-2">
                    <small>Gross Wt</small>
                    <div className="fw-bold">2500</div>
                  </div>
                  <div className="text-center mb-2">
                    <small>Tare Wt</small>
                    <div className="fw-bold">1200</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-center mb-2">
                    <small>Net Wt</small>
                    <div className="fw-bold text-success">1300</div>
                  </div>
                  <div className="text-center mb-2">
                    <small>Bardana</small>
                    <div className="fw-bold">50</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button className="btn btn-primary w-100 mb-2">Fetch IGP Data</button>
              <button className="btn btn-info w-100">Calculate Weight</button>
            </div>
          </div>

          <div className="col-md-2">
            <div className="text-center">
              <div className="bg-success text-white p-2 rounded mb-2">
                <div>Live Weight</div>
                <div className="h4 mb-0">0.00 KG</div>
              </div>
              <div className="bg-info text-white p-2 rounded">
                <div>Status</div>
                <div>Stable</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Tab Section */}
      <div className="bg-white p-2 rounded border">
        <ul className="nav nav-tabs" id="myTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active"
              id="purchase-tab"
              data-bs-toggle="tab"
              data-bs-target="#purchase"
              type="button"
              role="tab"
            >
              Purchase
            </button>
          </li>
        </ul>
        <div className="tab-content" id="myTabContent">
          <div className="tab-pane fade show active" id="purchase" role="tabpanel">
            <div className="row mt-3">
              <div className="col-md-2">
                <label>Item Code</label>
                <input
                  className="form-control"
                  name="item_code"
                  value={itemData.item_code}
                  onChange={handleItemChange}
                  placeholder="Enter item code"
                />
              </div>
              <div className="col-md-3">
                <label>Item Description</label>
                <input
                  className="form-control"
                  name="item_desc"
                  value={itemData.item_desc}
                  onChange={handleItemChange}
                  placeholder="Enter description"
                />
              </div>
              <div className="col-md-2">
                <label>Quantity</label>
                <input
                  className="form-control"
                  name="po_qty"
                  value={itemData.po_qty}
                  onChange={handleItemChange}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="col-md-2">
                <label>Rate</label>
                <input
                  className="form-control"
                  name="rate"
                  value={itemData.rate}
                  onChange={handleItemChange}
                  placeholder="Enter rate"
                />
              </div>
              <div className="col-md-2">
                <label>Amount</label>
                <input
                  className="form-control"
                  name="amount"
                  value={itemData.amount}
                  readOnly
                />
              </div>
              <div className="col-md-1">
                <label>&nbsp;</label>
                <button className="btn btn-primary d-block">Add</button>
              </div>
            </div>

            {/* Items Table */}
            <div className="mt-3">
              <table className="table table-bordered table-sm">
                <thead className="table-light">
                  <tr>
                    <th>Item Code</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.item_code}</td>
                      <td>{item.item_desc}</td>
                      <td>{item.po_qty}</td>
                      <td>{item.rate}</td>
                      <td>{item.amount}</td>
                      <td>
                        <button className="btn btn-danger btn-sm">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;