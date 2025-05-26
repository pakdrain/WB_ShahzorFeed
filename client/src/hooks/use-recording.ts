import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface Recording {
  id: string;
  filename: string;
  cameraId: number;
  startTime: Date;
  endTime?: Date;
  duration: number;
  size: string;
  status: 'recording' | 'completed' | 'failed';
}

interface UseRecordingReturn {
  isRecording: boolean;
  currentRecording: Recording | null;
  recordings: Recording[];
  startRecording: () => void;
  stopRecording: () => void;
  isStarting: boolean;
  isStopping: boolean;
}

export function useRecording(cameraId: number): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get recording status
  const { data: recordingStatus } = useQuery({
    queryKey: [`/api/cameras/${cameraId}/recording/status`],
    refetchInterval: 2000, // Check every 2 seconds
  });

  // Get all recordings
  const { data: recordings = [] } = useQuery({
    queryKey: [`/api/cameras/${cameraId}/recordings`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update local state when status changes
  useEffect(() => {
    if (recordingStatus) {
      setIsRecording(recordingStatus.isRecording);
      setCurrentRecording(recordingStatus.currentRecording);
    }
  }, [recordingStatus]);

  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/cameras/${cameraId}/recording/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start recording');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recording Started",
        description: "Camera recording has begun successfully",
      });
      
      // Invalidate and refetch status
      queryClient.invalidateQueries({ 
        queryKey: [`/api/cameras/${cameraId}/recording/status`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/cameras/${cameraId}/recordings`] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Recording Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Stop recording mutation
  const stopRecordingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/cameras/${cameraId}/recording/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop recording');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recording Stopped",
        description: `Recording saved: ${data.recording?.filename || 'video file'}`,
      });
      
      // Invalidate and refetch status
      queryClient.invalidateQueries({ 
        queryKey: [`/api/cameras/${cameraId}/recording/status`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/cameras/${cameraId}/recordings`] 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Stop Recording Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    isRecording,
    currentRecording,
    recordings,
    startRecording: () => startRecordingMutation.mutate(),
    stopRecording: () => stopRecordingMutation.mutate(),
    isStarting: startRecordingMutation.isPending,
    isStopping: stopRecordingMutation.isPending,
  };
}