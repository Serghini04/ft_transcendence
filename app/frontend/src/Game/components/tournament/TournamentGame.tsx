import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { UseTokenStore, UseUserStore } from "../../../userAuth/zustand/useStore";
import verifyToken from "../../../globalUtils/verifyToken";

interface GameState {
  canvas: { width: number, height: number };
  ball: { x: number; y: number, radius: number, vx: number, vy: number, speed: number, visible: boolean };
  paddles: { left: { x: number; y: number; width: number; height: number; speed: number }, right: { x: number; y: number; width: number; height: number; speed: number } };
  scores: { left: number; right: number };
  powerUp: { found: boolean; x: number; y: number; width: number; height: number; visible: boolean; duration: number; spawnTime: number | null };
  winner?: null;
}

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export default function TournamentGame() {
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
  const [winner, setWinner] = useState<string | null>(null);
  const [time, setTime] = useState(0);
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
  const { tournamentId, matchId, opponentId, map = "Classic", powerUps = false, speed = "Normal" } = location.state || {};

  type MapType = "Classic" | "Desert" | "Chemistry";
  const typedMap = ["Classic", "Desert", "Chemistry"].includes(map) ? map as MapType : "Classic";

  const gameThemes: Record<MapType, { background: string; color: string }> = {
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

  const theme = gameThemes[typedMap];

  // Connect to Socket.IO for tournament match
  useEffect(() => {
    const init = async () => {
      if (!token || !user) {
        console.error("❌ User not authenticated");
        navigate("/auth");
        return;
      }

      if (!tournamentId || !matchId || !opponentId) {
        console.error("❌ Missing tournament context");
        navigate("/game");
        return;
      }

      // Check if this match is already complete (user reloading on result screen)
      try {
        const response = await fetch(`http://localhost:8080/api/v1/game/tournaments/${tournamentId}/bracket`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const bracketData = await response.json();
          const match = bracketData.data.matches.find((m: any) => m.id === parseInt(matchId));
          
          if (match?.winner_id) {
            console.log(`🔄 Match ${matchId} already complete (winner: ${match.winner_id}), redirecting to bracket`);
            
            // Store tournament ID in localStorage so the Tournament component shows the bracket
            localStorage.setItem('currentTournamentId', tournamentId);
            
            // Navigate to tournament page (which will show the bracket)
            navigate('/game/tournament');
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check match status:", err);
        // Continue anyway - let the game socket handle it
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
        
        const data: UserProfile = {
          id: raw.id,
          name: raw.username,
          avatar: raw.avatarUrl,
        };
        
        setYourProfile(data);
        yourProfileRef.current = data;
        console.log("🏆 Tournament Game - Your profile:", data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        // Use fallback profile data - don't block the game from starting!
        const fallbackData: UserProfile = {
          id: user.id.toString(),
          name: user.name || 'Player',
          avatar: ''
        };
        setYourProfile(fallbackData);
        yourProfileRef.current = fallbackData;
        console.log("🏆 Using fallback profile:", fallbackData);
      }
      
      // Connect to game namespace
      const s = io("http://localhost:8080/game", {
        path: "/socket.io",
        transports: ["websocket"],
        auth: { token, userId: user.id },
        extraHeaders: { Authorization: `Bearer ${token}` },
      });
      setSocket(s);
      socketRef.current = s;
      
      
      s.on("connect", () => console.log("🔗 Connected:", s.id));
      s.on("waiting", () => setWaiting(true));

      // Handle rejoining after forfeit (user reloaded during match)
      s.on("rejoinAfterForfeit", ({ winnerId, loserId, reason }: { winnerId: string, loserId: string, reason: string }) => {
        console.log("⚠️ Rejoined tournament match after forfeit - showing game result");
        
        const currentYourProfile = yourProfileRef.current;
        
        // Set game as over with forfeit
        setWinner(winnerId);
        winnerRef.current = winnerId;
        setForfeitWin(true);
        setWaiting(false);
        
        // Set winner profile (you lost, so winner is opponent)
        if (currentYourProfile) {
          setWinnerProfile({
            id: winnerId,
            name: "Opponent",
            avatar: ""
          });
        }
        
        console.log("📺 Showing tournament forfeit result screen");
      });

      s.on("start", async ({ opponentId, yourId, position }: { opponentId: string, yourId: string, position: "left" | "right" }) => {
        console.log("🚀 Tournament match started - Position:", position);
        playerPositionRef.current = position;
        
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
          console.log("🏆 Opponent profile:", opponentData);
        } catch (err) {
          console.error("Failed to fetch opponent profile:", err);
          // Use fallback opponent data
          const fallbackOpponent: UserProfile = {
            id: opponentId,
            name: 'Opponent',
            avatar: ''
          };
          setOpponentProfile(fallbackOpponent);
          opponentProfileRef.current = fallbackOpponent;
          console.log("🏆 Using fallback opponent profile:", fallbackOpponent);
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
        
        console.log("🏁 Tournament Match Over! Winner:", winnerId === currentYourProfile?.id ? currentYourProfile : currentOpponentProfile);

        setWinner(winnerId);
        winnerRef.current = winnerId;
        
        if (currentYourProfile && currentOpponentProfile) {
          if (winnerId === currentYourProfile.id) {
            setWinnerProfile(currentYourProfile);
            console.log("🏆 You won the tournament match!");
          } else {
            setWinnerProfile(currentOpponentProfile);
            console.log("😞 You lost to", currentOpponentProfile.name);
          }
        }

        // TODO: Send match result to backend
        // This should update tournament_matches table with winner_id and scores
      });

      s.on("opponentDisconnected", ({ winnerId, gameActive }: { winnerId: string, reason: string, gameActive: boolean }) => {
        console.log("⚠️ Opponent disconnected from tournament match", { gameActive, winnerId });
        
        // If game is already over (not active), ignore the disconnect event
        // The winner is already set, and we don't need to show "opponent left" message
        if (!gameActive) {
          console.log("ℹ️ Ignoring disconnect - game already finished");
          return;
        }
        
        // Game was active - opponent forfeited
        const currentYourProfile = yourProfileRef.current;
        
        console.log("🎯 Handling active disconnect:", {
          winnerId,
          currentYourProfile,
          match: winnerId === currentYourProfile?.id
        });
        
        setWinner(winnerId);
        winnerRef.current = winnerId;
        setForfeitWin(true);
        setWaiting(false); // Hide "waiting" overlay to show winner screen
        
        // Set winner profile (should be current user since opponent disconnected)
        if (currentYourProfile && winnerId === currentYourProfile.id) {
          setWinnerProfile(currentYourProfile);
          console.log("🏆 You won by opponent disconnect! Profile set:", currentYourProfile);
        } else {
          console.log("⚠️ Winner profile NOT set:", {
            hasProfile: !!currentYourProfile,
            winnerId,
            profileId: currentYourProfile?.id
          });
        }
      });

      s.on("opponentForfeited", ({ winnerId, message }: { winnerId: string, message: string, matchId: string, tournamentId: string }) => {
        console.log("🏳️ Opponent forfeited tournament match", { winnerId, message });
        
        setWinner(winnerId);
        winnerRef.current = winnerId;
        setForfeitWin(true);
        setWaiting(false);
      });
  
      s.on("disconnect", () => console.log("❌ Disconnected"));
      
      s.emit("joinTournamentMatch", { 
        tournamentId, 
        matchId, 
        userId: user.id, 
        opponentId,
        options: { map, powerUps, speed, mode: 'tournament' } 
      });
      console.log("🏆 Joining tournament match:", { tournamentId, matchId, opponentId });
    };
  
    init();
  
    return () => {
      console.log("🧹 Cleaning up tournament game socket");
      socketRef.current?.disconnect();
    };
  }, [token, user, tournamentId, matchId, opponentId, navigate]);

  // Poll match status while waiting - to detect if opponent forfeited from bracket
  useEffect(() => {
    if (!waiting || !matchId || !tournamentId) return;

    const checkMatchStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/game/tournaments/${tournamentId}/bracket`, {
          method: 'GET',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();
        const match = data.data.matches.find((m: any) => m.id === parseInt(matchId));
        
        if (match && match.winner_id) {
          console.log('🏳️ Match has winner while waiting - opponent forfeited from bracket!', match);
          
          const currentYourProfile = yourProfileRef.current;
          
          setWinner(match.winner_id);
          winnerRef.current = match.winner_id;
          setForfeitWin(true);
          setWaiting(false);
          
          // Set winner profile
          if (currentYourProfile && match.winner_id === currentYourProfile.id) {
            setWinnerProfile(currentYourProfile);
            console.log('🏆 You won by forfeit (detected via polling)!');
          }
        }
      } catch (err) {
        console.error('Failed to check match status:', err);
      }
    };

    // Check immediately and then every 2 seconds
    checkMatchStatus();
    const interval = setInterval(checkMatchStatus, 2000);

    return () => clearInterval(interval);
  }, [waiting, matchId, tournamentId, token]);

  // Timer
  useEffect(() => {
    if (!waiting && !winner) {
      const interval = setInterval(() => setTime((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [waiting, winner]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
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
      if (state.ball.visible) {
        ctx.fillStyle = theme.color;
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      }

      // Draw paddles with rounded corners
      ctx.fillStyle = theme.color;
      ctx.beginPath();
      ctx.roundRect(state.paddles.left.x, state.paddles.left.y, state.paddles.left.width, state.paddles.left.height, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(state.paddles.right.x, state.paddles.right.y, state.paddles.right.width, state.paddles.right.height, 8);
      ctx.fill();

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, theme]);

  // Handle paddle movement - continuous movement while key is held
  useEffect(() => {
    if (!socket || waiting) return;

    const keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "w" || e.key === "s") {
        keysPressed[e.key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "w" || e.key === "s") {
        keysPressed[e.key] = false;
      }
    };

    // Send movement updates continuously while keys are held (16ms = ~60fps)
    const moveInterval = setInterval(() => {
      if (keysPressed["ArrowUp"] || keysPressed["w"]) {
        socket.emit("move", { direction: -1 });
      } else if (keysPressed["ArrowDown"] || keysPressed["s"]) {
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
  }, [socket, waiting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const backToBracket = () => {
    console.log("🔙 Navigating back to bracket with tournamentId:", tournamentId);
    socket?.disconnect();
    navigate("/game/tournament", { state: { openTournamentId: tournamentId } });
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
                  src={`${(playerPositionRef.current === "left" ? yourProfile.avatar : opponentProfile.avatar).startsWith('http') ? (playerPositionRef.current === "left" ? yourProfile.avatar : opponentProfile.avatar) : `${window.location.origin}/${playerPositionRef.current === "left" ? yourProfile.avatar : opponentProfile.avatar}`}`} 
                  alt={playerPositionRef.current === "left" ? yourProfile.name : opponentProfile.name} 
                  className="h-10 w-10 rounded-full border-2 border-teal-500"
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
                src={`${(playerPositionRef.current === "right" ? yourProfile.avatar : opponentProfile.avatar).startsWith('http') ? (playerPositionRef.current === "right" ? yourProfile.avatar : opponentProfile.avatar) : `${window.location.origin}/${playerPositionRef.current === "right" ? yourProfile.avatar : opponentProfile.avatar}`}`} 
                alt={playerPositionRef.current === "right" ? yourProfile.name : opponentProfile.name} 
                className="h-10 w-10 rounded-full border-2 border-teal-500" 
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

        {/* Winner Overlay - Tournament version (no Play Again) */}
        {winner && winnerProfile && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 rounded-tl-4xl">
            <img
              src={`${winnerProfile.avatar.startsWith('http') ? winnerProfile.avatar : `${window.location.origin}/${winnerProfile.avatar}`}`}
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
            {forfeitWin && !opponentLeftPostGame && user && winner === String(user.id) && (
              <p className="text-gray-300 text-sm mb-4">Your opponent left the game</p>
            )}
            
            <button
              onClick={backToBracket}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition-colors"
            >
              Back to Bracket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
