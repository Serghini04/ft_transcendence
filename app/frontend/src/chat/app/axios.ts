// axios.ts
import axios from "axios";
import verifyToken from "../../globalUtils/verifyToken";
import { UseTokenStore } from "../../userAuth/LoginAndSignup/zustand/useStore";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8080",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  async (response) => {
    console.log("Response intercepted:", response);
    const { setToken } = UseTokenStore.getState();   // FIXED

    const validation = await verifyToken(response.data);

    if (validation.valid && validation.newToken) {
      setToken(validation.newToken);

      const originalRequest = response.config;
      originalRequest.headers.Authorization = `Bearer ${validation.newToken}`;

      return axiosInstance(originalRequest);
    }

    return response;
  },

  async (error) => {

    if (error.response) {
      const validation = await verifyToken(error.response.data);
      console.log("-----------------> VALIDATION:", validation);
      console.log("-----------------> ERROR RESPONSE DATA:", error.response.data);

      if (!validation.valid) {
        // setToken("");
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
