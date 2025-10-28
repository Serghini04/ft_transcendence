import { FastifyRequest, FastifyReply } from "fastify";
import { ChatRepository } from "../repositories/chat.repository";
import { userRepository } from "../repositories/user.repository";


async function getAllContacts(req: FastifyRequest, res: FastifyReply) {
    // Api GetWay :
    req.user = { userId: 1, fullName: "Mehdi Serghini" };

    const chatRepo = new ChatRepository(req.server.db);

    const contacts = await chatRepo.getContacts(req.user.userId);
    return res.code(200).send(contacts);
}

async function getConversationBetweenUsers(req: FastifyRequest, res: FastifyReply) {
    req.user = { userId: 1, fullName: "Mehdi Serghini" };

    const chatRepo = new ChatRepository(req.server.db);
    const {id} = req.params as {id:number}
    
    if (req.user.userId === id)
        return res.code(400).send({ error: "You cannot message yourself"});
    const userRepo = new userRepository(req.server.db);
    const recipient = await userRepo.getUserById(id);
    if (!recipient)
        return res.code(404).send({ error: "Received User not found" });
    
    const usreRepo = new userRepository(req.server.db);
    const messages = await chatRepo.getConversationBetweenUsers(req.user.userId, id);
    return res.code(200).send(messages);
}

async function sendMessage(req: FastifyRequest, res: FastifyReply) {
    req.user = { userId: 1, fullName: "Mehdi Serghini" };

    const {receivedId} = req.params as {receivedId: number};
    const {text} = req.body as {text: string};
    
    if (req.user.userId === receivedId)
        return res.code(400).send({ error: "You cannot message yourself" });
    const userRepo = new userRepository(req.server.db);
    if (userRepo.getUserById(receivedId) === null)
        return res.code(404).send({ error: "Received User not found" });
    
    const chatRepo = new ChatRepository(req.server.db);
    const result = await chatRepo.sendMessage(req.user.userId, receivedId, text);
    if (!result.success)
        return res.code(500).send({ error: "Failed to send message" });

    return res.code(201).send({
        success: true,
        message: "Message sent",
        data: {
          id: result.messageId,
          text,
          senderId: req.user.userId,
          receivedId,
          timestamp: new Date().toISOString(),
        },
      });
}

export const chatController = {
    getAllContacts,
    getConversationBetweenUsers,
    sendMessage
}