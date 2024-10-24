export interface User {
    id: number;
    email: string;
    username: string;
    avatar?: string;
  }
  
  export interface Meeting {
    id: number;
    title: string;
    meetingId: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    host: {
      data: {
        id: number;
        username: string;
        email: string;
      };
  
      participants: {
        data: Array<{
          id: number;
          username: string;
          email: string;
        }>;
      };
    };
  }
  
  export interface MeetingParticipant {
    id: number;
    username: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
  }
  
  export interface ChatMessage {
    id: string;
    userId: number;
    text: string;
    timestamp: number;
    username: string;
  }