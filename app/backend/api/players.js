import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());

app.get("/api/players", (req, res) => {
  res.json({
    first: { id: 1, name: "W.White", image: "/src/assets/images/user1.jpeg" },
    second: { id: 2, name: "J.Pinkman" , image: "/src/assets/images/user2.jpeg" },
  });
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

