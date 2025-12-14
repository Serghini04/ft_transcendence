export class Notification {
    id: number;
    userId: number;
    title: string;
    type: string;
    message: string;
    read: boolean;
    createdAt: Date;

    constructor(
        id: number,
        userId: number,
        title: string,
        message: string,
        type: string,
        read: boolean,
        createdAt: Date
    ) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.message = message;
        this.read = read;
        this.createdAt = createdAt;
        this.type = type;
    }
}