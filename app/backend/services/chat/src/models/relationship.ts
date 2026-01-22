import { User } from "./user";

export class Relationship {
    id: number;
    user: User;
    avatarUrl: string;
    blockStatus: 'blocked_by_me' | 'blocked_by_them' | 'none';
    unseenMessages:number;
    constructor(id: number, user: User, blockStatus: 'blocked_by_me' | 'blocked_by_them' | 'none' = 'none', unseenMessages:number) {
        this.id = id;
        this.user = user;
        this.avatarUrl = user.avatarUrl;
        this.blockStatus = blockStatus;
        this.unseenMessages = unseenMessages;
    }

    toJSON() {
        return {
            id: this.id,
            user: this.user,
            avatarUrl: this.avatarUrl,
            blockStatus: this.blockStatus,
            unseenMessages: this.unseenMessages
        };
    }
}