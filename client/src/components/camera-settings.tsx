import { useState } from 'react';
import { Settings, Play, Pause, RotateCcw, Maximize2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  currentCamera: any;
  onStartStream: () => void;
  onStopStream: () => void;
  onReconnect: () => void;
  onFullscreen: () => void;
  onUpdateCamera: (config: CameraConfig) => void;
}

interface CameraConfig {
  ip: string;
  port: string;
  username: string;
  password: string;
  resolution: string;
  fps: string;
  quality: string;
  channel: string;
  name: string;
  subtype: string;
}

export default function CameraSettings({
  isStreaming,
  isConnected,
  currentCamera,
  onStartStream,
  onStopStream,
  onReconnect,
  onFullscreen,
  onUpdateCamera,
}: CameraSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>({
    ip: currentCamera?.ip || '10.10.10.146',
    port: currentCamera?.port?.toString() || '554',
    username: currentCamera?.username || 'admin',
    password: currentCamera?.password || 'admin123',
    resolution: '640x480',
    fps: '10',
    quality: '5',
    channel: '1',
    name: currentCamera?.name || 'Camera 01',
    subtype: '0'
  });

  const handleSaveConfig = async () => {
    try {
      // Update camera configuration via API
      onUpdateCamera(cameraConfig);
      console.log('Saving camera config:', cameraConfig);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving camera config:', error);
    }
  };

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
          {/* Camera Configuration */}
          <Card className="bg-monitoring-dark border-monitoring-gray p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Camera Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-xs text-gray-400">Camera Name</Label>
                <Input
                  id="name"
                  value={cameraConfig.name}
                  onChange={(e) => setCameraConfig({...cameraConfig, name: e.target.value})}
                  className="bg-monitoring-slate border-monitoring-gray text-white"
                  placeholder="Camera 01"
                />
              </div>
              <div>
                <Label htmlFor="ip" className="text-xs text-gray-400">IP Address</Label>
                <Input
                  id="ip"
                  value={cameraConfig.ip}
                  onChange={(e) => setCameraConfig({...cameraConfig, ip: e.target.value})}
                  className="bg-monitoring-slate border-monitoring-gray text-white"
                  placeholder="10.10.10.146"
                />
              </div>
              <div>
                <Label htmlFor="port" className="text-xs text-gray-400">Port</Label>
                <Input
                  id="port"
                  value={cameraConfig.port}
                  onChange={(e) => setCameraConfig({...cameraConfig, port: e.target.value})}
                  className="bg-monitoring-slate border-monitoring-gray text-white"
                  placeholder="554"
                />
              </div>
              <div>
                <Label htmlFor="username" className="text-xs text-gray-400">Username</Label>
                <Input
                  id="username"
                  value={cameraConfig.username}
                  onChange={(e) => setCameraConfig({...cameraConfig, username: e.target.value})}
                  className="bg-monitoring-slate border-monitoring-gray text-white"
                  placeholder="admin"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-xs text-gray-400">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={cameraConfig.password}
                  onChange={(e) => setCameraConfig({...cameraConfig, password: e.target.value})}
                  className="bg-monitoring-slate border-monitoring-gray text-white"
                  placeholder="admin123"
                />
              </div>
              <div>
                <Label htmlFor="channel" className="text-xs text-gray-400">Channel</Label>
                <Select value={cameraConfig.channel} onValueChange={(value) => setCameraConfig({...cameraConfig, channel: value})}>
                  <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-monitoring-slate border-monitoring-gray">
                    <SelectItem value="1">Channel 1</SelectItem>
                    <SelectItem value="2">Channel 2</SelectItem>
                    <SelectItem value="3">Channel 3</SelectItem>
                    <SelectItem value="4">Channel 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subtype" className="text-xs text-gray-400">Stream Type</Label>
                <Select value={cameraConfig.subtype} onValueChange={(value) => setCameraConfig({...cameraConfig, subtype: value})}>
                  <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-monitoring-slate border-monitoring-gray">
                    <SelectItem value="0">Main Stream (High Quality)</SelectItem>
                    <SelectItem value="1">Sub Stream (Low Quality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Stream Settings */}
          <Card className="bg-monitoring-dark border-monitoring-gray p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Stream Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="resolution" className="text-xs text-gray-400">Resolution</Label>
                <Select value={cameraConfig.resolution} onValueChange={(value) => setCameraConfig({...cameraConfig, resolution: value})}>
                  <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-monitoring-slate border-monitoring-gray">
                    <SelectItem value="320x240">320x240</SelectItem>
                    <SelectItem value="640x480">640x480</SelectItem>
                    <SelectItem value="800x600">800x600</SelectItem>
                    <SelectItem value="1024x768">1024x768</SelectItem>
                    <SelectItem value="1280x720">1280x720 (HD)</SelectItem>
                    <SelectItem value="1920x1080">1920x1080 (Full HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fps" className="text-xs text-gray-400">Frame Rate (FPS)</Label>
                <Select value={cameraConfig.fps} onValueChange={(value) => setCameraConfig({...cameraConfig, fps: value})}>
                  <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-monitoring-slate border-monitoring-gray">
                    <SelectItem value="5">5 FPS</SelectItem>
                    <SelectItem value="8">8 FPS</SelectItem>
                    <SelectItem value="10">10 FPS</SelectItem>
                    <SelectItem value="15">15 FPS</SelectItem>
                    <SelectItem value="20">20 FPS</SelectItem>
                    <SelectItem value="25">25 FPS</SelectItem>
                    <SelectItem value="30">30 FPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quality" className="text-xs text-gray-400">Quality</Label>
                <Select value={cameraConfig.quality} onValueChange={(value) => setCameraConfig({...cameraConfig, quality: value})}>
                  <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-monitoring-slate border-monitoring-gray">
                    <SelectItem value="1">Highest (1)</SelectItem>
                    <SelectItem value="2">High (2)</SelectItem>
                    <SelectItem value="3">Good (3)</SelectItem>
                    <SelectItem value="4">Medium (4)</SelectItem>
                    <SelectItem value="5">Standard (5)</SelectItem>
                    <SelectItem value="6">Low (6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={handleSaveConfig}
              className="w-full mt-4 bg-monitoring-blue hover:bg-blue-600 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </Card>

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

          {/* Current Configuration Display */}
          <Card className="bg-monitoring-dark border-monitoring-gray p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Current Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">RTSP URL:</span>
                <span className="text-gray-300 font-mono text-xs break-all">
                  rtsp://{cameraConfig.username}:{cameraConfig.password}@{cameraConfig.ip}:{cameraConfig.port}/cam/realmonitor?channel={cameraConfig.channel}&subtype=0
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stream Resolution:</span>
                <span className="text-gray-300">{cameraConfig.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Frame Rate:</span>
                <span className="text-gray-300">{cameraConfig.fps} FPS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quality Level:</span>
                <span className="text-gray-300">Level {cameraConfig.quality}</span>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}