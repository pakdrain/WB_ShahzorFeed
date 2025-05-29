import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VideoStreamFullscreen from "@/components/video-stream-fullscreen";
import WeightIndicator from "@/components/weight-indicator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  // Get camera data with proper typing
  const { data: camera } = useQuery({
    queryKey: ['/api/cameras/default'],
    staleTime: 5 * 60 * 1000,
    select: (data: any) => data || { id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }
  });

  // Get existing purchases with proper typing  
  const { data: purchases } = useQuery<any[]>({
    queryKey: ['/api/purchases'],
    staleTime: 30 * 1000,
    select: (data: any) => data || []
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
      const response = await fetch('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(purchaseData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to save purchase');
      }
      
      return response.json();
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

  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return '';
    return isoString.slice(0, 16);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  const toggleOnlineMode = (isOnline: boolean) => {
    setOnlineMode(isOnline);
  };

  const fetchIgpData = () => {
    if (!formData.igpNo) {
      alert('Please enter IGP number');
      return;
    }
    fetchIgpMutation.mutate(formData.igpNo);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setItemData(initialItemData);
    setIgpItems([]);
    setOnlineMode(true);
  };

  const handleSaveAll = () => {
    if (savePurchaseMutation.isPending) return;

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
      purchase_items: [],
    };

    savePurchaseMutation.mutate(masterPayload);
  };

  useEffect(() => {
    if (purchases && purchases.length > 0) {
      const maxSlip = purchases.reduce((max: number, curr: any) => {
        const slip = parseInt(curr.slip_no || "0", 10);
        return slip > max ? slip : max;
      }, 0);
      const nextSlip = (maxSlip + 1).toString();
      setFormData(prev => ({ ...prev, slipNo: nextSlip }));
    } else {
      setFormData(prev => ({ ...prev, slipNo: '1' }));
    }

    const now = new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      slipInTime: formatDatetimeLocal(now),
    }));
  }, [purchases]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Main Content - Compact Layout */}
      <div className="flex-1 p-2 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Purchase Form</h1>
          <div className="flex gap-2">
            <Badge variant={onlineMode ? "default" : "secondary"}>
              {onlineMode ? "ONLINE" : "OFFLINE"}
            </Badge>
            <Badge variant="outline" className="text-lg px-3 py-1">2500</Badge>
          </div>
        </div>

        {/* Top Control Buttons */}
        <Card className="mb-2">
          <CardContent className="p-2">
            <div className="flex flex-wrap gap-1 justify-between items-center text-xs">
              <div className="flex gap-1 flex-wrap">
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Purchase</Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Sale</Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Edit</Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">|&lt; First</Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">&lt; Prev</Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Next &gt;</Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Last &gt;|</Button>
                <Button 
                  onClick={handleSaveAll} 
                  disabled={savePurchaseMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 h-6 px-2 text-xs"
                  size="sm"
                >
                  {savePurchaseMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Print</Button>
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs">Reject</Button>
              </div>
              <div className="flex gap-1">
                <Button 
                  variant={onlineMode ? "default" : "outline"} 
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => toggleOnlineMode(true)}
                >
                  ONLINE
                </Button>
                <Button 
                  variant={!onlineMode ? "default" : "outline"} 
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => toggleOnlineMode(false)}
                >
                  OFFLINE
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form - Compact */}
        <div className="flex-1 flex gap-2 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Card className="mb-2">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {/* Column 1 */}
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-black dark:text-white">Slip No</Label>
                      <Input
                        name="slipNo"
                        value={formData.slipNo}
                        readOnly
                        className="h-7 text-xs bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Net Weight</Label>
                      <Input
                        name="netWeight"
                        value={formData.netWeight}
                        onChange={handleChange}
                        className="h-7 text-xs bg-yellow-100"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Freight</Label>
                      <Input
                        name="freight"
                        value={formData.freight}
                        onChange={handleChange}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Remarks</Label>
                      <Textarea
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        placeholder="Add remarks"
                        className="h-16 text-xs"
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-black dark:text-white">First Weight</Label>
                      <Input
                        name="firstWeight"
                        value={formData.firstWeight}
                        onChange={handleChange}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Second Weight</Label>
                      <Input
                        name="secondWeight"
                        value={formData.secondWeight}
                        onChange={handleChange}
                        className="h-7 text-xs text-green-600"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Bardana Weight</Label>
                      <Input
                        name="bardanaWeight"
                        value={formData.bardanaWeight}
                        onChange={handleChange}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Gross Weight</Label>
                      <Input
                        name="grossWeight"
                        value={formData.grossWeight}
                        readOnly
                        className="h-7 text-xs bg-gray-100"
                      />
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-black dark:text-white">Branch</Label>
                      <Select value={formData.branch} onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value }))}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Branch 1">Branch 1</SelectItem>
                          <SelectItem value="Branch 2">Branch 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Driver Name</Label>
                      <Input
                        name="driverName"
                        value={formData.driverName}
                        onChange={handleChange}
                        placeholder="Enter driver name"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-black dark:text-white">Date & Time</Label>
                      <Input
                        value={formData.slipInTime}
                        readOnly
                        className="h-7 text-xs bg-gray-100"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <Button className="bg-green-600 hover:bg-green-700 h-6 text-xs">1st WHT</Button>
                      <Button variant="outline" className="h-6 text-xs">2nd WHT</Button>
                      <Button className="bg-yellow-500 hover:bg-yellow-600 h-6 text-xs">Clear</Button>
                      <Button className="bg-red-500 hover:bg-red-600 text-white h-6 text-xs">Exit</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Details - Compact Tabs */}
            <Tabs defaultValue="purchase" className="mb-2">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="purchase" className="text-xs">Purchase</TabsTrigger>
                <TabsTrigger value="sale" className="text-xs">Sale</TabsTrigger>
                <TabsTrigger value="offline" className="text-xs">Offline</TabsTrigger>
              </TabsList>

              <TabsContent value="purchase" className="mt-2">
                <Card>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      {/* Purchase Column 1 */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-black dark:text-white">Bardana Type</Label>
                          <Input name="bardana_type" value={itemData.bardana_type} onChange={handleItemChange} className="h-7 text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs text-black dark:text-white">Wt Per Bag</Label>
                          <Input name="weight_per_bags" value={itemData.weight_per_bags} onChange={handleItemChange} className="h-7 text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs text-black dark:text-white">No Of Bags</Label>
                          <Input name="no_of_bags" value={itemData.no_of_bags} onChange={handleItemChange} className="h-7 text-xs" />
                        </div>
                      </div>

                      {/* Purchase Column 2 */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-black dark:text-white">IGP No</Label>
                          <Input
                            name="igpNo"
                            value={formData.igpNo}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                fetchIgpData();
                              }
                            }}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-black dark:text-white">IGP Date</Label>
                          <Input name="igp_date" value={itemData.igp_date} onChange={handleItemChange} className="h-7 text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs text-black dark:text-white">Vendor</Label>
                          <Input name="vendor" value={formData.vendor} onChange={handleChange} className="h-7 text-xs" />
                        </div>
                      </div>

                      {/* Purchase Column 3 */}
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-black dark:text-white">Vehicle No</Label>
                          <Input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="h-7 text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs text-black dark:text-white">Supplier Weight</Label>
                          <Input name="supplier_weight" value={itemData.supplier_weight} onChange={handleItemChange} className="h-7 text-xs" />
                        </div>
                        <div>
                          <Button className="w-full bg-yellow-500 hover:bg-yellow-600 h-6 text-xs">Deduction +</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sale" className="mt-2">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-center text-sm text-muted-foreground">Sale tab content here</div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="offline" className="mt-2">
                <Card>
                  <CardContent className="p-3">
                    <div className="text-center text-sm text-muted-foreground">Offline tab content here</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* IGP Data Table - Compact */}
            <Card>
              <CardHeader className="p-2">
                <CardTitle className="text-sm text-black dark:text-white">IGP Data</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="overflow-x-auto max-h-32">
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border border-gray-300 p-1 text-black dark:text-white">Po No</th>
                        <th className="border border-gray-300 p-1 text-black dark:text-white">Item Code</th>
                        <th className="border border-gray-300 p-1 text-black dark:text-white">Item Description</th>
                        <th className="border border-gray-300 p-1 text-black dark:text-white">Po Qty</th>
                        <th className="border border-gray-300 p-1 text-black dark:text-white">IgP Qty</th>
                        <th className="border border-gray-300 p-1 text-black dark:text-white">Balance Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {igpItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="border border-gray-300 p-2 text-center text-black dark:text-white">
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
                              <td className="border border-gray-300 p-1 text-black dark:text-white">{item.po_no || ''}</td>
                              <td className="border border-gray-300 p-1 text-black dark:text-white">{item.item_code || ''}</td>
                              <td className="border border-gray-300 p-1 text-black dark:text-white">{item.item_desc || ''}</td>
                              <td className="border border-gray-300 p-1 text-black dark:text-white">{qty}</td>
                              <td className="border border-gray-300 p-1 text-black dark:text-white">{receivedQty}</td>
                              <td className="border border-gray-300 p-1 text-black dark:text-white">{balanceQty}</td>
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
        </div>
      </div>

      {/* Right Side Panel - Camera & Weight */}
      <div className="w-72 flex flex-col space-y-2 p-2 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
        {/* Camera Feed */}
        <Card className="flex-1">
          <CardHeader className="p-2">
            <CardTitle className="text-sm text-black dark:text-white">Camera Monitor</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="aspect-video bg-black rounded overflow-hidden">
              <VideoStreamFullscreen
                camera={camera || { id: 1, name: "Camera 01", ip: "10.10.10.146", port: 554 }}
                isConnected={true}
                isStreaming={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weight Display */}
        <Card className="flex-shrink-0">
          <CardHeader className="p-2">
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