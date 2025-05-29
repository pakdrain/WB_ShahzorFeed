import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Scale, Settings, Cable, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const weighbridgeSettingsSchema = z.object({
  comPort: z.string().min(1, 'COM port is required'),
  baudRate: z.number().min(1, 'Baud rate is required'),
  dataBits: z.number().min(5).max(8),
  parity: z.enum(['none', 'odd', 'even']),
  stopBits: z.number().min(1).max(2),
  unit: z.enum(['kg', 'g', 'lb']),
  precision: z.number().min(0).max(3),
  tareValue: z.number().min(0),
  autoTare: z.boolean(),
  calibrationFactor: z.number().min(0.1).max(10),
});

type WeighbridgeSettingsForm = z.infer<typeof weighbridgeSettingsSchema>;

export default function WeighbridgeSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current weighbridge status
  const { data: weightStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/weight/status'],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const form = useForm<WeighbridgeSettingsForm>({
    resolver: zodResolver(weighbridgeSettingsSchema),
    defaultValues: {
      comPort: 'COM3',
      baudRate: 9600,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      unit: 'kg',
      precision: 2,
      tareValue: 0,
      autoTare: false,
      calibrationFactor: 1.0,
    },
  });

  // Connect to weighbridge
  const connectMutation = useMutation({
    mutationFn: async (data: { comPort: string; baudRate: number }) => {
      const response = await fetch('/api/weight/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Connection Successful',
        description: 'Successfully connected to weighbridge.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/weight/status'] });
    },
    onError: () => {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to weighbridge. Check your settings.',
        variant: 'destructive',
      });
    },
  });

  // Send TARE command
  const tareMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/weight/tare', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Tare Applied',
        description: 'Scale has been zeroed successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Tare Failed',
        description: 'Failed to apply tare. Check connection.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: WeighbridgeSettingsForm) => {
    connectMutation.mutate({
      comPort: data.comPort,
      baudRate: data.baudRate,
    });
  };

  const handleTare = () => {
    tareMutation.mutate();
  };

  const isConnected = weightStatus?.connected || false;
  const currentWeight = weightStatus?.currentWeight || '0.00';
  const currentUnit = weightStatus?.currentUnit || 'kg';

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-3 mb-6">
        <Scale className="h-8 w-8 text-monitoring-blue" />
        <div>
          <h1 className="text-3xl font-bold text-white">Weighbridge Settings</h1>
          <p className="text-gray-400">Configure your digital weight scale connection</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card className="bg-monitoring-dark border-monitoring-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Connection Status</span>
            </CardTitle>
            <CardDescription>
              Current weighbridge connection and readings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Status:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Port:</span>
              <span className="text-white font-mono">{weightStatus?.port || 'COM3'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Baud Rate:</span>
              <span className="text-white font-mono">{weightStatus?.baudRate || '9600'}</span>
            </div>

            <div className="border-t border-monitoring-gray pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-monitoring-blue">
                  {currentWeight}
                </div>
                <div className="text-lg text-gray-300 uppercase">
                  {currentUnit}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleTare}
              disabled={!isConnected || tareMutation.isPending}
              className="w-full bg-monitoring-blue hover:bg-monitoring-blue/90"
            >
              {tareMutation.isPending ? 'Applying Tare...' : 'TARE (Zero Scale)'}
            </Button>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card className="bg-monitoring-dark border-monitoring-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Communication Settings</span>
            </CardTitle>
            <CardDescription>
              Configure serial port communication parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="comPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">COM Port</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="COM3"
                          className="bg-monitoring-slate border-monitoring-gray text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baudRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Baud Rate</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                            <SelectValue placeholder="Select baud rate" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="9600">9600</SelectItem>
                          <SelectItem value="19200">19200</SelectItem>
                          <SelectItem value="38400">38400</SelectItem>
                          <SelectItem value="57600">57600</SelectItem>
                          <SelectItem value="115200">115200</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataBits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Data Bits</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="7">7</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stopBits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Stop Bits</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="parity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Parity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-monitoring-slate border-monitoring-gray text-white">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="odd">Odd</SelectItem>
                          <SelectItem value="even">Even</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={connectMutation.isPending}
                  className="w-full bg-monitoring-blue hover:bg-monitoring-blue/90"
                >
                  {connectMutation.isPending ? 'Connecting...' : 'Connect to Weighbridge'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}