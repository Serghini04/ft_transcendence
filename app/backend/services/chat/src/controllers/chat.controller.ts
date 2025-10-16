import { FastifyReply, FastifyRequest } from "fastify";

async function getAllContacts(req: FastifyRequest, res: FastifyReply) {
    const messages = req.server.db.prepare("SELECT * FROM messages").all();
    res.send(messages);
}

async function getConversationByUserId(req: FastifyRequest, res: FastifyReply) {
    const {id} = req.params as {id: string};
    res.send({message: "GET Converstaion By User Id " + id});
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