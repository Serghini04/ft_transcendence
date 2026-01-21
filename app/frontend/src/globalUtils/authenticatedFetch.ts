/**
 * Wrapper around fetch that automatically handles token refresh.
 * If the API returns TOKEN_REFRESHED, it updates the token store and retries the request.
 */

import { UseTokenStore } from "../userAuth/zustand/useStore";

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { token, setToken } = UseTokenStore.getState();
  
  // Add authorization header
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  // Make the initial request
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
  
  // Check if we got a token refresh response
  const data = await response.clone().json();
  
  if (data.code === "TOKEN_REFRESHED" && data.accessToken) {
    console.log("🔄 Token refreshed, retrying request...");
    
    // Update token in store
    setToken(data.accessToken);
    
    // Retry the request with new token
    headers.set("Authorization", `Bearer ${data.accessToken}`);
    const retryResponse = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
    
    return retryResponse;
  }
  
  return response;
}
