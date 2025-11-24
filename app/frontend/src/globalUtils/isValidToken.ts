

export async function isValidToken(token: string | null): Promise<{ valid: boolean; newToken: string | null }> {
  if (!token) 
    return { valid: false, newToken: null };
  
  const res = await fetch("http://localhost:8080/api/v1/auth/protect", {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const data = await res.json();

  if (data.code === "TOKEN_REFRESHED") {
    return { valid: true, newToken: data.accessToken };
  }

  if (data.code === "NO_TOKEN" || data.code === "NO_REFRESH_TOKEN" || data.code === "INVALID_ACCESS_TOKEN" || data.code === "REFRESH_INVALID") {
    return { valid: false, newToken: null };
  }
  return { valid: true, newToken: null };
}

export default isValidToken;