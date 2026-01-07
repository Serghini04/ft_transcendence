import Database from "better-sqlite3";
import { User, UserStatus } from "../models/user";

export class userRepository {
    constructor(private db: Database.Database) {

    }
    getUserById(userId: number): User | null {
        const stmt = this.db.prepare(`
            SELECT
                id,
                full_name AS fullName,
                username AS username,
                status,
                avatar_url AS avatarUrl
            FROM users
            WHERE id = ?;
        `);
    
        const row = stmt.get(userId) as {
            id: number;
            fullName: string;
            username: string;
            status: UserStatus;
            avatarUrl: string;
        } | undefined;
    
        if (!row)
            return null;
        return new User(row.id, row.fullName, row.username, row.status, row.avatarUrl);
    }

    searchUsers(searchQuery: string, limit: number = 20): User[] {
        const stmt = this.db.prepare(`
            SELECT
                id,
                full_name AS fullName,
                username AS username,
                status,
                avatar_url AS avatarUrl
            FROM users
            WHERE username LIKE ? OR full_name LIKE ?
            LIMIT ?;
        `);
    
        const searchPattern = `%${searchQuery}%`;
        const rows = stmt.all(searchPattern, searchPattern, limit) as {
            id: number;
            fullName: string;
            username: string;
            status: UserStatus;
            avatarUrl: string;
        }[];
    
        return rows.map(row => 
            new User(row.id, row.fullName, row.username, row.status, row.avatarUrl)
        );
    }
    
}