
import { UseTokenStore } from "../userAuth/zustand/useStore";


export function verifyToken(data: any){
  const {  setToken } = UseTokenStore.getState();
  console.error("Verifying token with data:", data.code);
    if (data.code === "TOKEN_REFRESHED") {
      setToken(data.accessToken);
      return false;
    }
  
    if (data.code === "NO_TOKEN" || data.code === "NO_REFRESH_TOKEN" || data.code === "INVALID_ACCESS_TOKEN" || data.code === "REFRESH_INVALID") {
      window.location.href = "/auth";
      return false;
    }
    return true;
  }
  
  export default verifyToken;