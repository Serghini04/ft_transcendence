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

async function getConversationByUserId(req: FastifyRequest, res: FastifyReply) {
    req.user = { userId: 1, fullName: "Mehdi Serghini" };
    const chatRepo = new ChatRepository(req.server.db);

    const conversation = chatRepo.getConversationByUserId(req.user.userId);
    res.send(conversation);
}

async function sendMessage(req: FastifyRequest, res: FastifyReply) {
    const {id} = req.params as {id: string};
    res.send({message: "Message Send successfully to User Id" + id});
}

export const chatController = {
    getAllContacts,
    getConversationByUserId,
    sendMessage
}