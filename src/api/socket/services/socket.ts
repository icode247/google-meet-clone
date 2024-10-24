import { Core } from "@strapi/strapi";

interface MeetingParticipant {
  socketId: string;
  username: string;
}

interface Meeting {
  participants: Map<string, MeetingParticipant>;
  lastActivity: number;
}

export default ({ strapi }: { strapi: Core.Strapi }) => {
  // Store active meetings and their participants
  const activeMeetings = new Map<string, Meeting>();

  // Cleanup inactive meetings periodically
  const cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      activeMeetings.forEach((meeting, meetingId) => {
        if (now - meeting.lastActivity > 1000 * 60 * 60) {
          // 1 hour timeout
          activeMeetings.delete(meetingId);
        }
      });
    },
    1000 * 60 * 15
  ); // Check every 15 minutes

  return {
    initialize() {
      strapi.eventHub.on("socket.ready", async () => {
        const io = (strapi as any).io;
        if (!io) {
          strapi.log.error("Socket.IO is not initialized");
          return;
        }

        io.on("connection", (socket: any) => {
          const { meetingId, userId } = socket.handshake.query;
          strapi.log.info(
            `Client connected - Socket: ${socket.id}, User: ${userId}, Meeting: ${meetingId}`
          );

          // Initialize meeting if it doesn't exist
          if (!activeMeetings.has(meetingId)) {
            activeMeetings.set(meetingId, {
              participants: new Map(),
              lastActivity: Date.now(),
            });
          }

          socket.on("join-meeting", async ({ meetingId, userId }) => {
            try {
              // Get user data with username
              const user = await strapi
                .query("plugin::users-permissions.user")
                .findOne({
                  where: { id: userId },
                  select: ["id", "username"],
                });

              strapi.log.info(`User ${userId} joining meeting ${meetingId}`);

              const meeting = activeMeetings.get(meetingId);
              if (!meeting) return;

              // Add participant to meeting with both ID and username
              meeting.participants.set(userId.toString(), {
                socketId: socket.id,
                username: user.username,
              });
              meeting.lastActivity = Date.now();

              // Join socket room
              socket.join(meetingId);

              // Get current participants with their usernames
              const currentParticipants = Array.from(
                meeting.participants.entries()
              )
                .filter(([id]) => id !== userId.toString())
                .map(([id, data]) => ({
                  userId: id,
                  username: data.username,
                }));

              // Send current participants to the joining user
              socket.emit("participants-list", currentParticipants);

              // Notify others about the new participant
              socket.to(meetingId).emit("user-joined", {
                userId: userId.toString(),
                username: user.username,
              });

              strapi.log.info(
                `Current participants in meeting ${meetingId}:`,
                Array.from(meeting.participants.entries()).map(
                  ([id, data]) => ({
                    id,
                    username: data.username,
                  })
                )
              );
            } catch (error) {
              strapi.log.error("Error in join-meeting:", error);
            }
          });

          socket.on("chat-message", ({ message, meetingId }) => {
            socket.to(meetingId).emit("chat-message", message);
          });

          // socket.on("signal", ({ to, from, signal }) => {
          //   console.log("signal received");
          const meeting = activeMeetings.get(meetingId);
          if (!meeting) return;
          socket.on("signal", ({ to, from, signal }) => {
            console.log(
              `Forwarding ${signal.type} signal from ${from} to ${to}`
            );
            const targetSocket = meeting.participants.get(
              to.toString()
            )?.socketId;
            if (targetSocket) {
              io.to(targetSocket).emit("signal", {
                signal,
                userId: from.toString(),
              });
            } else {
              console.log(`No socket found for user ${to}`);
            }
          });
          const handleDisconnect = () => {
            const meeting = activeMeetings.get(meetingId);
            if (!meeting) return;

            // Find and remove the disconnected user
            const disconnectedUserId = Array.from(
              meeting.participants.entries()
            ).find(([_, socketId]) => socketId === socket.id)?.[0];

            if (disconnectedUserId) {
              meeting.participants.delete(disconnectedUserId);
              meeting.lastActivity = Date.now();

              // Notify others about the user leaving
              socket.to(meetingId).emit("user-left", {
                userId: disconnectedUserId,
              });

              strapi.log.info(
                `User ${disconnectedUserId} left meeting ${meetingId}`
              );
              strapi.log.info(
                `Remaining participants:`,
                Array.from(meeting.participants.keys())
              );

              // Clean up empty meetings
              if (meeting.participants.size === 0) {
                activeMeetings.delete(meetingId);
                strapi.log.info(
                  `Meeting ${meetingId} closed - no participants remaining`
                );
              }
            }
          };

          socket.on("disconnect", handleDisconnect);
          socket.on("leave-meeting", handleDisconnect);
        });

        strapi.log.info("Conference socket service initialized successfully");
      });
    },

    destroy() {
      clearInterval(cleanupInterval);
    },
  };
};
