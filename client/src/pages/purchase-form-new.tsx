import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormData {
  bardanaType: string;
  weightPerBag: string;
  numberOfBags: string;
  bardanaWeight: string;
  qualityDeclaration: string;
  igpNumber: string;
  igpDate: string;
  vendor: string;
  vehicleNumber: string;
  weight: string;
  supplierWeight: string;
  supplierWeightMinusBardana: string;
  supplierWeightMinusOutWeight: string;
  firstWeight: string;
  secondWeight: string;
  netWeight: string;
  grossWeight: string;
}

export default function PurchaseFormNew() {
  const [formData, setFormData] = useState<FormData>({
    bardanaType: 'PP BAGS 100 GR.',
    weightPerBag: '1',
    numberOfBags: '300',
    bardanaWeight: '30',
    qualityDeclaration: '0',
    igpNumber: '4560',
    igpDate: '30-APR-2025',
    vendor: 'BABAR & COMPANY',
    vehicleNumber: 'VRS-128',
    weight: '% Bags',
    supplierWeight: '',
    supplierWeightMinusBardana: '-30',
    supplierWeightMinusOutWeight: '-28250',
    firstWeight: '',
    secondWeight: '',
    netWeight: '',
    grossWeight: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate weights automatically
  const calculateWeights = () => {
    const firstWeight = parseFloat(formData.firstWeight) || 0;
    const secondWeight = parseFloat(formData.secondWeight) || 0;
    const bardanaWeight = parseFloat(formData.bardanaWeight) || 0;
    const supplierWeight = parseFloat(formData.supplierWeight) || 0;
    
    // Net Weight = First Weight - Second Weight
    const netWeight = firstWeight - secondWeight;
    
    // Gross Weight = First Weight - Second Weight - Bardana Weight
    const grossWeight = firstWeight - secondWeight - bardanaWeight;
    
    // Supplier Weight - Bardana
    const supplierWeightMinusBardana = supplierWeight - bardanaWeight;
    
    // Supplier Weight - Out Weight (assuming out weight is second weight)
    const supplierWeightMinusOutWeight = supplierWeight - secondWeight;
    
    setFormData(prev => ({
      ...prev,
      netWeight: netWeight.toString(),
      grossWeight: grossWeight.toString(),
      supplierWeightMinusBardana: supplierWeightMinusBardana.toString(),
      supplierWeightMinusOutWeight: supplierWeightMinusOutWeight.toString()
    }));
  };

  // Auto-calculate weights when values change
  useEffect(() => {
    calculateWeights();
  }, [formData.firstWeight, formData.secondWeight, formData.bardanaWeight, formData.supplierWeight]);

  return (
    <div className="h-screen bg-gray-100 p-4">
      {/* Header Tabs */}
      <div className="mb-4">
        <div className="flex">
          <Button className="bg-blue-600 text-white px-6 py-2 rounded-t-lg border-b-0">Purchase</Button>
          <Button className="bg-gray-300 text-black px-6 py-2 rounded-t-lg border border-gray-400">Sale</Button>
          <Button className="bg-gray-300 text-black px-6 py-2 rounded-t-lg border border-gray-400">Offline</Button>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white border border-gray-400 rounded p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Section - Bardana Details */}
          <div className="col-span-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm font-medium">Bardana Type:</Label>
              <Input
                name="bardanaType"
                value={formData.bardanaType}
                onChange={handleChange}
                className="h-8 text-sm bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm font-medium">Wht Per Bags:</Label>
              <Input
                name="weightPerBag"
                value={formData.weightPerBag}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm font-medium">No Of Bags:</Label>
              <Input
                name="numberOfBags"
                value={formData.numberOfBags}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm font-medium">Bardana Wht:</Label>
              <Input
                name="bardanaWeight"
                value={formData.bardanaWeight}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm font-medium">Quality Decl:</Label>
              <Input
                name="qualityDeclaration"
                value={formData.qualityDeclaration}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Middle Section - IGP Information */}
          <div className="col-span-3 space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">IGP #:</Label>
              <Input
                name="igpNumber"
                value={formData.igpNumber}
                onChange={handleChange}
                className="h-8 text-sm bg-gray-100"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">IGP Date:</Label>
              <Input
                name="igpDate"
                value={formData.igpDate}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Vendor:</Label>
              <Input
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Vehicle No:</Label>
              <Input
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Weight:</Label>
              <Input
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Right Middle Section - Supplier Weights */}
          <div className="col-span-2 space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Supp's Weight:</Label>
              <Input
                name="supplierWeight"
                value={formData.supplierWeight}
                onChange={handleChange}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Sup Wht - Bardana:</Label>
              <Input
                name="supplierWeightMinusBardana"
                value={formData.supplierWeightMinusBardana}
                readOnly
                className="h-8 text-sm bg-gray-50"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">S.Wht - Our Wht:</Label>
              <Input
                name="supplierWeightMinusOutWeight"
                value={formData.supplierWeightMinusOutWeight}
                readOnly
                className="h-8 text-sm bg-gray-50"
              />
            </div>

            {/* Deduction+ Button */}
            <div className="mt-4">
              <Button className="h-10 px-6 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded">
                Deduction +
              </Button>
            </div>
          </div>

          {/* Far Right Section - Bags Table */}
          <div className="col-span-3 space-y-2">
            <div className="border border-gray-400 rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 p-2 text-black font-medium">Bags</th>
                    <th className="border border-gray-400 p-2 text-black font-medium">P/B</th>
                    <th className="border border-gray-400 p-2 text-black font-medium">%age</th>
                    <th className="border border-gray-400 p-2 text-black font-medium">Weight</th>
                    <th className="border border-gray-400 p-2 text-black font-medium">Bag ID</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Empty rows for data entry */}
                  {Array.from({ length: 8 }, (_, i) => (
                    <tr key={i}>
                      <td className="border border-gray-400 p-2 h-8"></td>
                      <td className="border border-gray-400 p-2 h-8"></td>
                      <td className="border border-gray-400 p-2 h-8"></td>
                      <td className="border border-gray-400 p-2 h-8"></td>
                      <td className="border border-gray-400 p-2 h-8"></td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100">
                    <td className="border border-gray-400 p-2 text-center font-medium" colSpan={4}>TOTAL:</td>
                    <td className="border border-gray-400 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Section - Green Table for IGP Data */}
        <div className="mt-6">
          <div className="border border-gray-400 rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-200">
                  <th className="border border-gray-400 p-2 text-black font-medium">Po No</th>
                  <th className="border border-gray-400 p-2 text-black font-medium">Item Code</th>
                  <th className="border border-gray-400 p-2 text-black font-medium">Item Description</th>
                  <th className="border border-gray-400 p-2 text-black font-medium">Po Qty</th>
                  <th className="border border-gray-400 p-2 text-black font-medium">Igp Qty</th>
                  <th className="border border-gray-400 p-2 text-black font-medium">Balance Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-100">
                  <td className="border border-gray-400 p-2 text-center text-black">4148</td>
                  <td className="border border-gray-400 p-2 text-center text-black">0301010002</td>
                  <td className="border border-gray-400 p-2 text-center text-black">WHEAT</td>
                  <td className="border border-gray-400 p-2 text-center text-black">10500</td>
                  <td className="border border-gray-400 p-2 text-center text-black">10500</td>
                  <td className="border border-gray-400 p-2 text-center text-black">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}