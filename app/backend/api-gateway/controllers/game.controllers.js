import { gameService } from "../services/gameService.js";

export const getUserGames = async (req, res) => {
  try {
    const response = await gameService.get(`/api/games/user/${req.params.userId}`);
    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Game service unreachable" });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const response = await gameService.get(`/api/games/stats/${req.params.userId}`);
    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Game service unreachable" });
  }
};

export const getRecentGames = async (req, res) => {
  try {
    const response = await gameService.get(`/api/games/recent`);
    res.json(response.data);
  } catch {
    res.status(500).json({ error: "Game service unreachable" });
  }
};
