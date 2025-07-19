import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GetData() {
  const [url, setUrl] = useState("");
  const [vendorUrl, setVendorUrl] = useState("");
  const [sysConfigUrl, setSysConfigUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [sysConfigLoading, setSysConfigLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [vendorMessage, setVendorMessage] = useState("");
  const [sysConfigMessage, setSysConfigMessage] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [vendorResponse, setVendorResponse] = useState<any>(null);
  const [sysConfigResponse, setSysConfigResponse] = useState<any>(null);
  const [chartAccountsUrl, setChartAccountsUrl] = useState("");
  const [chartAccountsLoading, setChartAccountsLoading] = useState(false);
  const [chartAccountsMessage, setChartAccountsMessage] = useState("");
  const [chartAccountsResponse, setChartAccountsResponse] = useState<any>(null);

  const { toast } = useToast();

  const handleFetchData = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMessage("");
    setResponse(null);

    try {
      const response = await fetch("/api/fetch-and-save-vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || "Failed to fetch data");
      }

      setResponse(result);
      setMessage(`✅ Successfully fetched and saved ${result.recordsInserted} records to ${result.targetTable} table`);
      toast({
        title: "Success",
        description: `Successfully fetched and saved ${result.recordsInserted} records to ${result.targetTable} table`,
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMsg = error.message || "Failed to fetch and save data";
      setMessage(`❌ Error: ${errorMsg}`);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAndSaveVendorData = async () => {
    if (!vendorUrl.trim()) {
      setVendorMessage("Please enter a URL");
      return;
    }

    setVendorLoading(true);
    setVendorMessage("");
    setVendorResponse(null);

    try {
      const response = await fetch("/api/fetch-and-save-vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: vendorUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setVendorMessage(
          `✅ ${data.message} (${data.recordsInserted} records inserted into ${data.targetTable})`,
        );
        setVendorResponse(data);
      } else {
        setVendorMessage(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setVendorMessage(`❌ Network error: ${error.message}`);
    } finally {
      setVendorLoading(false);
    }
  };

  const fetchAndSaveSysConfigData = async () => {
    if (!sysConfigUrl.trim()) {
      setSysConfigMessage("Please enter a URL");
      return;
    }

    setSysConfigLoading(true);
    setSysConfigMessage("");
    setSysConfigResponse(null);

    try {
      const response = await fetch("/api/fetch-and-save-sys-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: sysConfigUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setSysConfigMessage(
          `✅ ${data.message} (${data.recordsInserted} records inserted into ${data.targetTable || 'sys_data_configg'} table)`,
        );
        setSysConfigResponse(data);
      } else {
        setSysConfigMessage(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setSysConfigMessage(`❌ Network error: ${error.message}`);
    } finally {
      setSysConfigLoading(false);
    }
  };

    const fetchAndSaveChartAccountsData = async () => {
    if (!chartAccountsUrl.trim()) {
      setChartAccountsMessage("Please enter a URL");
      return;
    }

    setChartAccountsLoading(true);
    setChartAccountsMessage("");
    setChartAccountsResponse(null);

    try {
      const response = await fetch("/api/fetch-and-save-chart-accounts", { //  Assuming you'll create a new api endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: chartAccountsUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        setChartAccountsMessage(
          `✅ ${data.message} (${data.recordsInserted} records inserted into chart_of_accounts table)`,
        );
        setChartAccountsResponse(data);
      } else {
        setChartAccountsMessage(`❌ Error: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      setChartAccountsMessage(`❌ Network error: ${error.message}`);
    } finally {
      setChartAccountsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-2">
          <Download className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Get Data</h1>
        </div>

        {/* URL Data Section */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch Data from URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Enter URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/api/data"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button
              onClick={handleFetchData}
              disabled={loading || !url.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching Data...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Fetch and Save Data
                </>
              )}
            </Button>

            {message && (
              <Alert className={message.includes("✅") ? "border-green-500" : "border-red-500"}>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle>Fetched Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Vendor Data Section */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch and Save Vendor Data</CardTitle>
            <CardDescription>
              Enter API URL to fetch vendor/customer data and save to database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter vendor/customer API URL..."
                value={vendorUrl}
                onChange={(e) => setVendorUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={fetchAndSaveVendorData}
                disabled={vendorLoading}
                className="px-6"
              >
                {vendorLoading ? "Fetching..." : "Fetch & Save Vendors"}
              </Button>
            </div>

            {vendorMessage && (
              <Alert className={vendorMessage.includes("✅") ? "border-green-500" : "border-red-500"}>
                <AlertDescription>{vendorMessage}</AlertDescription>
              </Alert>
            )}

            {vendorResponse && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Response Preview:</h4>
                <pre className="text-sm overflow-auto max-h-40">
                  {JSON.stringify(vendorResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Config Data Section */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch and Save System Config Data</CardTitle>
            <CardDescription>
              Enter API URL to fetch system configuration data and save to sys_data_configg table
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter system config API URL..."
                value={sysConfigUrl}
                onChange={(e) => setSysConfigUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={fetchAndSaveSysConfigData}
                disabled={sysConfigLoading}
                className="px-6"
              >
                {sysConfigLoading ? "Fetching..." : "Fetch & Save Config"}
              </Button>
            </div>

            {sysConfigMessage && (
              <Alert className={sysConfigMessage.includes("✅") ? "border-green-500" : "border-red-500"}>
                <AlertDescription>{sysConfigMessage}</AlertDescription>
              </Alert>
            )}

            {sysConfigResponse && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Response Preview:</h4>
                <pre className="text-sm overflow-auto max-h-40">
                  {JSON.stringify(sysConfigResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart of Accounts Data Section */}
        <Card>
          <CardHeader>
            <CardTitle>Fetch and Save Chart of Accounts Data</CardTitle>
            <CardDescription>
              Enter API URL to fetch Chart of Accounts data and save to chart_of_accounts table
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter Chart of Accounts API URL..."
                value={chartAccountsUrl}
                onChange={(e) => setChartAccountsUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={fetchAndSaveChartAccountsData}
                disabled={chartAccountsLoading}
                className="px-6"
              >
                {chartAccountsLoading ? "Fetching..." : "Fetch & Save Chart Accounts"}
              </Button>
            </div>

            {chartAccountsMessage && (
              <Alert className={chartAccountsMessage.includes("✅") ? "border-green-500" : "border-red-500"}>
                <AlertDescription>{chartAccountsMessage}</AlertDescription>
              </Alert>
            )}

            {chartAccountsResponse && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Response Preview:</h4>
                <pre className="text-sm overflow-auto max-h-40">
                  {JSON.stringify(chartAccountsResponse.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}