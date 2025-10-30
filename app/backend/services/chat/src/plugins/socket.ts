import fp from "fastify-plugin";
import { FastifyInstance } from "fastify";
import { Server, Socket } from "socket.io";


const socketPlugin  = fp(async (fastify: FastifyInstance) => {

    const io = new Server(fastify.server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        },
    })
    fastify.decorate("io", io);

    io.on("connection", (socket) =>{
        const user = socket.handshake.auth;
        fastify.log.info(`User connected: ${socket.id}, userId: ${user.userId}`);

        socket.on("disconnect", () => {
            fastify.log.info(`User disconnected: ${socket.id}`);
        });
    })
})

export default socketPlugin;