import { FastifyInstance } from "fastify";
import {chatController} from "./../controllers/chat.controller"
import { Type } from "@sinclair/typebox";

// GET /api/v1/chat/contacts - get all contacts
// GET /api/v1/chat/conversation/:id - get messages by user id
// POST /api/v1/chat/send/:receivedId - send message to user by id

export default async function chatRoutes(fastify: FastifyInstance) {
    fastify.get("/contacts", chatController.getAllContacts);

    fastify.get("/conversation/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.getConversationBetweenUsers);
    
    fastify.post("/send/:receivedId", {
        schema: {
            params: Type.Object({
                receivedId: Type.Integer({minimum:1})
            }),
            body: Type.Object({
                text: Type.String({minLength: 1}),
            })
        }
    }, chatController.sendMessage);
}
