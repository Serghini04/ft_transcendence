import { FastifyRequest, FastifyReply } from "fastify";
import { ChatRepository } from "../repositories/chat.repository";
import { userRepository } from "../repositories/user.repository";


async function getAllContacts(req: FastifyRequest, res: FastifyReply) {
    const chatRepo = new ChatRepository(req.server.db);

    console.error("From Backend :>>>>>" + Number(req.headers['x-user-id']));
    const contacts = await chatRepo.getContacts(Number(req.headers['x-user-id']));
    return res.code(200).send(contacts);
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
        // Emit socket event to notify the blocked user
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
        // Emit socket event to notify the unblocked user
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

export const chatController = {
    getAllContacts,
    getConversationBetweenUsers,
    markMessagesAsSeen,
    blockUser,
    unblockUser
}