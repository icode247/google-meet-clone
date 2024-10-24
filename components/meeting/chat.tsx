"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Socket } from "socket.io-client";
import { User } from "@/types";

// Update the ChatProps interface
interface ChatProps {
  socketRef: React.MutableRefObject<Socket | undefined>; // Changed from RefObject to MutableRefObject
  user: User;
  meetingId: string;
}

interface Message {
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

function Chat({ socketRef, user, meetingId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleChatMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket?.off("chat-message", handleChatMessage);
    };
  }, [socketRef.current]); // Listen to changes in the socket reference

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!socket || !newMessage.trim()) return;

    const message: Message = {
      userId: user.id.toString(),
      username: user.username,
      text: newMessage,
      timestamp: Date.now(),
    };

    socket.emit("chat-message", {
      message,
      meetingId,
    });

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  return (
    <div className="fixed right-4 bottom-4 w-80 bg-white rounded-lg shadow-lg flex flex-col border">
      <div
        className="p-3 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-medium text-gray-600">Chat</h3>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? "▼" : "▲"}
        </button>
      </div>

      {isExpanded && (
        <>
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.userId === user.id.toString()
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.userId === user.id.toString()
                      ? "bg-blue-600 text-white"
                      : "bg-gray-400"
                  }`}
                >
                  {message.userId !== user.id.toString() && (
                    <p className="text-xs font-medium mb-1">
                      {message.username}
                    </p>
                  )}
                  <p className="break-words">{message.text}</p>
                  <span className="text-xs opacity-75 block mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}


export default Chat;
