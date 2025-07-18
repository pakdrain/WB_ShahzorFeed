
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

export default function EditRecord() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [slipNo, setSlipNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!slipNo || slipNo.trim() === "") {
      alert("Please enter a slip number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/purchase/by-slip/${slipNo.trim()}`);
      
      if (!response.ok) {
        alert(`No record found for slip number ${slipNo}`);
        setSearchResults([]);
        setShowResults(false);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data && data.master) {
        setSearchResults([data]);
        setShowResults(true);
      } else {
        alert("Invalid record data found");
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error("Error searching for slip:", error);
      alert("Failed to search for slip number");
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRecord = (record: any) => {
    const master = record.master;
    const entryType = master.entry_type;
    const isOffline = master.offline_entry === "Yes";
    
    // Determine the correct form URL based on entry type
    let targetUrl = "";
    const modeParam = isOffline ? "offline" : "online";
    
    if (entryType === "PURCHASE") {
      targetUrl = `/purchase-form?type=${modeParam}&edit=${master.wb_id}`;
    } else if (entryType === "PURCHASE_RETURN") {
      targetUrl = `/purchase-return?type=${modeParam}&edit=${master.wb_id}`;
    } else if (entryType === "SALE") {
      targetUrl = `/sales-form?type=${modeParam}&edit=${master.wb_id}`;
    } else if (entryType === "SALE_RETURN") {
      targetUrl = `/sales-return?type=${modeParam}&edit=${master.wb_id}`;
    } else {
      // Default to purchase form if entry type is unclear
      targetUrl = `/purchase-form?type=${modeParam}&edit=${master.wb_id}`;
    }
    
    console.log(`Found ${entryType} entry (${isOffline ? 'Offline' : 'Online'}), navigating to:`, targetUrl);
    
    // Navigate to the appropriate form
    window.location.href = targetUrl;
  };

  const handleGoBack = () => {
    // Go back to the previous page
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Edit Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="slipNo" className="text-sm font-medium">
                  Slip Number
                </Label>
                <Input
                  id="slipNo"
                  placeholder="Enter slip number to search"
                  value={slipNo}
                  onChange={(e) => setSlipNo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="mt-1"
                />
              </div>
              
              <div className="flex justify-center gap-4">
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
                <Button variant="outline" onClick={handleGoBack}>
                  Go Back
                </Button>
              </div>
            </div>

            {/* Results Section */}
            {showResults && searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Results</h3>
                {searchResults.map((record, index) => {
                  const master = record.master;
                  const details = record.details && record.details.length > 0 ? record.details[0] : {};
                  
                  return (
                    <Card key={index} className="border-2 border-blue-200">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Slip No</Label>
                            <p className="text-sm font-semibold">{master.slip_no}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Entry Type</Label>
                            <p className="text-sm font-semibold">{master.entry_type}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Vehicle No</Label>
                            <p className="text-sm">{details.vehicle_no || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Mode</Label>
                            <p className="text-sm">{master.offline_entry === "Yes" ? "Offline" : "Online"}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Vendor/Customer</Label>
                            <p className="text-sm">{details.vendor_name || details.customer_name || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">IGP/DC No</Label>
                            <p className="text-sm">{details.igp_no || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">First Weight</Label>
                            <p className="text-sm">{master.first_weight || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Net Weight</Label>
                            <p className="text-sm">{master.net_weight || "N/A"}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-center">
                          <Button 
                            onClick={() => handleLoadRecord(record)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Load Record
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* No Results Message */}
            {showResults && searchResults.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No records found for the specified slip number.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
