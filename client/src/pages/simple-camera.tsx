import SimpleVideoPlayer from '@/components/simple-video-player';

export default function SimpleCamera() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Live Camera Feed
        </h1>
        <SimpleVideoPlayer cameraId={1} />
      </div>
    </div>
  );
}