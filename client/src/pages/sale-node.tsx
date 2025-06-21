import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Network, Plus, Save, Trash2 } from "lucide-react";

interface NodeItem {
  id: string;
  itemCode: string;
  itemDesc: string;
  quantity: string;
  rate: string;
  amount: string;
}

export default function SaleNode() {
  const [nodeData, setNodeData] = useState({
    nodeId: "",
    nodeName: "",
    customerName: "",
    customerContact: "",
    deliveryAddress: "",
    status: "pending",
    remarks: ""
  });

  const [items, setItems] = useState<NodeItem[]>([
    {
      id: "1",
      itemCode: "",
      itemDesc: "",
      quantity: "",
      rate: "",
      amount: ""
    }
  ]);

  const addItem = () => {
    const newItem: NodeItem = {
      id: Date.now().toString(),
      itemCode: "",
      itemDesc: "",
      quantity: "",
      rate: "",
      amount: ""
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof NodeItem, value: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        // Auto-calculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          const qty = parseFloat(field === 'quantity' ? value : updatedItem.quantity) || 0;
          const rate = parseFloat(field === 'rate' ? value : updatedItem.rate) || 0;
          updatedItem.amount = (qty * rate).toString();
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = () => {
    // Submit sale node logic
    console.log("Sale node data:", { nodeData, items });
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Network className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Sale Node</h1>
        </div>

        {/* Node Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Node Information</CardTitle>
            <CardDescription>Enter the sale node details and customer information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="nodeId">Node ID</Label>
                <Input
                  id="nodeId"
                  value={nodeData.nodeId}
                  onChange={(e) => setNodeData({...nodeData, nodeId: e.target.value})}
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              
              <div>
                <Label htmlFor="nodeName">Node Name</Label>
                <Input
                  id="nodeName"
                  value={nodeData.nodeName}
                  onChange={(e) => setNodeData({...nodeData, nodeName: e.target.value})}
                  placeholder="Enter node name"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={nodeData.status} 
                  onValueChange={(value) => setNodeData({...nodeData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={nodeData.customerName}
                  onChange={(e) => setNodeData({...nodeData, customerName: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <Label htmlFor="customerContact">Customer Contact</Label>
                <Input
                  id="customerContact"
                  value={nodeData.customerContact}
                  onChange={(e) => setNodeData({...nodeData, customerContact: e.target.value})}
                  placeholder="Enter contact number"
                />
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Textarea
                id="deliveryAddress"
                value={nodeData.deliveryAddress}
                onChange={(e) => setNodeData({...nodeData, deliveryAddress: e.target.value})}
                placeholder="Enter delivery address..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sale Items</CardTitle>
              <CardDescription>Add items for this sale node</CardDescription>
            </div>
            <Button onClick={addItem} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                  <div>
                    <Label>Item Code</Label>
                    <Input
                      value={item.itemCode}
                      onChange={(e) => updateItem(item.id, 'itemCode', e.target.value)}
                      placeholder="Code"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label>Item Description</Label>
                    <Input
                      value={item.itemDesc}
                      onChange={(e) => updateItem(item.id, 'itemDesc', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      type="number"
                    />
                  </div>
                  
                  <div>
                    <Label>Rate</Label>
                    <Input
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', e.target.value)}
                      placeholder="Rate"
                      type="number"
                    />
                  </div>
                  
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Label>Amount</Label>
                      <Input
                        value={item.amount}
                        readOnly
                        placeholder="0.00"
                        className="bg-gray-50"
                      />
                    </div>
                    {items.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-end mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Amount:</div>
                <div className="text-xl font-bold">{totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Additional Information
              <Badge className={getStatusColor(nodeData.status)}>
                {nodeData.status.charAt(0).toUpperCase() + nodeData.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={nodeData.remarks}
                onChange={(e) => setNodeData({...nodeData, remarks: e.target.value})}
                placeholder="Additional remarks..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => {
            setNodeData({
              nodeId: "",
              nodeName: "",
              customerName: "",
              customerContact: "",
              deliveryAddress: "",
              status: "pending",
              remarks: ""
            });
            setItems([{
              id: "1",
              itemCode: "",
              itemDesc: "",
              quantity: "",
              rate: "",
              amount: ""
            }]);
          }}>
            Clear
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Node
          </Button>
        </div>
      </div>
    </div>
  );
}