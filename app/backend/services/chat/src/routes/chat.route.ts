import { FastifyInstance } from "fastify";
import {chatController} from "./../controllers/chat.controller"

// GET /api/chat/contacts - get all contacts
// GET /api/chat/:id - get messages by user id
// POST /api/chat/send/:id - send message to user by id


export default async function messageRoutes(fastify: FastifyInstance, opts: any) {
    fastify.get("/contacts", chatController.getAllContacts);
    fastify.get("/conversation/:id", chatController.getConversationByUserId);
    fastify.post("/send/:id", chatController.sendMessage);
}
