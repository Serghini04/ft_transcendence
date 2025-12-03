// import { set } from "date-fns";
import { UseTokenStore } from "../userAuth/LoginAndSignup/zustand/useStore";


export function verifyToken(data: any){
  const {  setToken } = UseTokenStore.getState();
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