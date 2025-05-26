import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Download,
  Calendar,
  Clock,
  Video,
  CircleDot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecordingControlsProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  currentRecording?: RecordingInfo;
}

interface RecordingInfo {
  id: string;
  filename: string;
  duration: number;
  size: string;
  startTime: Date;
  endTime?: Date;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export default function RecordingControls({ 
  isRecording, 
  onStartRecording, 
  onStopRecording,
  currentRecording 
}: RecordingControlsProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 80
  });
  const [recordingDuration, setRecordingDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Update recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (playbackState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * playbackState.duration;
      videoRef.current.currentTime = newTime;
      setPlaybackState(prev => ({ ...prev, currentTime: newTime }));
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const volume = value[0];
      videoRef.current.volume = volume / 100;
      setPlaybackState(prev => ({ ...prev, volume }));
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(playbackState.duration, playbackState.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setPlaybackState(prev => ({ ...prev, currentTime: newTime }));
    }
  };

  const handleDownload = () => {
    if (currentRecording) {
      // Create download link for the recording
      const link = document.createElement('a');
      link.href = `/api/recordings/${currentRecording.id}/download`;
      link.download = currentRecording.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${currentRecording.filename}`,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card className="bg-monitoring-slate border-monitoring-gray p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-monitoring-blue" />
            <h3 className="font-medium text-white">Recording Controls</h3>
          </div>
          
          {isRecording && (
            <div className="flex items-center space-x-2">
              <CircleDot className="w-4 h-4 text-red-500 animate-pulse" />
              <Badge variant="destructive" className="bg-red-600">
                REC {formatTime(recordingDuration)}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {!isRecording ? (
            <Button 
              onClick={onStartRecording}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <CircleDot className="w-4 h-4 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={onStopRecording}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}

          {currentRecording && (
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{currentRecording.startTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(currentRecording.duration)}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {currentRecording.size}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {/* Playback Controls */}
      {currentRecording && (
        <Card className="bg-monitoring-slate border-monitoring-gray p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">Playback Controls</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <Slider
              value={[playbackState.duration > 0 ? (playbackState.currentTime / playbackState.duration) * 100 : 0]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(Math.floor(playbackState.currentTime))}</span>
              <span>{formatTime(Math.floor(playbackState.duration))}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSkip(-10)}
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="lg"
              onClick={handlePlayPause}
              className="rounded-full w-12 h-12"
            >
              {playbackState.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSkip(10)}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-3">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <Slider
              value={[playbackState.volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-8">
              {playbackState.volume}%
            </span>
          </div>

          {/* Hidden video element for playback */}
          <video
            ref={videoRef}
            className="hidden"
            onTimeUpdate={(e) => {
              const video = e.target as HTMLVideoElement;
              setPlaybackState(prev => ({
                ...prev,
                currentTime: video.currentTime,
                duration: video.duration || 0
              }));
            }}
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              setPlaybackState(prev => ({
                ...prev,
                duration: video.duration || 0
              }));
            }}
          />
        </Card>
      )}
    </div>
  );
}