import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";
import axios from "axios";

interface GameState {
  ball: { x: number; y: number, radius: number, vx: number, vy: number, speed: number, visible: boolean };
  paddles: { left: { x: number; y: number; width: number; height: number; speed: number }, right: { x: number; y: number; width: number; height: number; speed: number } };
  scores: { left: number; right: number };
  powerUp: { visible: boolean; x: number; y: number; radius: number; type: string | null; duration: number; activeFor: "left" | "right" | null };
}

interface Player {
  id: number;
  name: string;
  image: string;
}

interface Players {
  first: Player;
  second: Player;
}

export default function Online() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [winner, setWinner] = useState<"left" | "right" | null>(null);
  const [time, setTime] = useState(0);
  const winnerRef = useRef<"left" | "right" | null>(null);
  const loopRef = useRef<() => void>(() => {});
  const [state, setState] = useState<GameState>({
    ball: { x: 600, y: 337.5, radius: 8, vx: 0, vy: 0, speed: 0, visible: true },
    paddles: { left: { x: 20, y: 200, width: 10, height: 90, speed: 10 }, right: { x: 770, y: 200, width: 10, height: 90, speed: 10 } },
    scores: { left: 0, right: 0 },
    powerUp: { visible: false, x: 0, y: 0, radius: 0, type: null, duration: 0, activeFor: null },
  });
  const [players, setPlayers] = useState<Players>({
    first: { id: 0, name: "", image: "" },
    second: { id: 0, name: "", image: "" },
  });

  useEffect(() => {
  axios
    .get("http://localhost:5000/api/players")
    .then((response) => setPlayers(response.data))
    .catch((error) => console.error("Error fetching players:", error));
  }, []);
  const location = useLocation();
  const { map = "Classic", state.powerUp.visible = false, speed = "Normal" } = location.state || {};

  const gameThemes = {
    Classic: {
      background: "bg-[rgba(0,0,0,0.75)]",
      color: "#8ADDD4",
    },
    Desert: {
      background: "bg-gradient-to-b from-yellow-600 via-amber-800 to-orange-900",
      color: "#FFD580",
    },
    Chemistry: {
      background: "bg-gradient-to-br from-lime-600 via-emerald-800 to-green-950",
      color: "#A8FF60",
    },
  };

  const theme = gameThemes[map] || gameThemes.Classic;
  const speedMultiplier = { Slow: 0.8, Normal: 1.3, Fast: 2.5 };

  // Connect to Socket.IO
  useEffect(() => {
    const s = io("http://localhost:8080", {transports: ['websocket']});
    setSocket(s);

    s.emit("joinGame", { map, state.powerUp.visible, speed });

    s.on("connect", () => console.log("🔗 Connected:", s.id));
    s.on("waiting", () => setWaiting(true));
    s.on("start", ({ side }) => {
      console.log("🚀 Match started as:", side);
      setSide(side);
      setWaiting(false);
    });
    s.on("state", (data: GameState) => {
      setState(data);
      if (data.scores.left >= 5) setWinner("left");
      else if (data.scores.right >= 5) setWinner("right");
    });
    s.on("end", () => {
      alert("Opponent disconnected");
      setWaiting(true);
      setSide(null);
    });

    return () => s.disconnect();
  }, []);

  // Handle paddle movement
  useEffect(() => {
    if (!socket || !side) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const dy =
        e.key === "ArrowUp" || e.key === "w"
          ? -10
          : e.key === "ArrowDown" || e.key === "s"
          ? 10
          : 0;
      if (dy !== 0) socket.emit("move", { dy });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [socket, side]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!winnerRef.current && !waiting) setTime((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  // Draw game frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, width, height);

      // Center dashed line
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.setLineDash([10]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Draw ball
      ctx.fillStyle = theme.color;
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw paddles
      ctx.fillStyle = theme.color;
      ctx.beginPath();
      ctx.roundRect(0, state.paddles.left, 10, 90, 6);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(width - 10, state.paddles.right, 10, 90, 6);
      ctx.fill();

      // Draw power-up paddle
      if (state.powerUp && state.powerUp.visible) {
        ctx.save();
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
        ctx.globalAlpha = pulse;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = theme.color;
        const hueShift = (Date.now() / 15) % 360;
        ctx.fillStyle = `hsl(${hueShift}, 80%, 60%)`;

        ctx.beginPath();
        ctx.roundRect(state.powerUp.x, state.powerUp.y, state.powerUp.width, state.powerUp.height, 6);
        ctx.fill();

        ctx.restore(); // restore globalAlpha, shadows, etc.
      }

    };

    const loop = () => {
      draw();
      if (!winnerRef.current) requestAnimationFrame(loop);
    };
    loopRef.current = loop;
    loop();

  }, [state]);

  const resetGame = () => {
    setWinner(null);
    winnerRef.current = null;
    setTime(0);
    socket?.emit("restart");
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)]">
      {/* Waiting overlay */}
      {waiting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 text-white text-2xl font-bold">
          Waiting for opponent...
        </div>
      )}

      {/* Scoreboard */}
      <div className="flex justify-center items-center w-full mt-6 mb-10">
        <div
          className="flex justify-between items-center w-[700px] max-w-[90%] px-6 py-3 rounded-[15px] text-white"
          style={{
            background:
              "linear-gradient(90deg, rgba(14,19,24,0.28) 0%, rgba(169,255,246,0.28) 50%, rgba(14,23,30,0.28) 100%)",
            height: "65px",
          }}
        >
          <div className="flex items-center gap-3 w-20">
            <img src={players.first.image} alt="" className="h-10 rounded-full" />
            <span className="text-[22px] font-semibold">{state.scores.left}</span>
          </div>

          <div
            className="flex flex-col items-center justify-center px-10 py-2 text-black font-medium"
            style={{
              background: "rgba(217, 217, 217, 0.5)",
              clipPath: "polygon(0% 0%, 100% 0%, 70% 100%, 30% 100%)",
              height: "65px",
              width: "170px",
            }}
          >
            <span className="text-[18px]">Time</span>
            <span className="text-[18px]">{formatTime(time)}</span>
          </div>

          <div className="flex items-center gap-3 w-20">
            <span className="text-[22px] font-semibold">{state.scores.right}</span>
            <img src={players.second.image} alt="" className="h-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div
        className={`relative border border-white/10 rounded-[7px] overflow-hidden shadow-xl ${theme.background} w-full max-w-5xl aspect-[16/9]`}
      >
        <canvas ref={canvasRef} width={1200} height={675} className="w-full h-full" />

        {/* Winner Overlay */}
        {winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
            <img
              src={winner === "left" ? players.first.image : players.second.image}
              alt="Winner"
              className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-lg mb-4"
            />
            <h2 className="text-white text-3xl font-bold text-center mb-4">
              {winner === "left" ? players.first.name : players.second.name} won the game! 🏆
            </h2>
            <button
              onClick={resetGame}
              className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
