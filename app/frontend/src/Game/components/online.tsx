import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";

interface GameState {
  ball: { x: number; y: number };
  paddles: { left: number; right: number };
  scores: { left: number; right: number };
}

export default function Online() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [state, setState] = useState<GameState>({
    ball: { x: 400, y: 250 },
    paddles: { left: 200, right: 200 },
    scores: { left: 0, right: 0 },
  });

  const location = useLocation();
  const { map = "Classic", powerUps = false, speed = "Normal" } = location.state || {};

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

    s.emit("joinGame", { map, powerUps, speed });

    s.on("connect", () => console.log("🔗 Connected:", s.id));
    s.on("waiting", () => setWaiting(true));
    s.on("start", ({ side }) => {
      console.log("🚀 Match started as:", side);
      setSide(side);
      setWaiting(false);
    });
    s.on("state", (data: GameState) => setState(data));
    s.on("end", () => {
      alert("Opponent disconnected");
      setWaiting(true);
      setSide(null);
    });

    setSocket(s);
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

  // Draw game frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

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

    // Scores
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${state.scores.left} - ${state.scores.right}`, width / 2, 40);
  }, [state]);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center text-white">
      {waiting ? (
        <p className="text-lg animate-pulse">Waiting for opponent...</p>
      ) : (
        <>
          <p className="mb-3 text-xl">You are: {side?.toUpperCase()}</p>
          <div
            className={`border border-white/10 rounded-lg shadow-lg ${theme.background}`}
          >
            <canvas ref={canvasRef} width={800} height={500} />
          </div>
        </>
      )}
    </div>
  );
}
