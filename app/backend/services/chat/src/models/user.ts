
export class User{
    id: number;
    fullName: string;
    avatarUrl: string;
    bgPhotoUrl: string;
    bio: string;
    showNotifications: boolean;

    constructor(id: number, fullName: string, avatarUrl: string, bgPhotoUrl: string, bio: string, showNotifications: boolean) {
        this.id = id;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.bgPhotoUrl = bgPhotoUrl;
        this.bio = bio;
        this.showNotifications = showNotifications;
    }

    toJSON() {
        return {
            id: this.id,
            fullName: this.fullName,
            avatarUrl: this.avatarUrl,
            bgPhotoUrl: this.bgPhotoUrl,
            bio: this.bio,
            showNotifications: this.showNotifications
        };
    }
}