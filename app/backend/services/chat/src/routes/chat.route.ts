import { FastifyInstance } from "fastify";
import {chatController} from "./../controllers/chat.controller"

// GET /api/v1/chat/contacts - get all contacts
// GET /api/v1/chat/conversation/:id - get messages by user id
// POST /api/v1/chat/send/:id - send message to user by id

export default async function messageRoutes(fastify: FastifyInstance, opts: any) {
    fastify.get("/contacts", chatController.getAllContacts);
    fastify.get("/conversation/:id", chatController.getConversationBetweenUsers);
    fastify.post("/send/:id", chatController.sendMessage);
}
