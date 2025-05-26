import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Download, 
  Trash2, 
  Calendar, 
  Clock, 
  HardDrive,
  Video,
  Archive
} from 'lucide-react';
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

interface RecordingsLibraryProps {
  cameraId: number;
}

export default function RecordingsLibrary({ cameraId }: RecordingsLibraryProps) {
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const { toast } = useToast();

  const { data: recordings = [], refetch } = useQuery({
    queryKey: [`/api/cameras/${cameraId}/recordings`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = async (recording: Recording) => {
    try {
      const link = document.createElement('a');
      link.href = `/api/recordings/${recording.id}/download`;
      link.download = recording.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${recording.filename}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download recording",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (recording: Recording) => {
    try {
      const response = await fetch(`/api/recordings/${recording.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Recording Deleted",
          description: `${recording.filename} has been deleted`,
        });
        refetch();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete recording",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recording':
        return <Badge variant="destructive" className="bg-red-600">Recording</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-600">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Archive className="w-4 h-4" />
          Recordings ({recordings.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Recordings Library
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {recordings.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No recordings found</p>
              <p className="text-sm text-gray-500">Start recording to see your videos here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording: Recording) => (
                <Card key={recording.id} className="bg-monitoring-slate border-monitoring-gray p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">{recording.filename}</h4>
                        {getStatusBadge(recording.status)}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(recording.startTime)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(recording.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HardDrive className="w-4 h-4" />
                          <span>{recording.size}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {recording.status === 'completed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRecording(recording)}
                            className="gap-2"
                          >
                            <Play className="w-4 h-4" />
                            Play
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(recording)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(recording)}
                        className="gap-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Video Playback Dialog */}
      {selectedRecording && (
        <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Playback: {selectedRecording.filename}</DialogTitle>
            </DialogHeader>
            
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                className="w-full h-full"
                controls
                autoPlay
                src={`/api/recordings/${selectedRecording.id}/download`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedRecording.startTime)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(selectedRecording.duration)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-4 h-4" />
                  <span>{selectedRecording.size}</span>
                </div>
              </div>
              
              <Button
                onClick={() => handleDownload(selectedRecording)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}