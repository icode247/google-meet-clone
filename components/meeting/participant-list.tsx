'use client';

import { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useMeetingStore } from '@/store/meeting-store';

export default function ParticipantList() {
  const [isExpanded, setIsExpanded] = useState(true);
  const participants = useMeetingStore((state) => state.participants);
  const participantCount = Object.keys(participants).length;
  return (
    <div className="fixed left-4 bottom-5 w-80 bg-white rounded-lg shadow-lg border z-50">
      <div 
        className="p-3 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Users className='text-gray-600' size={20} />
          <h2 className="font-medium text-gray-600">Participants ({participantCount})</h2>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {Object.values(participants).map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">{participant.username}</span>
                {participant.isHost && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    Host
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {participant.isAudioEnabled ? (
                  <Mic size={16} className="text-green-500" />
                ) : (
                  <MicOff size={16} className="text-red-500" />
                )}
                {participant.isVideoEnabled ? (
                  <Video size={16} className="text-green-500" />
                ) : (
                  <VideoOff size={16} className="text-red-500" />
                )}
                {participant.isScreenSharing && (
                  <ScreenShare size={16} className="text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}