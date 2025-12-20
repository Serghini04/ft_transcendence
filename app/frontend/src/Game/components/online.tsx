import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { UseTokenStore, UseUserStore } from "../../userAuth/LoginAndSignup/zustand/useStore";
import verifyToken from "../../globalUtils/verifyToken";


interface GameState {
  canvas: { width: number, height: number,};
  ball: { x: number; y: number, radius: number, vx: number, vy: number, speed: number, visible: boolean };
  paddles: { left: { x: number; y: number; width: number; height: number; speed: number }, right: { x: number; y: number; width: number; height: number; speed: number } };
  scores: { left: number; right: number };
  powerUp: { found: boolean; x: number; y: number; width: number; height: number; visible: boolean; duration: number; spawnTime: number | null};
  winner?: null;
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export default function Online() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const winnerRef = useRef<string | null>(null);
  const yourProfileRef = useRef<UserProfile | null>(null);
  const opponentProfileRef = useRef<UserProfile | null>(null);
  const playerPositionRef = useRef<"left" | "right" | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

  const { token } = UseTokenStore();
  const { user } = UseUserStore();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [winner, setWinner] = useState<string | null>(null); // Store user ID, not side
  const [time, setTime] = useState(0);
  const [restartReady, setRestartReady] = useState({ left: false, right: false });
  const [waitingForRestart, setWaitingForRestart] = useState(false);
  const [forfeitWin, setForfeitWin] = useState(false);
  const [opponentLeftPostGame, setOpponentLeftPostGame] = useState(false);
  
  // User profiles
  const [yourProfile, setYourProfile] = useState<UserProfile | null>(null);
  const [opponentProfile, setOpponentProfile] = useState<UserProfile | null>(null);
  const [winnerProfile, setWinnerProfile] = useState<UserProfile | null>(null);


  const [state, setState] = useState<GameState>({
    canvas: { width: 1200, height: 675 },
    ball: { x: 600, y: 337.5, radius: 8, vx: 0, vy: 0, speed: 0, visible: true },
    paddles: { left: { x: 20, y: 200, width: 10, height: 90, speed: 6 }, right: { x: 770, y: 200, width: 10, height: 90, speed: 6 } },
    scores: { left: 0, right: 0 },
    powerUp: { found: false, x: 0, y: 0, width: 0, height: 0, visible: false, duration: 0, spawnTime: null },
    winner: null,
  });

  const location = useLocation();
  const { map = "Classic", powerUps = false, speed = "Normal" } = location.state || {};
  
  // Check if this is a challenge game (roomId in URL params)
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('roomId');
  const isChallenge = !!roomId;

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

