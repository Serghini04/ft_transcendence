import axios from "axios";
import verifyToken from "../../globalUtils/verifyToken";
import { UseTokenStore } from "../../userAuth/zustand/useStore";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

// Request interceptor to add token to all requests
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = UseTokenStore.getState().token;
    
//     console.log("🔑 Axios Request:", {
//       url: config.url,
//       hasToken: !!token,
//       tokenPreview: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
//     });
    
//     if (token) {
//       console.error("🔍 Verifying token before request");
//       config.headers.Authorization = `Bearer ${token}`;
//     } else {
//       console.warn("⚠️ No token available for request:", config.url);
//     }
    
//     return config;
//   },
//   (error) => {
//     console.error("❌ Request interceptor error:", error);
//     return Promise.reject(error);
//   }
// );

// // Response interceptor
// axiosInstance.interceptors.response.use(
//   async (response) => {
//     console.log("✅ Response received:", {
//       url: response.config.url,
//       status: response.status,
//       hasCode: !!response.data?.code,
//     });
    
//     const { setToken } = UseTokenStore();
    
//     // Check if token was refreshed
//     if (response.data?.code === "TOKEN_REFRESHED" && response.data?.accessToken) {
//       console.error("🔍 Verifying token from response===========+++++++++++++++++");
//       console.log("🔄 Token refreshed from response");
//       setToken(response.data.accessToken);
//     }

//     return response;
//   },

//   async (error) => {
//     // const { setToken } = UseTokenStore.getState();
//     const originalRequest = error.config;
    
//     console.error("❌ Response error:", {
//       url: error.config?.url,
//       status: error.response?.status,
//       code: error.response?.data?.code,
//     });
    
//     // Handle token refresh on 403 with specific error codes
//     if (
//       error.response?.status === 403 && 
//       error.response?.data?.code === "INVALID_ACCESS_TOKEN" &&
//       !originalRequest._retry
//     ) {
//       originalRequest._retry = true;
      
//       console.log("🔄 Attempting to refresh token via refresh endpoint");
      
//       try {
//         // The auth middleware should handle refresh automatically with cookies
//         // Just retry the request - the middleware will refresh the token
//         const response = await axiosInstance(originalRequest);
//         return response;
//       } catch (refreshError) {
//         console.error("❌ Token refresh failed:", refreshError);
//         // setToken("");
//         window.location.href = "/auth";
//         return Promise.reject(refreshError);
//       }
//     }
    
//     // Handle 401 or other auth errors

//       const {setToken} = UseTokenStore();
//       if (error.response?.data?.code === "TOKEN_REFRESHED") {
//         setToken(error.response.data.accessToken);
//       }
//     if (error.response?.status === 401 ||
//         error.response?.data?.code === "NO_TOKEN" ||
//         error.response?.data?.code === "NO_REFRESH_TOKEN" ||
//         error.response?.data?.code === "REFRESH_INVALID") {
//       console.error("🔒 Authentication failed, redirecting to login");
//       setToken("");
//       window.location.href = "/auth";
//       return Promise.reject(error);
//     }

//     return Promise.reject(error);
//   }
// );

export default axiosInstance;