import { User } from "./user";

export class Contact {
    contactId: number;
    user: User;
    isBlocked: boolean;
    constructor(id: number, user: User, isBlocked: boolean = false) {
        this.contactId = id;
        this.user = user;
        this.isBlocked = isBlocked;
    }
}