import { FastifyInstance } from "fastify";
import {chatController} from "./../controllers/chat.controller"
import { Type } from "@sinclair/typebox";

// GET /api/v1/chat/contacts - get all contacts
// GET /api/v1/chat/conversation/:id - get messages by user id

export default async function chatRoutes(fastify: FastifyInstance) {
    fastify.get("/contacts", chatController.getAllContacts);

    fastify.get("/conversation/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.getConversationBetweenUsers);
}
