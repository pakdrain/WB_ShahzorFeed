import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Search, Save } from "lucide-react";

export default function SaleReturn() {
  const [searchSlip, setSearchSlip] = useState("");
  const [returnData, setReturnData] = useState({
    originalSlip: "",
    returnReason: "",
    returnQuantity: "",
    returnAmount: "",
    remarks: ""
  });

  const handleSearch = () => {
    // Search for original sale slip logic
    console.log("Searching for slip:", searchSlip);
  };

  const handleSubmit = () => {
    // Submit return request logic
    console.log("Return data:", returnData);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <RotateCcw className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Sale Return</h1>
        </div>

        {/* Search Original Sale */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Original Sale</CardTitle>
            <CardDescription>Enter the original sale slip number to process return</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="searchSlip">Original Slip Number</Label>
                <Input
                  id="searchSlip"
                  value={searchSlip}
                  onChange={(e) => setSearchSlip(e.target.value)}
                  placeholder="Enter slip number..."
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Return Details</CardTitle>
            <CardDescription>Enter the details for the sale return</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="returnReason">Return Reason</Label>
                <Select 
                  value={returnData.returnReason} 
                  onValueChange={(value) => setReturnData({...returnData, returnReason: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged Goods</SelectItem>
                    <SelectItem value="wrong-item">Wrong Item</SelectItem>
                    <SelectItem value="quality">Quality Issues</SelectItem>
                    <SelectItem value="customer-request">Customer Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="returnQuantity">Return Quantity</Label>
                <Input
                  id="returnQuantity"
                  value={returnData.returnQuantity}
                  onChange={(e) => setReturnData({...returnData, returnQuantity: e.target.value})}
                  placeholder="Enter quantity to return"
                  type="number"
                />
              </div>
              
              <div>
                <Label htmlFor="returnAmount">Return Amount</Label>
                <Input
                  id="returnAmount"
                  value={returnData.returnAmount}
                  onChange={(e) => setReturnData({...returnData, returnAmount: e.target.value})}
                  placeholder="Enter return amount"
                  type="number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={returnData.remarks}
                onChange={(e) => setReturnData({...returnData, remarks: e.target.value})}
                placeholder="Additional remarks about the return..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => {
            setSearchSlip("");
            setReturnData({
              originalSlip: "",
              returnReason: "",
              returnQuantity: "",
              returnAmount: "",
              remarks: ""
            });
          }}>
            Clear
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Process Return
          </Button>
        </div>
      </div>
    </div>
  );
}