import { FastifyRequest, FastifyReply } from "fastify";
import { User } from "../models/user";
import { ChatRepository } from "../repositories/chat.repository";


async function getAllContacts(req: FastifyRequest, res: FastifyReply) {
    // Api GetWay :
    req.user = { userId: 1, fullName: "Mehdi Serghini" };
    const chatRepo = new ChatRepository(req.server.db);

    const contacts = chatRepo.getContacts(req.user.userId);
    res.send(contacts);
}

async function getConversationBetweenUsers(req: FastifyRequest, res: FastifyReply) {
    req.user = { userId: 1, fullName: "Mehdi Serghini" };

    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number};
    
    const messages = chatRepo.getConversationBetweenUsers(req.user.userId, id);
    res.send(messages);
}

async function sendMessage(req: FastifyRequest, res: FastifyReply) {
    const {id} = req.params as {id: string};

}

export const chatController = {
    getAllContacts,
    getConversationBetweenUsers,
    sendMessage
}