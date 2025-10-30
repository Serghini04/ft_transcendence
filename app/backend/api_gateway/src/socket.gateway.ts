import { FastifyInstance } from "fastify";
import { Server } from "socket.io";
import { io as ClientIO } from "socket.io-client";

export async function setupSocketGateway(app: FastifyInstance) {
    const io = new Server(app.server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token)
                return next(new Error("No token provided"));
            // Mock JWT
            const decoded = {userId: 1, fullName: "Mehdi Serghini"};

            socket.data.user = decoded;
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }

        io.on("connection", (socket) => {
            const user = socket.data.user;
            app.log.info(`🔌 User connected via Gateway: ${user.fullName}`);
        
            // Routs:
            const chatSocket = ClientIO("http://localhost:3000", {
              auth: {
                userId: user.userId,
                fullName: user.fullName,
              },
            });
        
            // Pipe messages Gateway <-> Chat Service
            socket.onAny((event, data) => chatSocket.emit(event, data));
            chatSocket.onAny((event, data) => socket.emit(event, data));
        
            socket.on("disconnect", () => {
              app.log.info(`User ${user.fullName} disconnected`);
              chatSocket.disconnect();
            });
          });
    });
}