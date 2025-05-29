import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VideoStreamFullscreen from "@/components/video-stream-fullscreen";
import WeightIndicator from "@/components/weight-indicator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Purchase form data structure
interface PurchaseFormData {
  slipNo: string;
  slipInTime: string;
  firstWeight: string;
  secondWeight: string;
  netWeight: string;
  bardanaWeight: string;
  grossWeight: string;
  freight: string;
  remarks: string;
  driverName: string;
  vendor: string;
  vehicleNo: string;
  igpNo: string;
  branch: string;
}

// IGP Item interface
interface IGPItem {
  po_no: string;
  item_code: string;
  item_desc: string;
  qty: number;
  received_qty: number;
  driver_name?: string;
  vendor_name?: string;
  vehicle_no?: string;
  bardana_qty?: number;
}

// Purchase item interface
interface PurchaseItem {
  wb_item_p_id?: number;
  manual_dc_no?: string;
  do_id?: number;
  item_id?: number;
  item_desc?: string;
  created_by?: number;
  creation_date?: string;
  last_updated_by?: number;
  last_updated_date?: string;
  po_id?: number;
  po_no?: string;
  po_qty?: number;
  igp_qty?: number;
  balance_qty?: number;
  bardana_type?: string;
  igp_no?: string;
  manual_igp_no?: string;
  igp_id?: number;
  vendor_id?: number;
  vendor_name?: string;
  no_of_bags?: number;
  weight_per_bags?: number;
  bardana_weight?: number;
  igp_date?: string;
  quality_deduction?: number;
  supplier_weight?: number;
  sup_weight_wthout_bardana?: number;
  net_supplier_weight?: number;
  bag_condition?: string;
  bardana_type_id?: number;
}

// Item data structure
interface ItemData {
  bardana_type: string;
  weight_per_bags: string;
  no_of_bags: string;
  bardana_weight: string;
  quality_deduction: string;
  igp_no: string;
  igp_date: string;
  vendor_name: string;
  vehicle_no: string;
  net_supplier_weight: string;
  bag_condition: string;
  supplier_weight: string;
  sup_weight_wthout_bardana: string;
  bardana_type_id: string;
}

