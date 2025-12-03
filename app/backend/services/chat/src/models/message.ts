import { User } from "./user";

export class Message {
    id: number;
    text: string;
    isSender: boolean;
    timestamp: Date;

    constructor(
        id: number,
        timestamp: Date,
        text: string,
        isSender: boolean,
    ) {
        this.id = id;
        this.text = text;
        this.isSender = isSender;
        this.timestamp = timestamp;
    }
}