
import { useEffect, useRef, useState } from "react";

interface GameState {
  ball: { x: number; y: number };
  paddles: { left: number; right: number };
}

export default function Online() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [state, setState] = useState<GameState>({
    ball: { x: 400, y: 250 },
    paddles: { left: 200, right: 200 },
  });
  const [waiting, setWaiting] = useState(true);

  // Connect WebSocket
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "waiting") setWaiting(true);
      else if (data.type === "start") {
        setSide(data.side);
        setWaiting(false);
      } else if (data.type === "state") {
        setState({ ball: data.ball, paddles: data.paddles });
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  // Keyboard input
  useEffect(() => {
    if (!ws || !side) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") {
        ws.send(JSON.stringify({ type: "move", side, dy: -10 }));
      } else if (e.key === "ArrowDown" || e.key === "s") {
        ws.send(JSON.stringify({ type: "move", side, dy: 10 }));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ws, side]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ball
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      ctx.fillRect(10, state.paddles.left, 10, 100);
      ctx.fillRect(780, state.paddles.right, 10, 100);
    };

    draw();
  }, [state]);

  return (
    <div className="relative w-full min-h-screen">
      <div className="flex flex-col items-center justify-center h-screen text-white">
        {waiting ? (
          <p className="text-lg animate-pulse">Waiting for opponent...</p>
        ) : (
          <>
            <p className="mb-2">You are: {side?.toUpperCase()}</p>
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="border border-gray-700 rounded-lg"
            />
          </>
        )}
      </div>
    </div>
  );
}
