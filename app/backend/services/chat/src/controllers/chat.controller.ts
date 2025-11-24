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

export const chatController = {
    getAllContacts,
    getConversationBetweenUsers,
    markMessagesAsSeen
}