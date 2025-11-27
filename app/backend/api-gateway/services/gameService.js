import axios from "axios";

export const gameService = axios.create({
  baseURL: process.env.GAME_SERVICE_URL || "http://localhost:8080",
  timeout: 5000,
});