  // Connect to Socket.IO
  useEffect(() => {
    const init = async () => {
      // Check if user is authenticated
      if (!token || !user) {
        console.error("❌ User not authenticated");
        navigate("/auth");
        return;
      }
  
      // Fetch user data
      try {
        const res = await fetch(`http://localhost:8080/api/v1/game/user/${user.id}`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  
        const raw = await res.json();
        verifyToken(raw);
        
        // Normalize backend response
        const data: UserProfile = {
          id: raw.id,
          name: raw.username,
          avatar: raw.avatarUrl,
        };
        
        setYourProfile(data);
        yourProfileRef.current = data;
        console.log("---------> : Fetched user profile:", data); // Log data, not state
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        return;
      }
      
      // Connect to the /game namespace on the API Gateway so events reach the game service
      const s = io("http://localhost:8080/game", {
        path: "/socket.io",
        transports: ["websocket"],
        auth: { token, userId: user.id },
        extraHeaders: { Authorization: `Bearer ${token}` },
      });
      setSocket(s);
      socketRef.current = s; // Store in ref for cleanup
      
      // Only emit joinGame for regular online mode, not for challenges
      if (!isChallenge) {
        s.emit("joinGame", { userId: user.id, options: { map, powerUps, speed, mode: 'online' } });
        console.log("Joining game with settings:", { map, powerUps, speed });
      } else {
        // For challenge mode, join the specific room
        s.emit("joinChallengeRoom", { roomId, userId: user.id });
        console.log("Joining challenge room:", roomId);
      }
  
      s.on("connect", () => console.log("🔗 Connected:", s.id));
      s.on("waiting", () => setWaiting(true));
  
      s.on("start", async ({ opponentId, yourId, position }: { opponentId: string, yourId: string, position: "left" | "right" }) => {
        console.log("🚀 Match started - Position:", position);
        playerPositionRef.current = position;
        
        const currentYourProfile = yourProfileRef.current;
        if (currentYourProfile && currentYourProfile.id !== yourId) {
          console.error("⚠️ Your ID mismatch:", currentYourProfile.id, yourId);
        }
        
        // Fetch opponent profile
        try {
          const res = await fetch(`http://localhost:8080/api/v1/game/user/${opponentId}`, {
            method: "GET",
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          
          const raw = await res.json();
          verifyToken(raw);
          
          const opponentData: UserProfile = {
            id: raw.id,
            name: raw.username,
            avatar: raw.avatarUrl,
          };
          
          setOpponentProfile(opponentData);
          opponentProfileRef.current = opponentData;
          console.log("---------> : Fetched opponent profile:", opponentData);
        } catch (err) {
          console.error("Failed to fetch opponent profile:", err);
        }
        
        setWaiting(false);
        setTime(0);
        setWinner(null);
        winnerRef.current = null;
        setForfeitWin(false);
      });
  
      s.on("state", (data: GameState) => {
        setState(data);
      });

      s.on("gameOver", ({ winnerId }) => {
        const currentYourProfile = yourProfileRef.current;
        const currentOpponentProfile = opponentProfileRef.current;
        
        console.log("🏁 Game Over! Winner:", winnerId === currentYourProfile?.id ? currentYourProfile : currentOpponentProfile);

        setWinner(winnerId);
        winnerRef.current = winnerId;
        
        // Determine winner/loser from existing profiles
        if (currentYourProfile && currentOpponentProfile) {
          if (winnerId === currentYourProfile.id) {
            setWinnerProfile(currentYourProfile);
            console.log("🏆 You won!");
          } else {
            setWinnerProfile(currentOpponentProfile);
            console.log("😞 You lost to", currentOpponentProfile.name);
          }
        }
      });

      s.on("restartReady", ({ leftReady, rightReady }: { leftReady: boolean, rightReady: boolean }) => {
        setRestartReady({ left: leftReady, right: rightReady });
        console.log("Restart ready status:", { leftReady, rightReady });
      });

      s.on("gameRestarted", () => {
        setWinner(null);
        winnerRef.current = null;
        setTime(0);
        setRestartReady({ left: false, right: false });
        setWaitingForRestart(false);
        setForfeitWin(false);
        setOpponentLeftPostGame(false);
        setWinnerProfile(null);
        console.log("🔄 Game restarted!");
      });

      s.on("opponentLeftPostGame", () => {
        console.log("⚠️ Opponent left after game over");
        setOpponentLeftPostGame(true);
        setWaitingForRestart(false);
      });

      s.on("opponentDisconnected", ({ winnerId, gameActive }: { winnerId: string, reason: string, gameActive: boolean }) => {
        console.log("⚠️ Opponent disconnected", { gameActive });
        const currentYourProfile = yourProfileRef.current;
        const currentOpponentProfile = opponentProfileRef.current;
        
        setWinner(winnerId);
        winnerRef.current = winnerId;
        setWaitingForRestart(false);
        
        // Only set forfeitWin if game was active (not after game over)
        if (gameActive) {
          setForfeitWin(true);
        } else {
          setOpponentLeftPostGame(true);
        }
        
        // Set winner/loser profiles
        if (currentYourProfile && currentOpponentProfile) {
          if (winnerId === currentYourProfile.id) {
            setWinnerProfile(currentYourProfile);
          } else {
            setWinnerProfile(currentOpponentProfile);
          }
        }
      });

      s.on("end", () => {
        alert("Opponent disconnected");
        setWaiting(true);
    
        return () => s.disconnect();
      });
    };
  
    init(); // Call the async function

    // Cleanup on unmount (when user navigates away, reloads, or closes tab)
    return () => {
      if (socketRef.current) {
        console.log("🚪 Component unmounting - disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);
  

  // Handle paddle movement - continuous movement while key is held
  useEffect(() => {
    // console.log("Setting up paddle movement listeners started");
    if (!socket || waiting) return;

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
    
    // console.log("Setting up paddle movement listeners ended");
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearInterval(moveInterval);
    };
  }, [socket, waiting]);

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
      // console.log("Drawing frame");
      if (!canvasRef.current) return;
      draw();
      if (!winnerRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    };
    
    // Cancel any existing animation frame before starting new loop
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    loop();
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

  }, [state, winner]);

  const resetGame = () => {
    setWaitingForRestart(true)
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
            {yourProfile && opponentProfile && (
              <>
                <img 
                  src={playerPositionRef.current === "left" ? yourProfile.avatar : opponentProfile.avatar} 
                  alt={playerPositionRef.current === "left" ? yourProfile.name : opponentProfile.name} 
                  className="h-10 rounded-full border-2 border-[#50614d80]-500"
                />
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
            {yourProfile && opponentProfile && (
              <img 
                src={playerPositionRef.current === "right" ? yourProfile.avatar : opponentProfile.avatar} 
                alt={playerPositionRef.current === "right" ? yourProfile.name : opponentProfile.name} 
                className="h-10 rounded-full border-2 border-[#50614d80]-500" 
              />
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
              {opponentLeftPostGame
                ? "Your opponent left"
                : forfeitWin 
                  ? (user && winner === String(user.id) ? "🏆 You Won by Forfeit!" : "😞 You Lost - Disconnected")
                  : (user && winner === String(user.id) ? "🏆 You Won!" : `😞 You Lost To ${winnerProfile.name}`)
              }
            </h2>
            {forfeitWin && !opponentLeftPostGame && (
              <p className="text-gray-300 text-sm mb-4">Your opponent left the game</p>
            )}
            
            {waitingForRestart ? (
              <div className="flex flex-col items-center gap-3">
                <div className="text-white text-xl font-semibold">
                  Waiting for your opponent...
                </div>
                {/* <div className="text-green-400 text-sm">
                  ✓ You are ready
                </div> */}
              </div>
            ) : (forfeitWin || opponentLeftPostGame) ? (
              <button
                onClick={() => navigate("/game")}
                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
              >
                Return to Menu
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-4">
                  <button
                    onClick={resetGame}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => {
                      // socket?.emit("leavePostGame");
                      socket?.disconnect();
                      navigate("/game");
                    }}
                    className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md"
                  >
                    Return to Menu
                  </button>
                </div>
                {((playerPositionRef.current === "left" && restartReady.right) || 
                  (playerPositionRef.current === "right" && restartReady.left)) && (
                  <div className="text-green-400 text-sm">
                    ✓ Opponent is ready
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
