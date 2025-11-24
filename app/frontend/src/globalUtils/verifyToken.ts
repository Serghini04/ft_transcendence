export async function isValidToken(data: any): Promise<{ valid: boolean; newToken: string | null }> {
  
    if (data.code === "TOKEN_REFRESHED") {
      return { valid: true, newToken: data.accessToken };
    }
  
    if (data.code === "NO_TOKEN" || data.code === "NO_REFRESH_TOKEN" || data.code === "INVALID_ACCESS_TOKEN" || data.code === "REFRESH_INVALID") {
      return { valid: false, newToken: null };
    }
    return { valid: true, newToken: null };
  }
  
  export default isValidToken;