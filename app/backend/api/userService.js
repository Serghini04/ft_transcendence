import axios from 'axios';

// Mock user service - replace with your actual user service URL
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

// In-memory cache for user profiles
const userCache = new Map();

/**
 * Fetch user profile from user service or cache
 */
export const getUserProfile = async (userId) => {
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }

  try {
    // Try to fetch from user service
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`, {
      timeout: 3000
    });

    const profile = {
      id: response.data.id || userId,
      name: response.data.name || response.data.username || `Player_${userId}`,
      avatar: response.data.avatar || response.data.profilePicture || generateAvatar(userId),
    };

    // Cache for 5 minutes
    userCache.set(userId, profile);
    setTimeout(() => userCache.delete(userId), 5 * 60 * 1000);

    return profile;
  } catch (error) {
    console.warn(`⚠️  Could not fetch profile for ${userId}, using defaults:`, error.message);
    
    // Return default profile if service is unavailable
    const defaultProfile = {
      id: userId,
      name: `Player_${userId.slice(0, 6)}`,
      avatar: generateAvatar(userId),
    };

    // Cache default profile temporarily
    userCache.set(userId, defaultProfile);
    setTimeout(() => userCache.delete(userId), 60 * 1000);

    return defaultProfile;
  }
};

/**
 * Generate a default avatar URL using an avatar service
 */
const generateAvatar = (userId) => {
  // Using DiceBear API for consistent avatars
  const seed = userId || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

/**
 * Clear user from cache (useful when profile updates)
 */
export const invalidateUserCache = (userId) => {
  userCache.delete(userId);
};
