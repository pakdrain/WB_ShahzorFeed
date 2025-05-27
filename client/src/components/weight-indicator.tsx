import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Scale, Wifi, WifiOff } from 'lucide-react';

interface WeightIndicatorProps {
  comPort?: string;
}

export default function WeightIndicator({ comPort = 'COM3' }: WeightIndicatorProps) {
  const [weight, setWeight] = useState<string>('0.00');
  const [isConnected, setIsConnected] = useState(false);
  const [unit, setUnit] = useState('kg');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const connectToSerialPort = async () => {
      try {
        // Try to connect to local serial port service
        const response = await fetch(`http://localhost:3001/api/weight/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ port: comPort, baudRate: 9600 }),
        });

        if (response.ok) {
          setIsConnected(true);
          startWeightPolling();
        } else {
          console.log('Serial service not available, using fallback');
          startFallbackMode();
        }
      } catch (error) {
        console.log('Serial service not available, using fallback');
        startFallbackMode();
      }
    };

    const startWeightPolling = () => {
      interval = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:3001/api/weight/data');
          if (response.ok) {
            const data = await response.json();
            setWeight(data.weight || '0.00');
            setUnit(data.unit || 'kg');
            setLastUpdate(new Date());
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error fetching weight data:', error);
          setIsConnected(false);
        }
      }, 500); // Poll every 500ms for real-time updates
    };

    const startFallbackMode = () => {
      setIsConnected(false);
      setWeight('0.00');
      setUnit('kg');
    };

    connectToSerialPort();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [comPort]);

  const handleTare = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/weight/tare', {
        method: 'POST',
      });
      
      if (response.ok) {
        console.log('⚖️ Tare command sent to scale');
      } else {
        console.log('⚖️ Tare function not available - serial service needed');
      }
    } catch (error) {
      console.log('⚖️ Tare function not available - serial service needed');
    }
  };

  const formatWeight = (weightValue: string) => {
    const num = parseFloat(weightValue);
    return num.toFixed(2);
  };

  return (
    <Card className="bg-monitoring-slate border-monitoring-gray">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Scale className="h-5 w-5 text-monitoring-blue" />
          Weight Indicator
          <div className="ml-auto flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center space-x-1">
                <Wifi className="h-4 w-4 text-monitoring-green" />
                <span className="text-xs text-monitoring-green">Connected</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <WifiOff className="h-4 w-4 text-monitoring-red" />
                <span className="text-xs text-monitoring-red">Disconnected</span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weight Display */}
        <div className="bg-black rounded-lg p-6 border border-monitoring-gray">
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-monitoring-green mb-2">
              {formatWeight(weight)}
            </div>
            <div className="text-xl text-gray-400 font-medium">
              {unit.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="com-port" className="text-sm text-gray-300">
              COM Port
            </Label>
            <Input
              id="com-port"
              value={comPort}
              readOnly
              className="bg-monitoring-dark border-monitoring-gray text-white font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleTare}
              disabled={!isConnected}
              className="w-full bg-monitoring-blue hover:bg-monitoring-blue/80 text-white"
            >
              TARE
            </Button>
          </div>
        </div>

        {/* Status Info */}
        <div className="text-xs text-gray-400 space-y-1">
          <div>Status: {isConnected ? 'Online' : 'Offline'}</div>
          <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
          <div>Port: {comPort} @ 9600 baud</div>
        </div>
      </CardContent>
    </Card>
  );
}