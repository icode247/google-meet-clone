import { create } from "zustand";

interface Participant {
  id: string;
  username: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isHost?: boolean;
}

interface MeetingState {
  participants: Record<string, Participant>;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  updateMediaState: (id: string, type: 'audio' | 'video' | 'screen', enabled: boolean) => void;
  clearParticipants: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  participants: {},
  
  addParticipant: (participant) =>
    set((state) => ({
      participants: {
        ...state.participants,
        [participant.id]: {
          ...participant,
          isAudioEnabled: true,
          isVideoEnabled: true,
          isScreenSharing: false,
          ...state.participants[participant.id],
        },
      },
    })),
    
  removeParticipant: (id) =>
    set((state) => {
      const { [id]: removed, ...rest } = state.participants;
      return { participants: rest };
    }),
    
  updateParticipant: (id, updates) =>
    set((state) => ({
      participants: {
        ...state.participants,
        [id]: {
          ...state.participants[id],
          ...updates,
        },
      },
    })),
    
  updateMediaState: (id, type, enabled) =>
    set((state) => ({
      participants: {
        ...state.participants,
        [id]: {
          ...state.participants[id],
          [type === 'audio' ? 'isAudioEnabled' : 
           type === 'video' ? 'isVideoEnabled' : 'isScreenSharing']: enabled,
        },
      },
    })),
    
  clearParticipants: () =>
    set({ participants: {} }),
}));