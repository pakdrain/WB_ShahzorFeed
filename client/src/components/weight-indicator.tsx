import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Scale, Wifi, WifiOff } from 'lucide-react';

interface WeightIndicatorProps {
  comPort?: string;
}

interface CompactWeightIndicatorProps {
  comPort?: string;
  compact?: boolean;
}

export default function WeightIndicator({ comPort = 'COM6', compact = false }: CompactWeightIndicatorProps) {
  const [weight, setWeight] = useState<string>('0.00');
  const [isConnected, setIsConnected] = useState(false);
  const [unit, setUnit] = useState('kg');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const connectToSerialPort = async () => {
      try {
        // Try to connect to local serial port service
        const response = await fetch(`/api/weight/connect`, {
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
          const response = await fetch('/api/weight/data');
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
      const response = await fetch('/api/weight/tare', {
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

  // Compact version for top bar
  if (compact) {
    return (
      <div className="flex items-center bg-gradient-to-r from-orange-500 to-red-600 rounded px-4 py-1 text-white text-sm font-mono border border-gray-300 shadow-sm">
        <Scale className="w-4 h-4 mr-1" />
        <span className="font-black text-base">{formatWeight(weight)}</span>
        <span className="ml-1 text-xs font-bold">{unit.toUpperCase()}</span>
        {isConnected ? (
          <Wifi className="w-4 h-4 ml-2 text-green-300" />
        ) : (
          <WifiOff className="w-4 h-4 ml-2 text-red-300" />
        )}
      </div>
    );
  }

  // Full version for main display
  return (
    <div className="text-center space-y-8">
      {/* Clean Weight Display - Only essential elements */}
      <div className="bg-black rounded-lg p-8 border border-monitoring-gray">
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-monitoring-green mb-3">
            {formatWeight(weight)}
          </div>
          <div className="text-2xl text-gray-400 font-medium">
            {unit.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Simple TARE button */}
      <Button
        onClick={handleTare}
        disabled={!isConnected}
        className="px-8 py-3 bg-monitoring-blue hover:bg-monitoring-blue/80 text-white text-lg"
      >
        TARE
      </Button>
    </div>
  );
}