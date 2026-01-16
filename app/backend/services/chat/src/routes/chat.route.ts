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

    // Friend request endpoints
    fastify.post("/friends/request/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.sendFriendRequest);

    fastify.post("/friends/accept/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.acceptFriendRequest);

    fastify.post("/friends/reject/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.rejectFriendRequest);

    fastify.get("/friends/pending", chatController.getPendingRequests);

    fastify.get("/friends", chatController.getFriends);

    fastify.delete("/friends/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.removeFriend);

    fastify.get("/friendship/status/:id", {
        schema: {
            params: Type.Object({
                id: Type.Integer({minimum:1})
            })
        }
    }, chatController.getFriendshipStatus);
}
