import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import VideoStreamFullscreen from '@/components/video-stream-fullscreen';
import { useStream } from '@/hooks/use-stream';

const PurchaseWeighbridge = () => {
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
    driverName: '',
    companyId: '',
    branchId: '',
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
    bardanaType: '',
    igpNo: '',
    igpDate: '',
    vehicleNo: '',
    supWtBardana: '',
    noOfBags: '',
    wtPerBag: '',
    swtsOurWt: '',
    qualityDed: '',
    branch: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [onlineMode, setOnlineMode] = useState(true);

  // Get camera data and streaming functionality
  const { data: camera } = useQuery({
    queryKey: ['/api/cameras/1'],
  });

  const { isConnected, isStreaming, startStream, stopStream } = useStream(1);

  // Format ISO datetime string to "YYYY-MM-DDTHH:mm" for input[type=datetime-local]
  const formatDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  // Format back to ISO for sending to backend
  const formatISODate = (localString) => {
    if (!localString) return null;
    return new Date(localString).toISOString();
  };

  // Handle input change with numeric validation on some fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = [
      'firstWeight', 'secondWeight', 'netWeight',
      'bardanaWeight', 'grossWeight', 'freight',
      'companyId', 'branchId', 'createdBy', 'lastUpdatedBy'
    ];

    if (numericFields.includes(name)) {
      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Toggle online/offline entry mode
  const toggleOnlineMode = (isOnline) => {
    setOnlineMode(isOnline);
    setFormData(prev => ({
      ...prev,
      onlineEntry: isOnline ? 'Yes' : '',
      offlineEntry: isOnline ? '' : 'Yes',
    }));
  };

  // On mount, fetch latest slip_no and set default timestamps
  useEffect(() => {
    fetch('http://localhost:5000/api/purchases')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const lastSlip = data[0].slip_no || '0';
          const nextSlip = (parseInt(lastSlip, 10) + 1).toString();
          setFormData(prev => ({ ...prev, slipNo: nextSlip }));
        } else {
          setFormData(prev => ({ ...prev, slipNo: '1' }));
        }
      })
      .catch(err => {
        console.error('Error fetching purchases:', err);
      });

    // Set default timestamps now
    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: formatDatetimeLocal(now),
      creationDate: now,
      lastUpdatedDate: now,
      slipDate: now,
    }));

    toggleOnlineMode(true);
  }, []);

  // Reset form for New or Clear
  const resetForm = () => {
    setFormData(initialFormData);
    toggleOnlineMode(true);
  };

  // Prepare payload and submit
  const handleSave = async () => {
    setLoading(true);

    const payload = {
      slip_no: formData.slipNo || null,
      slip_in_time: formatISODate(formData.slipInTime),
      first_weight: formData.firstWeight ? parseFloat(formData.firstWeight) : null,
      second_weight: formData.secondWeight ? parseFloat(formData.secondWeight) : null,
      net_weight: formData.netWeight ? parseFloat(formData.netWeight) : null,
      bardana_weight: formData.bardanaWeight ? parseFloat(formData.bardanaWeight) : null,
      gross_weight: formData.grossWeight ? parseFloat(formData.grossWeight) : null,
      freight: formData.freight ? parseFloat(formData.freight) : null,
      remarks: formData.remarks || null,
      driver_name: formData.driverName || null,
      company_id: formData.companyId ? parseInt(formData.companyId, 10) : null,
      branch_id: formData.branchId ? parseInt(formData.branchId, 10) : null,
      online_entry: formData.onlineEntry || null,
      offline_entry: formData.offlineEntry || null,
      created_by: formData.createdBy ? parseInt(formData.createdBy, 10) : null,
      creation_date: formData.creationDate || null,
      last_updated_by: formData.lastUpdatedBy ? parseInt(formData.lastUpdatedBy, 10) : null,
      last_updated_date: formData.lastUpdatedDate || null,
      manual_dc_no: formData.manualDcNo || null,
      entry_type: formData.entryType || null,
      slip_out_time: formatISODate(formData.slipOutTime),
      status: formData.status || null,
      slip_date: formData.slipDate || null,
    };

    try {
      const res = await fetch('http://localhost:5000/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      alert('Purchase saved successfully!');
      console.log('Saved:', await res.json());
      resetForm();
    } catch (err) {
      alert('Failed to save purchase.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!camera) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-600">Loading camera configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-1">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-3">
          <div className="bg-gray-500 bg-opacity-10 rounded p-3 font-bold text-lg">
            Purchase Weightbridge Slip
          </div>
          <div className="flex gap-2 mt-3">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" 
              onClick={resetForm}
            >
              New
            </button>
            <button 
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
              Print
            </button>
            <button 
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded" 
              onClick={resetForm}
            >
              Clear
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Exit
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Main Form Section */}
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slip No</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100" 
                    name="slipNo" 
                    value={formData.slipNo} 
                    readOnly 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Weight</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded bg-yellow-200" 
                    name="netWeight" 
                    value={formData.netWeight} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freight</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded" 
                    name="freight" 
                    value={formData.freight} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Weight</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded" 
                    name="firstWeight" 
                    value={formData.firstWeight} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Second Weight</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded text-green-600" 
                    name="secondWeight" 
                    value={formData.secondWeight} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bardana Weight</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded" 
                    name="bardanaWeight" 
                    value={formData.bardanaWeight} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded" 
                    placeholder="Enter driver name" 
                    name="driverName" 
                    value={formData.driverName} 
                    onChange={handleChange} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight</label>
                  <input 
                    className="w-full p-2 border border-gray-300 rounded bg-gray-100" 
                    name="grossWeight" 
                    value={formData.grossWeight} 
                    readOnly 
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <textarea
                className="w-full p-2 border border-gray-300 rounded h-20"
                placeholder="Add remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex space-x-8">
                <button className="border-b-2 border-blue-500 text-blue-600 py-2 px-1 font-medium">
                  Purchase
                </button>
                <button className="text-gray-500 hover:text-gray-700 py-2 px-1">
                  Sale
                </button>
                <button className="text-gray-500 hover:text-gray-700 py-2 px-1">
                  Offline
                </button>
              </nav>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bardana Type</label>
                <input 
                  className="w-full p-2 border border-gray-300 rounded" 
                  name="bardanaType" 
                  value={formData.bardanaType} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IGP No</label>
                <input 
                  className="w-full p-2 border border-gray-300 rounded" 
                  name="igpNo" 
                  value={formData.igpNo} 
                  onChange={handleChange} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No</label>
                <input 
                  className="w-full p-2 border border-gray-300 rounded" 
                  name="vehicleNo" 
                  value={formData.vehicleNo} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          {/* Camera Section */}
          <div className="w-80">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Live Camera Feed</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${isConnected && isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isConnected && isStreaming ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
              
              {/* Camera Region - 280x200 pixels */}
              <div 
                className="bg-black border border-gray-300 overflow-hidden mb-3"
                style={{ width: '280px', height: '200px' }}
              >
                {isConnected && isStreaming ? (
                  <img
                    className="w-full h-full object-cover"
                    src={`/api/stream/${camera.id}/mjpeg`}
                    alt="Live Camera Feed"
                    style={{ 
                      width: '280px',
                      height: '200px',
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📹</div>
                      <div className="text-sm">Connecting...</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-2">
                {!isStreaming ? (
                  <button 
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    onClick={startStream}
                  >
                    Start Camera
                  </button>
                ) : (
                  <button 
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    onClick={stopStream}
                  >
                    Stop Camera
                  </button>
                )}
              </div>

              {/* Camera Info */}
              <div className="mt-3 text-xs text-gray-500">
                <div>Camera: {camera.name}</div>
                <div>IP: {camera.ip}:{camera.port}</div>
                <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseWeighbridge;