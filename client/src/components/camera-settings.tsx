import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraSettingsProps {
  onSettingsUpdate: (settings: CameraSettings) => void;
  currentSettings: CameraSettings;
}

export interface CameraSettings {
  ip: string;
  port: number;
  username: string;
  password: string;
  resolution: string;
  fps: number;
  quality: number;
  streamPath: string;
}

export default function CameraSettings({ onSettingsUpdate, currentSettings }: CameraSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<CameraSettings>(currentSettings);
  const { toast } = useToast();

  const resolutions = [
    { value: '1920x1080', label: '1080p (1920x1080)' },
    { value: '1280x720', label: '720p (1280x720)' },
    { value: '640x480', label: '480p (640x480)' },
    { value: '320x240', label: '240p (320x240)' },
  ];

  const qualities = [
    { value: '1', label: 'Highest (1)' },
    { value: '3', label: 'High (3)' },
    { value: '5', label: 'Medium (5)' },
    { value: '7', label: 'Low (7)' },
    { value: '10', label: 'Lowest (10)' },
  ];

  const handleSave = () => {
    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(settings.ip)) {
      toast({
        title: "Invalid IP Address",
        description: "Please enter a valid IP address format (e.g., 192.168.1.100)",
        variant: "destructive",
      });
      return;
    }

    // Validate port range
    if (settings.port < 1 || settings.port > 65535) {
      toast({
        title: "Invalid Port",
        description: "Port must be between 1 and 65535",
        variant: "destructive",
      });
      return;
    }

    onSettingsUpdate(settings);
    setIsOpen(false);
    toast({
      title: "Settings Updated",
      description: "Camera settings have been saved successfully",
    });
  };

  const handleReset = () => {
    const defaultSettings: CameraSettings = {
      ip: '10.10.10.146',
      port: 554,
      username: 'admin',
      password: 'admin123',
      resolution: '640x480',
      fps: 10,
      quality: 4,
      streamPath: '/cam/realmonitor?channel=1&subtype=0',
    };
    setSettings(defaultSettings);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Camera Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Network Settings */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-300">Network Configuration</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label htmlFor="ip">IP Address</Label>
                <Input
                  id="ip"
                  placeholder="192.168.1.100"
                  value={settings.ip}
                  onChange={(e) => setSettings({ ...settings, ip: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="554"
                  value={settings.port}
                  onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) || 554 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={settings.username}
                  onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={settings.password}
                  onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="streamPath">Stream Path</Label>
              <Input
                id="streamPath"
                placeholder="/cam/realmonitor?channel=1&subtype=0"
                value={settings.streamPath}
                onChange={(e) => setSettings({ ...settings, streamPath: e.target.value })}
              />
            </div>
          </div>

          {/* Video Settings */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-300">Video Configuration</h4>
            
            <div>
              <Label htmlFor="resolution">Resolution</Label>
              <Select 
                value={settings.resolution} 
                onValueChange={(value) => setSettings({ ...settings, resolution: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  {resolutions.map((res) => (
                    <SelectItem key={res.value} value={res.value}>
                      {res.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fps">Frame Rate (FPS)</Label>
                <Input
                  id="fps"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.fps}
                  onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <Label htmlFor="quality">Quality</Label>
                <Select 
                  value={settings.quality.toString()} 
                  onValueChange={(value) => setSettings({ ...settings, quality: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualities.map((qual) => (
                      <SelectItem key={qual.value} value={qual.value}>
                        {qual.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}