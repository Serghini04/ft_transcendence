import axios from "axios";

export const axiosInstance = axios.create({
    // baseURL: "http://localhost:3000",
    baseURL: "https://orange-spork-gwpjvgpgxjwfvxx9-3000.app.github.dev/",
    withCredentials: true
})