
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";

export default function GetData() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
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

    setIsLoading(true);
    try {
      const response = await fetch("/api/fetch-and-save-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch data");
      }

      setFetchedData(result.data);
      toast({
        title: "Success",
        description: `Successfully fetched and saved ${result.recordsInserted} records to inv_items table`,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch and save data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-2">
          <Download className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Get Data</h1>
        </div>

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
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={handleFetchData}
              disabled={isLoading || !url.trim()}
              className="w-full"
            >
              {isLoading ? (
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
          </CardContent>
        </Card>

        {fetchedData && (
          <Card>
            <CardHeader>
              <CardTitle>Fetched Data Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
                {JSON.stringify(fetchedData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
