import { FastifyInstance } from "fastify";
import {chatController} from "./../controllers/chat.controller"
import { Type } from "@sinclair/typebox";

export default async function chatRoutes(fastify: FastifyInstance) {
    fastify.get("/contacts", chatController.getAllContacts);

    fastify.get("/search", {
        schema: {
            querystring: Type.Object({
                q: Type.String({ minLength: 1 })
            })
        }
    }, chatController.searchUsers);
    
    fastify.get("/conversation/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.getConversationBetweenUsers);

    fastify.patch("/messages/:id/seen", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.markMessagesAsSeen);

    fastify.post("/block/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.blockUser);

    fastify.post("/unblock/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.unblockUser);
}
