import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";

const userSockets = new Map<number, Set<string>>();
const socketUsers = new Map<string, number>();

const socketPlugin = fp(async (fastify: FastifyInstance) => {
    const io = new Server(fastify.server, {
        path: "/socket.io",
        cors: {
            origin: true,
            credentials: true,
        }
    });

    fastify.decorate("io", io);

    io.on("connection", (socket) => {
        const userId = socket.handshake.auth.userId;
        if (!userId || isNaN(Number(userId))) {
            socket.disconnect();
            return ;
        }
        
        const userIdNum = Number(userId);

        if (!userSockets.has(userIdNum))
            userSockets.set(userIdNum, new Set());
        userSockets.get(userIdNum)!.add(socket.id);

        socketUsers.set(socket.id, userIdNum);

        const onlineUserIds = Array.from(userSockets.keys());

        io.emit("users:online", onlineUserIds);


        socket.on("disconnect", () => {
            const userIdNum = socketUsers.get(socket.id);

            if (userIdNum) {
                const userSokcetSet = userSockets.get(userIdNum);
                if (userSokcetSet) {
                    userSokcetSet.delete(socket.id);
                    if (userSokcetSet.size === 0)
                        userSockets.delete(userIdNum);
                }
                
                socketUsers.delete(socket.id);
                const onlineUserIds = Array.from(userSockets.keys());
                io.emit("users:online", onlineUserIds);
            }
        });
    })
});

export default socketPlugin;
