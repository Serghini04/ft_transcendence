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

    // Simulate what the API Gateway will do later :
    io.use((socket: Socket, next) => {
        (socket as any).user = {
            userId: 1,
            fullName: "Mehdi Serghini",
        }
        next();
    });

    io.on("connection", (socket) =>{
        fastify.log.info(`User connected: ${socket.id}`);
        
        socket.on("disconnect", () => {
            fastify.log.info(`User disconnected: ${socket.id}`);
        });
    })
})

export default socketPlugin;