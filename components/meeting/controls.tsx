import { useRouter } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  StopCircleIcon,
  Phone,
} from 'lucide-react';
import { Socket } from 'socket.io-client';
import { useState } from 'react';

interface ControlsProps {
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  isScreenSharing: boolean;
  socketRef: React.MutableRefObject<Socket | undefined>;
  peersRef: React.MutableRefObject<any[]>;
  meetingId: string;
  userId: string;
  onScreenShare: () => Promise<void>;
}

export default function Controls({
  stream,
  screenStream,
  isScreenSharing,
  socketRef,
  peersRef,
  meetingId,
  userId,
  onScreenShare,
}: ControlsProps) {
  const router = useRouter();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);

      // Notify peers about audio state change
      socketRef.current?.emit('media-state-change', {
        meetingId,
        userId,
        type: 'audio',
        enabled: !isAudioEnabled,
      });
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);

      // Notify peers about video state change
      socketRef.current?.emit('media-state-change', {
        meetingId,
        userId,
        type: 'video',
        enabled: !isVideoEnabled,
      });
    }
  };

  const handleLeave = () => {
    // Stop all tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }

    // Clean up peer connections
    peersRef.current.forEach(peer => {
      if (peer.peer) {
        peer.peer.destroy();
      }
    });

    // Notify server
    socketRef.current?.emit('leave-meeting', {
      meetingId,
      userId,
    });

    // Disconnect socket
    socketRef.current?.disconnect();

    // Navigate back
    router.push('/meetings');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex justify-center gap-4">
        <button
          onClick={toggleAudio}
          className={`p-3 rounded-full transition-colors ${
            isAudioEnabled 
              ? 'bg-gray-600 hover:bg-gray-500' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full transition-colors ${
            isVideoEnabled 
              ? 'bg-gray-600 hover:bg-gray-500' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
        >
          {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button
          onClick={onScreenShare}
          className={`p-3 rounded-full transition-colors ${
            isScreenSharing 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-600 hover:bg-gray-600'
          }`}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          {isScreenSharing ? (
            <StopCircleIcon size={24} />
          ) : (
            <ScreenShare size={24} />
          )}
        </button>

        <button
          onClick={handleLeave}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="Leave Meeting"
        >
          <Phone size={24} className="rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}