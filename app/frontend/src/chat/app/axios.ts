import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://improved-dollop-rvxq5jxj4rp25g74-3000.app.github.dev",
    withCredentials: true
})