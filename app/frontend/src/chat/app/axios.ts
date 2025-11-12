import axios from "axios";

export const axiosInstance = axios.create({
    // baseURL: "http://localhost:3003",
    baseURL: "https://orange-spork-gwpjvgpgxjwfvxx9-3003.app.github.dev/",
    withCredentials: true
})