import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Server } from "socket.io";


const socketPlugin  = fp(async (fastify: FastifyInstance) => {

    const io = new Server(fastify.server, {
        cors: {
            origin: "*",
            credentials: true,
        },
    })
    fastify.decorate("io", io);
    const onlineUsers = new Map();

    io.on("connection", (socket) =>{
        const user = socket.handshake.auth;
        fastify.log.info(`User connected: ${socket.id}, userId: ${user.userId}`);

        // join personal room :
        socket.join(`user:${user.userId}`);
        onlineUsers.set(user.userId, socket.id);

        socket.emit("user:online", {userId:user.userId});

        socket.on("message:send", ({to, message, timestamp}) =>{
            const paylod = {
                from: user.userId,
                to,
                message,
                timestamp
            };
            io.to(`user:${to}`).emit("message:receive", paylod);
        });

        socket.on("disconnect", () => {
            io.emit("user:offline", {userId: user.userId});
            fastify.log.info(`User disconnected: ${socket.id}`);
        });
    })
})

export default socketPlugin;