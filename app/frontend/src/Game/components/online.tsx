import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { UseTokenStore, UseUserStore } from "../../userAuth/LoginAndSignup/zustand/useStore";


interface GameState {
  canvas: { width: number, height: number,};
  ball: { x: number; y: number, radius: number, vx: number, vy: number, speed: number, visible: boolean };
  paddles: { left: { x: number; y: number; width: number; height: number; speed: number }, right: { x: number; y: number; width: number; height: number; speed: number } };
  scores: { left: number; right: number };
  powerUp: { found: boolean; x: number; y: number; width: number; height: number; visible: boolean; duration: number; spawnTime: number | null};
  winner?: "left" | "right" | null;
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  side: "left" | "right";
}

export default function Online() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const winnerRef = useRef<"left" | "right" | null>(null);
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [side, setSide] = useState<"left" | "right" | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [winner, setWinner] = useState<"left" | "right" | null>(null);
  const [time, setTime] = useState(0);
  const [restartReady, setRestartReady] = useState({ left: false, right: false });
  const [waitingForRestart, setWaitingForRestart] = useState(false);
  const [forfeitWin, setForfeitWin] = useState(false);
  
  // User profiles
  const [yourProfile, setYourProfile] = useState<UserProfile | null>(null);
  const [opponentProfile, setOpponentProfile] = useState<UserProfile | null>(null);
  const [winnerProfile, setWinnerProfile] = useState<UserProfile | null>(null);
  const [loserProfile, setLoserProfile] = useState<UserProfile | null>(null);

  // const { token } = UseTokenStore();
  // const { user } = UseUserStore();


  const [state, setState] = useState<GameState>({
    canvas: { width: 1200, height: 675 },
    ball: { x: 600, y: 337.5, radius: 8, vx: 0, vy: 0, speed: 0, visible: true },
    paddles: { left: { x: 20, y: 200, width: 10, height: 90, speed: 10 }, right: { x: 770, y: 200, width: 10, height: 90, speed: 10 } },
    scores: { left: 0, right: 0 },
    powerUp: { found: false, x: 0, y: 0, width: 0, height: 0, visible: false, duration: 0, spawnTime: null },
    winner: null,
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
    const s = io("http://localhost:3005", {transports: ['websocket']});
    setSocket(s);

    // const res = await fetch(`http://localhost:8080/api/v1/chat/conversation/${contact.user.id}`, {
    //         method: "POST",
    //         credentials: "include",
    //         headers: { Authorization: `Bearer ${token}` },
    //         body: JSON.stringify({ userId: user.id }),

    //       });
    
    // const data = await res.json();
    // const isValid = verifyToken(data);
    const currentUserId = localStorage.getItem('userId') || `user_${Date.now()}`;
    
    s.emit("joinGame", { userId: currentUserId, options: { map, powerUps, speed } });
    console.log("Joining game with settings:", { map, powerUps, speed });
    s.on("connect", () => console.log("🔗 Connected:", s.id));
    s.on("waiting", () => setWaiting(true));

    s.on("start", ({ side, opponent, you }: { side: "left" | "right", opponent: UserProfile, you: UserProfile }) => {
      console.log("🚀 Match started as:", side);
      console.log("👤 Your profile:", you);
      console.log("🎮 Opponent:", opponent);
      setSide(side);
      setYourProfile(you);
      yourProfile!.side = side;
      setOpponentProfile(opponent);
      opponentProfile!.side = side === "left" ? "right" : "left";
      setWaiting(false);
      setTime(0);
      setWinner(null);
      winnerRef.current = null;
      setForfeitWin(false);
    });

    s.on("state", (data: GameState) => {
      setState(data);
    });

    s.on("gameOver", ({ winner, winnerProfile, loserProfile}: { 
      winner: "left" | "right", 
      winnerProfile: UserProfile,
      loserProfile: UserProfile,
      scores: { left: number, right: number },
      duration: number
    }) => {
      console.log("🏆 Game Over!", { winner, winnerProfile, loserProfile});
      setWinner(winner);
      winnerRef.current = winner;
      setWinnerProfile(winnerProfile);
      setLoserProfile(loserProfile);
    });

    s.on("restartReady", ({side, leftReady, rightReady }: { side: string, leftReady: boolean, rightReady: boolean }) => {
      setRestartReady({ left: leftReady, right: rightReady });
      if (side ===  opponentProfile?.side)
        console.log("🔄 Opponent is ready to restart");
    });

    s.on("gameRestarted", () => {
      console.log("🔄 Game restarted!");
      setWinner(null);
      winnerRef.current = null;
      setTime(0);
      setRestartReady({ left: false, right: false });
      setWaitingForRestart(false);
      setForfeitWin(false);
    });

    s.on("opponentDisconnected", ({ winner: forfeitWinner }: { winner: "left" | "right", reason: string }) => {
      console.log("⚠️ Opponent disconnected");
      setWinner(forfeitWinner);
      winnerRef.current = forfeitWinner;
      setWaitingForRestart(false);
      setForfeitWin(true);
      // Update score to reflect forfeit win
      setState(prev => ({
        ...prev,
        winner: forfeitWinner,
        scores: forfeitWinner === "left" 
          ? { left: 5, right: prev.scores.right }
          : { left: prev.scores.left, right: 5 }
      }));
    });

    s.on("end", () => {
      alert("Opponent disconnected");
      setWaiting(true);
      setSide(null);
    });

    return () => s.disconnect();
  }, []);

  // Handle paddle movement - continuous movement while key is held
  useEffect(() => {
    if (!socket || !side) return;

    const keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        keysPressed[e.key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        keysPressed[e.key] = false;
      }
    };

    // Send movement updates continuously while keys are held
    const moveInterval = setInterval(() => {
      if (keysPressed["ArrowUp"]) {
        socket.emit("move", { direction: -1 });
      } else if (keysPressed["ArrowDown"]) {
        socket.emit("move", { direction: 1 });
      }
    }, 16);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(moveInterval);
    };
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
      ctx.roundRect(0, state.paddles.left.y, 10, 90, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(width - 10, state.paddles.right.y, 10, 90, 8);
      ctx.fill();

      // Draw power-up paddle
      if (state.powerUp.found && state.powerUp.visible) {
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
      if (!canvasRef.current) return;
      draw();
      if (!winnerRef.current)
        requestAnimationFrame(loop);
      else
      {
        if (rafRef.current)
          cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    loop();
    return () => {
      if (rafRef.current)
        cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

  }, [state]);

  const resetGame = () => {
    setWaitingForRestart(true);
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 text-white text-2xl font-bold rounded-tl-4xl">
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
            {side === "left" && yourProfile && (
              <>
                <img src={yourProfile.avatar} alt={yourProfile.name} className="h-10 w-10 rounded-full object-cover" />
                <span className="text-[22px] font-semibold">{state.scores.left}</span>
              </>
            )}
            {side === "right" && opponentProfile && (
              <>
                <img src={opponentProfile.avatar} alt={opponentProfile.name} className="h-10 w-10 rounded-full object-cover" />
                <span className="text-[22px] font-semibold">{state.scores.left}</span>
              </>
            )}
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
            {side === "right" && yourProfile && (
              <img src={yourProfile.avatar} alt={yourProfile.name} className="h-10 w-10 rounded-full object-cover" />
            )}
            {side === "left" && opponentProfile && (
              <img src={opponentProfile.avatar} alt={opponentProfile.name} className="h-10 w-10 rounded-full object-cover" />
            )}
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div
        className={`relative border border-white/10 rounded-[7px] overflow-hidden shadow-xl ${theme.background} w-full max-w-5xl aspect-[16/9]`}
      >
        <canvas ref={canvasRef} width={state.canvas.width} height={state.canvas.height} className="w-full h-full" />

        {/* Winner Overlay */}
        {winner && winnerProfile && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 rounded-tl-4xl">
            <img
              src={winnerProfile.avatar}
              alt={winnerProfile.name}
              className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-lg mb-4 object-cover"
            />
            <h2 className="text-white text-3xl font-bold text-center mb-4">
              {forfeitWin 
                ? (winner === side ? "🏆 You Won by Forfeit!" : "😞 Opponent Disconnected")
                : (winner === side ? "🏆 You Won!" : `😞 ${winnerProfile.name} Won!`)
              }
            </h2>
            {forfeitWin && (
              <p className="text-gray-300 text-sm mb-4">Your opponent left the game</p>
            )}
            
            {waitingForRestart ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-white text-xl font-semibold">
                  Waiting for your opponent...
                </div>
              </div>
            ) : forfeitWin ? (
              <button
                onClick={() => navigate("/game")}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
              >
                Return to Menu
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
              >
                Play Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
