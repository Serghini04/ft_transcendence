import { FastifyRequest, FastifyReply } from "fastify";
import { ChatRepository } from "../repositories/chat.repository";
import { userRepository } from "../repositories/user.repository";
import { kafkaProducerService } from "../kafka/producer";


async function getAllContacts(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);

    console.error("From Backend :>>>>>" + Number(req.headers['x-user-id']));
    const contacts = await chatRepo.getContacts(Number(req.headers['x-user-id']));
    console.log("Done from me");
    return res.code(200).send(contacts);
}

async function searchUsers(req: FastifyRequest, res: FastifyReply) {
    const { q } = req.query as { q: string };
    
    if (!q || q.trim().length === 0) {
        return res.code(400).send({ error: "Search query is required" });
    }
    
    const userRepo = new userRepository(req.server.db);
    const users = userRepo.searchUsers(q.trim());
    
    return res.code(200).send(users);
}

async function getConversationBetweenUsers(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    console.error("From Backend :>>" + Number(req.headers['x-user-id']));
    if (userId === id)
        return res.code(400).send({ error: "You cannot message yourself"});
    const userRepo = new userRepository(req.server.db);
    const recipient = await userRepo.getUserById(id);
    if (!recipient)
        return res.code(404).send({ error: "Received User not found" });
    const messages = await chatRepo.getConversationBetweenUsers(userId, id);
    
    chatRepo.markMessagesAsSeen(userId, id);
    
    return res.code(200).send(messages);
}

async function markMessagesAsSeen(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "You cannot mark messages with yourself as seen"});
    
    chatRepo.markMessagesAsSeen(userId, id);
    return res.code(200).send({ success: true });
}

async function blockUser(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "You cannot block yourself"});
    
    const result = chatRepo.blockUser(userId, id);
    
    if (result.success) {
        const io = req.server.io;
        if (io) {
            const chatNS = io.of("/chat");
            chatNS.emit("user:blocked", { 
                userId: id, 
                blockedBy: userId 
            });
        }
        
        return res.code(200).send(result);
    }
    return res.code(400).send(result);
}

async function unblockUser(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "You cannot unblock yourself"});
    
    const result = chatRepo.unblockUser(userId, id);
    
    if (result.success) {
        const io = req.server.io;
        if (io) {
            const chatNS = io.of("/chat");
            chatNS.emit("user:unblocked", { 
                userId: id, 
                unblockedBy: userId 
            });
        }
        
        return res.code(200).send(result);
    }
    return res.code(400).send(result);
}

async function sendFriendRequest(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "You cannot send friend request to yourself"});
    
    const userRepo = new userRepository(req.server.db);
    const targetUser = await userRepo.getUserById(id);
    if (!targetUser)
        return res.code(404).send({ error: "User not found" });
    
    const senderUser = await userRepo.getUserById(userId);
    
    const result = chatRepo.sendFriendRequest(userId, id);
    
    if (result.success) {
        const io = req.server.io;
        if (io) {
            const chatNS = io.of("/chat");
            chatNS.emit("friend:request", { 
                senderId: userId, 
                receiverId: id 
            });
        }
        
        // Send notification via Kafka
        if (senderUser) {
            await kafkaProducerService.publishFriendRequestNotification(
                id,
                senderUser.fullName,
                userId,
                new Date().toISOString()
            );
        }
        
        return res.code(200).send(result);
    }
    return res.code(400).send(result);
}

async function acceptFriendRequest(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "Invalid request"});
    
    const result = chatRepo.acceptFriendRequest(userId, id);
    
    if (result.success) {
        const io = req.server.io;
        if (io) {
            const chatNS = io.of("/chat");
            chatNS.emit("friend:accepted", { 
                userId: userId, 
                friendId: id 
            });
        }
        
        return res.code(200).send(result);
    }
    return res.code(400).send(result);
}

async function rejectFriendRequest(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "Invalid request"});
    
    const result = chatRepo.rejectFriendRequest(userId, id);
    
    if (result.success) {
        return res.code(200).send(result);
    }
    return res.code(400).send(result);
}

async function getPendingRequests(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const userId = Number(req.headers['x-user-id']);
    
    const requests = chatRepo.getPendingRequests(userId);
    return res.code(200).send(requests);
}

async function getFriends(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const userId = Number(req.headers['x-user-id']);
    
    const friends = chatRepo.getFriends(userId);
    return res.code(200).send(friends);
}

async function removeFriend(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "You cannot remove yourself"});
    
    const result = chatRepo.removeFriend(userId, id);
    
    if (result.success) {
        const io = req.server.io;
        if (io) {
            const chatNS = io.of("/chat");
            chatNS.emit("friend:removed", { 
                userId: userId, 
                friendId: id 
            });
        }
        
        return res.code(200).send(result);
    }
    return res.code(400).send(result);
}

async function getFriendshipStatus(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    const userId = Number(req.headers['x-user-id']);
    
    if (userId === id)
        return res.code(400).send({ error: "Cannot check status with yourself"});
    
    const status = chatRepo.getFriendshipStatus(userId, id);
    return res.code(200).send(status);
}

export const chatController = {
    getAllContacts,
    searchUsers,
    getConversationBetweenUsers,
    markMessagesAsSeen,
    blockUser,
    unblockUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getPendingRequests,
    getFriends,
    removeFriend,
    getFriendshipStatus
}