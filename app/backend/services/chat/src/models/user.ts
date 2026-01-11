
export class User{
    id: number;
    fullName: string;
    avatarUrl: string;
    bgPhotoUrl: string;
    bio: string;

    constructor(id: number, fullName: string, avatarUrl: string, bgPhotoUrl: string, bio: string) {
        this.id = id;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.bgPhotoUrl = bgPhotoUrl;
        this.bio = bio;
    }

    toJSON() {
        return {
            id: this.id,
            fullName: this.fullName,
            avatarUrl: this.avatarUrl,
            bgPhotoUrl: this.bgPhotoUrl,
            bio: this.bio
        };
    }
}