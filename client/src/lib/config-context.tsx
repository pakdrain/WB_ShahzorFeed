
import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ConfigContextType {
  comPort: string;
  cameraIp: string;
  cameraPort: number;
  isLoading: boolean;
  refetchConfig: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: weightStatus } = useQuery({
    queryKey: ['/api/weight/status'],
    refetchInterval: 2000,
  });

  const { data: camera } = useQuery({
    queryKey: ['/api/cameras/1'],
    refetchInterval: 5000,
  });

  const comPort = weightStatus?.port || 'COM6';
  const cameraIp = camera?.ip || '10.10.10.146';
  const cameraPort = camera?.port || 554;
  const isLoading = !weightStatus && !camera;

  const refetchConfig = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/weight/status'] });
    queryClient.invalidateQueries({ queryKey: ['/api/cameras/1'] });
  };

  // Listen for configuration updates from other pages
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'config-updated') {
        console.log('Config update detected, refreshing...');
        refetchConfig();
      }
    };

    // Also listen for custom events for immediate updates within the same tab
    const handleConfigUpdate = () => {
      console.log('Config update event received, refreshing...');
      refetchConfig();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('config-updated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('config-updated', handleConfigUpdate);
    };
  }, [refetchConfig]);

  const value: ConfigContextType = {
    comPort,
    cameraIp,
    cameraPort,
    isLoading,
    refetchConfig,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
