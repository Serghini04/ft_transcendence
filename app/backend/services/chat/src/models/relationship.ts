import { User } from "./user";

export class Relationship {
    id: number;
    user: User;
    isBlocked: boolean;
    unseenMessages:number;
    constructor(id: number, user: User, isBlocked: boolean = false, unseenMessages:number) {
        this.id = id;
        this.user = user;
        this.isBlocked = isBlocked;
        this.unseenMessages = unseenMessages;
    }
}