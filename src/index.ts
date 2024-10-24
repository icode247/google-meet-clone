import { Core } from "@strapi/strapi";
import { Server as SocketServer } from "socket.io";

interface SocketConfig {
  cors: {
    origin: string | string[];
    methods: string[];
  };
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    const socketConfig = strapi.config.get("socket.config") as SocketConfig;

    if (!socketConfig) {
      strapi.log.error("Invalid Socket.IO configuration");
      return;
    }

    strapi.server.httpServer.on("listening", () => {
      const io = new SocketServer(strapi.server.httpServer, {
        cors: socketConfig.cors,
      });

      (strapi as any).io = io;
      strapi.eventHub.emit("socket.ready");
    });
  },

  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const socketService = strapi.service("api::socket.socket") as {
      initialize: () => void;
    };
    if (socketService && typeof socketService.initialize === "function") {
      socketService.initialize();
    } else {
      strapi.log.error("Socket service or initialize method not found");
    }
  },
};