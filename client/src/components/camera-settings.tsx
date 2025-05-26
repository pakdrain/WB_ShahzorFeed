import { useState } from 'react';
import { Settings, Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

interface CameraSettingsProps {
  isStreaming: boolean;
  isConnected: boolean;
  onStartStream: () => void;
  onStopStream: () => void;
  onReconnect: () => void;
  onFullscreen: () => void;
}

export default function CameraSettings({
  isStreaming,
  isConnected,
  onStartStream,
  onStopStream,
  onReconnect,
  onFullscreen,
}: CameraSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-monitoring-slate border-monitoring-gray hover:bg-monitoring-gray">
          <Settings className="h-4 w-4 text-gray-300" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-monitoring-slate border-monitoring-gray text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-monitoring-blue">Camera Settings</DialogTitle>
          <DialogDescription className="text-gray-400">
            Control your camera stream and display options
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Stream Controls */}
          <Card className="bg-monitoring-dark border-monitoring-gray p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Stream Control</h3>
            <div className="flex gap-2">
              {!isStreaming ? (
                <Button 
                  onClick={() => {
                    onStartStream();
                    setIsOpen(false);
                  }}
                  className="bg-monitoring-green hover:bg-green-600 text-white flex-1"
                  disabled={!isConnected}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Live Stream
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    onStopStream();
                    setIsOpen(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Stream
                </Button>
              )}
            </div>
          </Card>

          {/* Connection Controls */}
          <Card className="bg-monitoring-dark border-monitoring-gray p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Connection</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status:</span>
                <span className={`text-sm font-medium ${isConnected ? 'text-monitoring-green' : 'text-red-400'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <Button 
                onClick={onReconnect}
                variant="outline" 
                size="sm"
                className="w-full bg-monitoring-slate border-monitoring-gray hover:bg-monitoring-gray text-gray-300"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reconnect Camera
              </Button>
            </div>
          </Card>

          {/* Display Controls */}
          <Card className="bg-monitoring-dark border-monitoring-gray p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Display</h3>
            <Button 
              onClick={() => {
                onFullscreen();
                setIsOpen(false);
              }}
              variant="outline" 
              size="sm"
              className="w-full bg-monitoring-slate border-monitoring-gray hover:bg-monitoring-gray text-gray-300"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen View
            </Button>
          </Card>

          {/* Camera Info */}
          <Card className="bg-monitoring-dark border-monitoring-gray p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Camera Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">IP Address:</span>
                <span className="text-gray-300 font-mono">10.10.10.146</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Port:</span>
                <span className="text-gray-300 font-mono">554</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Protocol:</span>
                <span className="text-gray-300 font-mono">RTSP/TCP</span>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}