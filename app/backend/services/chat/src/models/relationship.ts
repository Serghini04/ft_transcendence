import { User } from "./user";

export class Relationship {
    relationshipId: number;
    user: User;
    isBlocked: boolean;
    constructor(id: number, user: User, isBlocked: boolean = false) {
        this.relationshipId = id;
        this.user = user;
        this.isBlocked = isBlocked;
    }
}