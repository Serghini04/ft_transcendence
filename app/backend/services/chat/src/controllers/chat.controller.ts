import { FastifyRequest, FastifyReply } from "fastify";
import { User } from "../models/user";

interface Contact {
    id: number,
    userContact: User,
}

async function getAllContacts(req: FastifyRequest, res: FastifyReply) {
    // Api GetWay :
    req.user = { userId: 1, fullName: "Mehdi Serghini" };

    const stmt = req.server.db.prepare(`
        SELECT
        contacts.id AS contact_id,
        users.id AS user_id,
        users.full_name,
        users.username,
        users.status,
        users.avatar_url
        FROM contacts
        JOIN users 
        ON users.id = CASE 
            WHEN contacts.sender_id = ? THEN contacts.received_id
            ELSE contacts.sender_id
        END
        WHERE ? IN (contacts.sender_id, contacts.received_id);
    `);
    if (req.user)
        res.send(stmt.all(req.user.userId, req.user.userId));
    else
        res.status(400).send({ error: "User not authenticated" });
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