export default function PurchaseForm() {
  const queryClient = useQueryClient();
  
  // Initial form data
  const initialFormData: PurchaseFormData = {
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
    vendor: '',
    vehicleNo: '',
    igpNo: '',
    branch: '',
  };

  const initialItemData: ItemData = {
    bardana_type: '',
    weight_per_bags: '',
    no_of_bags: '',
    bardana_weight: '',
    quality_deduction: '',
    igp_no: '',
    igp_date: '',
    vendor_name: '',
    vehicle_no: '',
    net_supplier_weight: '',
    bag_condition: '',
    supplier_weight: '',
    sup_weight_wthout_bardana: '',
    bardana_type_id: '',
  };

  const [formData, setFormData] = useState<PurchaseFormData>(initialFormData);
  const [itemData, setItemData] = useState<ItemData>(initialItemData);
  const [onlineMode, setOnlineMode] = useState(true);
  const [igpItems, setIgpItems] = useState<IGPItem[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);

  // Get camera data for video display
  const { data: camera = { id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 } } = useQuery({
    queryKey: ['/api/cameras/default'],
    staleTime: 5 * 60 * 1000,
  });

  // Get existing purchases to determine next slip number
  const { data: purchases = [] } = useQuery({
    queryKey: ['/api/purchases'],
    staleTime: 30 * 1000,
  });

  // Fetch IGP data mutation
  const fetchIgpMutation = useMutation({
    mutationFn: async (igpNo: string) => {
      const response = await fetch(`/api/igp-data?igp_no=${igpNo}`);
      if (!response.ok) {
        throw new Error('Failed to fetch IGP data');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.items && data.items.length > 0) {
        const items = data.items;
        const firstItem = items[0];
        
        // Update form data with IGP information
        setFormData(prev => ({
          ...prev,
          driverName: firstItem.driver_name || '',
          vendor: firstItem.vendor_name || '',
          vehicleNo: firstItem.vehicle_no || '',
          bardanaWeight: firstItem.bardana_qty ? String(firstItem.bardana_qty) : '',
        }));

        setIgpItems(items);
      } else {
        alert('No data found for this IGP number.');
        setIgpItems([]);
      }
    },
    onError: (error) => {
      console.error('Error fetching IGP data:', error);
      alert('Failed to fetch IGP data. Please check the IGP number.');
      setIgpItems([]);
    },
  });

  // Save purchase mutation
  const savePurchaseMutation = useMutation({
    mutationFn: async (purchaseData: any) => {
      return apiRequest('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(purchaseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data) => {
      console.log('Purchase saved successfully:', data);
      alert('Purchase saved successfully!');
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
    },
    onError: (error) => {
      console.error('Error saving purchase:', error);
      alert('Error saving purchase. Please try again.');
    },
  });

  // Format datetime for input fields
  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle item input changes
  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle online/offline mode
  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
  };

  // Fetch IGP data
  const fetchIgpData = () => {
    if (!formData.igpNo) {
      alert('Please enter IGP number');
      return;
    }
    fetchIgpMutation.mutate(formData.igpNo);
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setItemData(initialItemData);
    setIgpItems([]);
    setPurchaseItems([]);
    setOnlineMode(true);
  };

  // Save purchase
  const handleSaveAll = () => {
    if (savePurchaseMutation.isPending) return;

    // Prepare master data
    const masterPayload = {
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
    };

    // Prepare purchase items
    const purchase_items = purchaseItems.map((item) => ({
      wb_item_p_id: item.wb_item_p_id ? parseInt(String(item.wb_item_p_id), 10) : null,
      manual_dc_no: item.manual_dc_no || null,
      do_id: item.do_id ? parseInt(String(item.do_id), 10) : null,
      item_id: item.item_id ? parseInt(String(item.item_id), 10) : null,
      item_desc: item.item_desc || null,
      created_by: item.created_by ? parseInt(String(item.created_by), 10) : null,
      creation_date: item.creation_date || null,
      last_updated_by: item.last_updated_by ? parseInt(String(item.last_updated_by), 10) : null,
      last_updated_date: item.last_updated_date || null,
      po_id: item.po_id ? parseInt(String(item.po_id), 10) : null,
      po_no: item.po_no || null,
      po_qty: item.po_qty ? parseFloat(String(item.po_qty)) : null,
      igp_qty: item.igp_qty ? parseFloat(String(item.igp_qty)) : null,
      balance_qty: item.balance_qty ? parseFloat(String(item.balance_qty)) : null,
      bardana_type: item.bardana_type || null,
      igp_no: item.igp_no || null,
      manual_igp_no: item.manual_igp_no || null,
      igp_id: item.igp_id ? parseInt(String(item.igp_id), 10) : null,
      vendor_id: item.vendor_id ? parseInt(String(item.vendor_id), 10) : null,
      vendor_name: item.vendor_name || null,
      no_of_bags: item.no_of_bags ? parseInt(String(item.no_of_bags), 10) : null,
      weight_per_bags: item.weight_per_bags ? parseFloat(String(item.weight_per_bags)) : null,
      bardana_weight: item.bardana_weight ? parseFloat(String(item.bardana_weight)) : null,
      igp_date: item.igp_date || null,
      quality_deduction: item.quality_deduction ? parseFloat(String(item.quality_deduction)) : null,
      supplier_weight: item.supplier_weight ? parseFloat(String(item.supplier_weight)) : null,
      sup_weight_wthout_bardana: item.sup_weight_wthout_bardana ? parseFloat(String(item.sup_weight_wthout_bardana)) : null,
      net_supplier_weight: item.net_supplier_weight ? parseFloat(String(item.net_supplier_weight)) : null,
      bag_condition: item.bag_condition || null,
      bardana_type_id: item.bardana_type_id ? parseInt(String(item.bardana_type_id), 10) : null,
    }));

    // Combine master and detail into payload
    const payload = {
      ...masterPayload,
      purchase_items,
    };

    savePurchaseMutation.mutate(payload);
  };

  // Initialize form on component mount
  useEffect(() => {
    // Set next slip number
    if (purchases.length > 0) {
      const maxSlip = purchases.reduce((max: number, curr: any) => {
        const slip = parseInt(curr.slip_no, 10);
        return slip > max ? slip : max;
      }, 0);
      const nextSlip = (maxSlip + 1).toString();
      setFormData(prev => ({ ...prev, slipNo: nextSlip }));
    } else {
      setFormData(prev => ({ ...prev, slipNo: '1' }));
    }

    // Set current time
    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: formatDatetimeLocal(now),
    }));
  }, [purchases]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">Purchase Form</h1>
          <div className="flex gap-2">
            <Badge variant={onlineMode ? "default" : "secondary"}>
              {onlineMode ? "ONLINE" : "OFFLINE"}
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">
              2500
            </Badge>
          </div>
        </div>

        {/* Top Control Buttons */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm">Purchase</Button>
                <Button variant="outline" size="sm">Sale</Button>
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="outline" size="sm">|&lt; First</Button>
                <Button variant="outline" size="sm">&lt; Prev</Button>
                <Button variant="outline" size="sm">Next &gt;</Button>
                <Button variant="outline" size="sm">Last &gt;|</Button>
                <Button 
                  onClick={handleSaveAll} 
                  disabled={savePurchaseMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {savePurchaseMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" size="sm">Print</Button>
                <Button variant="outline" size="sm">Reject</Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={onlineMode ? "default" : "outline"} 
                  size="sm"
                  onClick={() => toggleOnlineMode(true)}
                >
                  ONLINE
                </Button>
                <Button 
                  variant={!onlineMode ? "default" : "outline"} 
                  size="sm"
                  onClick={() => toggleOnlineMode(false)}
                >
                  OFFLINE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="slipNo" className="text-black dark:text-white">Slip No</Label>
                  <Input
                    id="slipNo"
                    name="slipNo"
                    value={formData.slipNo}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="netWeight" className="text-black dark:text-white">Net Weight</Label>
                  <Input
                    id="netWeight"
                    name="netWeight"
                    value={formData.netWeight}
                    onChange={handleChange}
                    className="bg-yellow-100"
                  />
                </div>
                <div>
                  <Label htmlFor="freight" className="text-black dark:text-white">Freight</Label>
                  <Input
                    id="freight"
                    name="freight"
                    value={formData.freight}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="remarks" className="text-black dark:text-white">Remarks</Label>
                  <Textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Add remarks"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="firstWeight" className="text-black dark:text-white">First Weight</Label>
                  <Input
                    id="firstWeight"
                    name="firstWeight"
                    value={formData.firstWeight}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="secondWeight" className="text-black dark:text-white">Second Weight</Label>
                  <Input
                    id="secondWeight"
                    name="secondWeight"
                    value={formData.secondWeight}
                    onChange={handleChange}
                    className="text-green-600"
                  />
                </div>
                <div>
                  <Label htmlFor="bardanaWeight" className="text-black dark:text-white">Bardana Weight</Label>
                  <Input
                    id="bardanaWeight"
                    name="bardanaWeight"
                    value={formData.bardanaWeight}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="grossWeight" className="text-black dark:text-white">Gross Weight</Label>
                  <Input
                    id="grossWeight"
                    name="grossWeight"
                    value={formData.grossWeight}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="branch" className="text-black dark:text-white">Branch</Label>
                  <Select name="branch" value={formData.branch} onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Branch 1">Branch 1</SelectItem>
                      <SelectItem value="Branch 2">Branch 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="driverName" className="text-black dark:text-white">Driver Name</Label>
                  <Input
                    id="driverName"
                    name="driverName"
                    value={formData.driverName}
                    onChange={handleChange}
                    placeholder="Enter driver name"
                  />
                </div>
                <div>
                  <Label className="text-black dark:text-white">Date & Time</Label>
                  <Input
                    value={formData.slipInTime}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-green-600 hover:bg-green-700">1st WHT</Button>
                    <Button variant="outline">2nd WHT</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="bg-yellow-500 hover:bg-yellow-600">Clear</Button>
                    <Button variant="outline" className="bg-red-500 hover:bg-red-600 text-white">Exit</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Details Tabs */}
        <Tabs defaultValue="purchase" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="sale">Sale</TabsTrigger>
            <TabsTrigger value="offline">Offline</TabsTrigger>
          </TabsList>

          <TabsContent value="purchase">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Purchase Details Column 1 */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bardana_type" className="text-black dark:text-white">Bardana Type</Label>
                      <Input
                        id="bardana_type"
                        name="bardana_type"
                        value={itemData.bardana_type}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight_per_bags" className="text-black dark:text-white">Wt Per Bag</Label>
                      <Input
                        id="weight_per_bags"
                        name="weight_per_bags"
                        value={itemData.weight_per_bags}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="no_of_bags" className="text-black dark:text-white">No Of Bags</Label>
                      <Input
                        id="no_of_bags"
                        name="no_of_bags"
                        value={itemData.no_of_bags}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bardana_weight" className="text-black dark:text-white">Bardana Wht</Label>
                      <Input
                        id="bardana_weight"
                        name="bardana_weight"
                        value={itemData.bardana_weight}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quality_deduction" className="text-black dark:text-white">Quality Ded</Label>
                      <Input
                        id="quality_deduction"
                        name="quality_deduction"
                        value={itemData.quality_deduction}
                        onChange={handleItemChange}
                      />
                    </div>
                  </div>

                  {/* Purchase Details Column 2 */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="igpNo" className="text-black dark:text-white">IGP No</Label>
                      <Input
                        id="igpNo"
                        name="igpNo"
                        value={formData.igpNo}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            fetchIgpData();
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="igp_date" className="text-black dark:text-white">IGP Date</Label>
                      <Input
                        id="igp_date"
                        name="igp_date"
                        value={itemData.igp_date}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vendor" className="text-black dark:text-white">Vendor</Label>
                      <Input
                        id="vendor"
                        name="vendor"
                        value={formData.vendor}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleNo" className="text-black dark:text-white">Vehicle No</Label>
                      <Input
                        id="vehicleNo"
                        name="vehicleNo"
                        value={formData.vehicleNo}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="net_supplier_weight" className="text-black dark:text-white">Weight</Label>
                        <Input
                          id="net_supplier_weight"
                          name="net_supplier_weight"
                          value={itemData.net_supplier_weight}
                          onChange={handleItemChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="bag_condition" className="text-black dark:text-white">% Bags</Label>
                        <Input
                          id="bag_condition"
                          name="bag_condition"
                          value={itemData.bag_condition}
                          onChange={handleItemChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Purchase Details Column 3 */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="supplier_weight" className="text-black dark:text-white">Supp's Weight</Label>
                      <Input
                        id="supplier_weight"
                        name="supplier_weight"
                        value={itemData.supplier_weight}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sup_weight_wthout_bardana" className="text-black dark:text-white">Sup.Wt - Bardana</Label>
                      <Input
                        id="sup_weight_wthout_bardana"
                        name="sup_weight_wthout_bardana"
                        value={itemData.sup_weight_wthout_bardana}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="net_supplier_weight_2" className="text-black dark:text-white">S.Wts - Our Wt</Label>
                      <Input
                        id="net_supplier_weight_2"
                        name="net_supplier_weight"
                        value={itemData.net_supplier_weight}
                        onChange={handleItemChange}
                      />
                    </div>
                    <div>
                      <Button className="w-full bg-yellow-500 hover:bg-yellow-600">Deduction +</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sale">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Sale tab content here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offline">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Offline tab content here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* IGP Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-black dark:text-white">IGP Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-300 p-2 text-black dark:text-white">Po No</th>
                    <th className="border border-gray-300 p-2 text-black dark:text-white">Item Code</th>
                    <th className="border border-gray-300 p-2 text-black dark:text-white">Item Description</th>
                    <th className="border border-gray-300 p-2 text-black dark:text-white">Po Qty</th>
                    <th className="border border-gray-300 p-2 text-black dark:text-white">IgP Qty</th>
                    <th className="border border-gray-300 p-2 text-black dark:text-white">Balance Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {igpItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-gray-300 p-4 text-center text-black dark:text-white">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    igpItems.map((item, idx) => {
                      const qty = parseFloat(String(item.qty)) || 0;
                      const receivedQty = parseFloat(String(item.received_qty)) || 0;
                      const balanceQty = receivedQty - qty;

                      return (
                        <tr key={idx}>
                          <td className="border border-gray-300 p-2 text-black dark:text-white">{item.po_no || ''}</td>
                          <td className="border border-gray-300 p-2 text-black dark:text-white">{item.item_code || ''}</td>
                          <td className="border border-gray-300 p-2 text-black dark:text-white">{item.item_desc || ''}</td>
                          <td className="border border-gray-300 p-2 text-black dark:text-white">{qty}</td>
                          <td className="border border-gray-300 p-2 text-black dark:text-white">{receivedQty}</td>
                          <td className="border border-gray-300 p-2 text-black dark:text-white">{balanceQty}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side Panel */}
      <div className="w-80 flex flex-col space-y-4 p-4 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
        {/* Camera Feed */}
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-black dark:text-white">Camera Monitor</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="aspect-video bg-black rounded overflow-hidden">
              <VideoStreamFullscreen
                camera={camera}
                isConnected={true}
                isStreaming={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weight Display */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-black dark:text-white">Weight Reading</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <WeightIndicator comPort="COM3" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}