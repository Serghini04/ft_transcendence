import Database from "better-sqlite3";
import { User } from "../models/user";

export class userRepository {
    constructor(private db: Database.Database) {

    }
    getUserById(userId: number): User | null {
        const stmt = this.db.prepare(`
            SELECT
                id,
                full_name AS fullName,
                avatar_url AS avatarUrl,
                bg_photo_url AS bgPhotoUrl,
                bio
            FROM users
            WHERE id = ?;
        `);
    
        const row = stmt.get(userId) as {
            id: number;
            fullName: string;
            avatarUrl: string;
            bgPhotoUrl: string;
            bio: string;
        } | undefined;
    
        if (!row)
            return null;
        return new User(row.id, row.fullName, row.avatarUrl, row.bgPhotoUrl, row.bio);
    }

    searchUsers(searchQuery: string, limit: number = 20): User[] {
        const stmt = this.db.prepare(`
            SELECT
                id,
                full_name AS fullName,
                avatar_url AS avatarUrl,
                bg_photo_url AS bgPhotoUrl,
                bio
            FROM users
            WHERE full_name LIKE ?
            LIMIT ?;
        `);
    
        const searchPattern = `%${searchQuery}%`;
        const rows = stmt.all(searchPattern, limit) as {
            id: number;
            fullName: string;
            avatarUrl: string;
            bgPhotoUrl: string;
            bio: string;
        }[];
    
        return rows.map(row => 
            new User(row.id, row.fullName, row.avatarUrl, row.bgPhotoUrl, row.bio)
        );
    }
    
}