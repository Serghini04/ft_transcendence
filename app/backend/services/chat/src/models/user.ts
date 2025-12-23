
export type UserStatus = 'online' | 'offline' | string;

export class User{
    id: number;
    fullName: string;
    username: string;
    status: UserStatus;
    avatarUrl: string;

    constructor(id: number, fullName: string, username: string, status: UserStatus, avatarUrl: string) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
        this.status = status;
        this.avatarUrl = avatarUrl;
    }

    toJSON() {
        return {
            id: this.id,
            fullName: this.fullName,
            username: this.username,
            status: this.status,
            avatarUrl: this.avatarUrl
        };
    }
}