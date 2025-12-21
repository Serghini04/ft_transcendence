import { useState, useEffect, useRef } from "react";
import { useLocation , useNavigate } from "react-router-dom";
import { verifyToken } from "../../globalUtils/verifyToken";
import { UseTokenStore, UseUserStore } from "../../userAuth/LoginAndSignup/zustand/useStore";
import user1Img from "../../assets/images/profiles/hidriouc.png";
import aiImg from "../../assets/images/ai.png";
import aiAvatarImg from "../../assets/images/aiAvatar.jpg";

interface Player {
  id: number;
  name: string;
  avatar: string;
}

interface Players {
  first: Player;
  second: Player;
}

class AIPlayer {
  private lastUpdateTime: number = 0;
  private updateInterval: number = 1000; // AI can only "see" once per second in medium mode.
  private predictedBallY: number = 0;
  private predictedBallX: number = 0;
  private targetPosition: number = 0;
  private currentStrategy: "defensive" | "aggressive" | "balanced" = "balanced";
  private difficulty: number = 0.85;
  private reactionDelay: number = 0; // Delay before AI reacts (in ms)

  constructor(difficulty: "easy" | "medium" | "hard" = "medium") {
    // Difficulty settings
    switch (difficulty) {
      case "easy":
        this.difficulty = 0.65;
        this.updateInterval = 1400;
        this.reactionDelay = 800;
        break;
      case "medium":
        this.difficulty = 0.85;
        this.updateInterval = 1000;
        this.reactionDelay = 400;
        break;
      case "hard":
        this.difficulty = 0.95;
        this.updateInterval = 800;
        this.reactionDelay = 200;
        break;
    }
  }

  // Predict the ball position when it will reache the AI's paddle
  private predictBallTrajectory(
    ballX: number,
    ballY: number,
    ballDx: number,
    ballDy: number,
    paddleX: number,
    canvasWidth: number,
    canvasHeight: number,
    isVertical: boolean
  ): { x: number; y: number; bounces: number } {
    let simX = ballX;
    let simY = ballY;
    let simDx = ballDx;
    let simDy = ballDy;
    let bounces = 0;
    const maxIterations = 1000;
    let iterations = 0;

    if (isVertical) {
      while (simY > 0 && iterations < maxIterations) {
        simX += simDx;
        simY += simDy;

        // Bounce off left/right walls
        if (simX <= 0 || simX >= canvasWidth) {
          simDx *= -1;
          bounces++;
        }

        iterations++;
      }
      
      // heigher difficulty => less error
      const error = (1 - this.difficulty) * 100;
      simX += (Math.random() - 0.5) * error;
      
      return { x: Math.max(0, Math.min(canvasWidth, simX)), y: simY, bounces };
    } else {
      while (simX < paddleX && iterations < maxIterations) {
        simX += simDx;
        simY += simDy;

        // Bounce off top/bottom walls
        if (simY <= 0 || simY >= canvasHeight) {
          simDy *= -1;
          bounces++;
        }

        iterations++;
      }

      // heigher difficulty => less error
      const error = (1 - this.difficulty) * 100;
      simY += (Math.random() - 0.5) * error;

      return { x: simX, y: Math.max(0, Math.min(canvasHeight, simY)), bounces };
    }
  }

  // Determine AI strategy based on game state
  private determineStrategy(
    score: number,
    opponentScore: number,
    ballX: number,
    canvasWidth: number
  ): void {
    const scoreDifference = score - opponentScore;
    const ballProximity = ballX / canvasWidth;

    if (scoreDifference < -2) {
      this.currentStrategy = "aggressive";
    } else if (scoreDifference > 2) {
      this.currentStrategy = "defensive";
    } else if (ballProximity > 0.7) {
      this.currentStrategy = "defensive";
    } else {
      this.currentStrategy = "balanced";
    }
  }

  // Update AI's understanding of the game (called once per second)
  update(
    ballX: number,
    ballY: number,
    ballDx: number,
    ballDy: number,
    paddleX: number,
    paddleY: number,
    paddleWidth: number,
    paddleHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    isVertical: boolean,
    aiScore: number,
    playerScore: number,
  ): { shouldMoveLeft: boolean; shouldMoveRight: boolean; shouldMoveUp: boolean; shouldMoveDown: boolean } {
    const currentTime = performance.now();
    
    // Check if AI has had enough time to react (reaction delay)
    if (currentTime - this.lastUpdateTime < this.reactionDelay) {
      // AI hasn't reacted yet - no movement
      return {
        shouldMoveLeft: false,
        shouldMoveRight: false,
        shouldMoveUp: false,
        shouldMoveDown: false,
      };
    }
    
    // AI can only refresh its view once per second
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      // Use previous prediction with some drift
      const drift = (Math.random() - 0.5) * 10;
      if (isVertical) {
        this.targetPosition = this.predictedBallX + drift;
      } else {
        this.targetPosition = this.predictedBallY + drift;
      }
    } else {
      // Update AI's view of the game (time to "see" again)
      this.lastUpdateTime = currentTime;
      
      // Determine strategy
      this.determineStrategy(aiScore, playerScore, ballX, canvasWidth);
      
      // Predict ball trajectory
      const prediction = this.predictBallTrajectory(
        ballX,
        ballY,
        ballDx,
        ballDy,
        paddleX,
        canvasWidth,
        canvasHeight,
        isVertical
      );

      if (isVertical) {
        this.predictedBallX = prediction.x;
        this.targetPosition = this.predictedBallX;
      } else {
        this.predictedBallY = prediction.y;
        this.targetPosition = this.predictedBallY;
      }

      // Apply strategy adjustments
      if (this.currentStrategy === "defensive") {
        const center = isVertical ? canvasWidth / 2 : canvasHeight / 2;
        this.targetPosition = this.targetPosition * 0.7 + center * 0.3;
      }
    }

    // Simulate keyboard input based on target position
    if (isVertical) {
      const paddleCenter = paddleX + paddleWidth / 2;
      const distance = this.targetPosition - paddleCenter;
      const threshold = paddleWidth * 0.3; // Dead zone to prevent zigzagging [-27, 27]

      return {
        shouldMoveLeft: distance < -threshold,
        shouldMoveRight: distance > threshold,
        shouldMoveUp: false,
        shouldMoveDown: false,
      };
    } else {
      const paddleCenter = paddleY + paddleHeight / 2;
      const distance = this.targetPosition - paddleCenter;
      const threshold = paddleHeight * 0.3; // Dead zone to prevent zigzagging [-27, 27]

      return {
        shouldMoveLeft: false,
        shouldMoveRight: false,
        shouldMoveUp: distance < -threshold,
        shouldMoveDown: distance > threshold,
      };
    }
  }

  reset(): void {
    this.lastUpdateTime = 0;
    this.currentStrategy = "balanced";
  }
}

export default function Ai() {
  const [players, setPlayers] = useState<Players>({
    first: { id: 0, name: "You", avatar: user1Img },
    second: { id: 1, name: "AI Opponent", avatar: aiImg },
  });
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [winner, setWinner] = useState<"left" | "right" | null>(null);
  const winnerRef = useRef<"left" | "right" | null>(null);
  const [time, setTime] = useState(0);
  const [isVertical, setIsVertical] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<() => void>(() => {});
  const aiPlayerRef = useRef<AIPlayer | null>(null);

  const { token } = UseTokenStore();
  const { user } = UseUserStore();
  const navigate = useNavigate();

  // Game options from navigation state
  const location = useLocation();
  const { map = "Classic", powerUps = false, speed = "Normal", difficulty = "medium" } = location.state || {};

  const gameThemes: Record<string, { background: string; color: string }> = {
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
  const theme = gameThemes[map as string] || gameThemes.Classic;
  const speedMultiplier: Record<string, number> = { Slow: 1, Normal: 1.8, Fast: 3 };

  const lScoreRef = useRef(0);
  const rScoreRef = useRef(0);

  useEffect(() => {
    // Initialize AI player
    aiPlayerRef.current = new AIPlayer(difficulty as "easy" | "medium" | "hard");

    // Fetch player data (for human player)
    const fetchUserProfile = async () => {
      if (!token || !user) {
        console.error("❌ User not authenticated");
        navigate("/auth");
        return;
      }

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
        const data: Player = {
          id: raw.id,
          name: raw.username,
          avatar: raw.avatarUrl || user1Img,
        };
        
        setPlayers({
          first: data,
          second: { id: 1, name: "AI Opponent", avatar: aiAvatarImg },
        });
        console.log("Fetched user profile:", data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    fetchUserProfile();
  }, [difficulty, user?.id, token]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!winnerRef.current) setTime((prev: number) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsVertical(window.innerWidth < 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    winnerRef.current = winner;
    
    // Restart game loop when winner is cleared (after reset)
    if (winner === null && loopRef.current) {
      loopRef.current();
    }
  }, [winner]);

  const resetGame = () => {
    // Reset all score tracking
    lScoreRef.current = 0;
    rScoreRef.current = 0;
    setLeftScore(0);
    setRightScore(0);
    
    // Reset winner state
    setWinner(null);
    winnerRef.current = null;
    
    // Reset time
    setTime(0);

    // Reset AI
    if (aiPlayerRef.current) {
      aiPlayerRef.current.reset();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = isVertical ? 0.6 : 1;
    const width = canvas.width;
    const height = canvas.height;

    const ballRef = {
      current: {
        x: width / 2,
        y: height / 2,
        dx: 4 * scale * speedMultiplier[speed as string],
        dy: 3 * scale * speedMultiplier[speed as string],
        size: 8 * scale,
        visible: true,
      },
    };

    const paddle1Ref = {
      current: {
        x: 0,
        y: height / 2 - 45 * scale,
        width: 10 * scale,
        height: 90 * scale,
        speed: 6 * scale,
      },
    };

    const paddle2Ref = {
      current: {
        x: width - 10 * scale,
        y: height / 2 - 45 * scale,
        width: 10 * scale,
        height: 90 * scale,
        speed: 6 * scale,
      },
    };

    const powerUpRef = {
      current: {
        x: width / 2 - 20 * scale,
        y: height / 2 - 40 * scale,
        width: 12 * scale,
        height: 150 * scale,
        visible: false,
      },
    };

    if (isVertical) {
      paddle1Ref.current.x = width / 2 - 45 * scale;
      paddle1Ref.current.y = height - 10 * scale;
      paddle1Ref.current.width = 90 * scale;
      paddle1Ref.current.height = 10 * scale;

      paddle2Ref.current.x = width / 2 - 45 * scale;
      paddle2Ref.current.y = 0;
      paddle2Ref.current.width = 90 * scale;
      paddle2Ref.current.height = 10 * scale;

      ballRef.current.dx = 3 * scale * speedMultiplier[speed as string];
      ballRef.current.dy = 4 * scale * speedMultiplier[speed as string];

      powerUpRef.current.width = 150 * scale;
      powerUpRef.current.height = 12 * scale;
    }

    const startRef = { current: false };
    const rafIdRef = { current: 0 as number | null };
    const scoredRef = { current: false };

    const keysPressed: Record<string, boolean> = {};

    // Simulated AI key presses
    const aiKeysPressed: Record<string, boolean> = {
      arrowup: false,
      arrowdown: false,
      arrowleft: false,
      arrowright: false,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let lastPowerUpTime = performance.now();
    const powerUpDuration = 5000;
    const powerUpInterval = 5000;

    const spawnPowerUp = () => {
      powerUpRef.current.x = width / 2 + (Math.random() * 100 - 100);
      powerUpRef.current.y = height / 2 + (Math.random() * 100 - 100);
      powerUpRef.current.visible = true;

      setTimeout(() => {
        powerUpRef.current.visible = false;
      }, powerUpDuration);
    };

    const resetBall = (direction: number) => {
      const ball = ballRef.current;
      ball.visible = false;

      setTimeout(() => {
        ball.x = width / 2;
        ball.y = height / 2;
        ball.dx = 3 * direction * scale * speedMultiplier[speed as string];
        ball.dy = 3 * scale * speedMultiplier[speed as string];
        ball.visible = true;
        scoredRef.current = false;
        if (isVertical) {
          ball.dy = 3 * direction * scale * speedMultiplier[speed as string];
          ball.dx = 3 * scale * speedMultiplier[speed as string];
        }
      }, 1000);
    };

    const draw = () => {
      const ball = ballRef.current;
      const leftPaddle = paddle1Ref.current;
      const rightPaddle = paddle2Ref.current;

      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, width, height);

      // Center dashed line
      if (isVertical) {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.setLineDash([20]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.setLineDash([20]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
      }

      // Ball
      ctx.fillStyle = theme.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      ctx.fillStyle = theme.color;
      ctx.beginPath();
      ctx.roundRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, 8);
      ctx.fill();

      // Draw power-up
      if (powerUps && powerUpRef.current.visible) {
        ctx.save();
        const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);
        ctx.globalAlpha = pulse;
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = theme.color;
        const hueShift = (Date.now() / 15) % 360;
        ctx.fillStyle = `hsl(${hueShift}, 80%, 60%)`;
        ctx.beginPath();
        ctx.roundRect(
          powerUpRef.current.x,
          powerUpRef.current.y,
          powerUpRef.current.width,
          powerUpRef.current.height,
          6
        );
        ctx.fill();
        ctx.restore();
      }
    };

    const update = () => {
      const ball = ballRef.current;
      const leftPaddle = paddle1Ref.current;
      const rightPaddle = paddle2Ref.current;

      if (!ball.visible) return;

      // Update AI decision making (simulates keyboard input)
      if (aiPlayerRef.current) {
        const aiDecision = aiPlayerRef.current.update(
          ball.x,
          ball.y,
          ball.dx,
          ball.dy,
          rightPaddle.x,
          rightPaddle.y,
          rightPaddle.width,
          rightPaddle.height,
          width,
          height,
          isVertical,
          rScoreRef.current,
          lScoreRef.current
        );

        // Simulate keyboard input for AI
        aiKeysPressed.arrowup = aiDecision.shouldMoveUp;
        aiKeysPressed.arrowdown = aiDecision.shouldMoveDown;
        aiKeysPressed.arrowleft = aiDecision.shouldMoveLeft;
        aiKeysPressed.arrowright = aiDecision.shouldMoveRight;
      }

      if (isVertical) {
        // Human player controls (bottom paddle)
        if (keysPressed["arrowleft"]) leftPaddle.x -= leftPaddle.speed;
        if (keysPressed["arrowright"]) leftPaddle.x += leftPaddle.speed;

        // AI controls (top paddle)
        if (aiKeysPressed.arrowleft) rightPaddle.x -= rightPaddle.speed;
        if (aiKeysPressed.arrowright) rightPaddle.x += rightPaddle.speed;

        leftPaddle.x = Math.max(0, Math.min(width - leftPaddle.width, leftPaddle.x));
        rightPaddle.x = Math.max(0, Math.min(width - rightPaddle.width, rightPaddle.x));
      } else {
        // Human player controls (left paddle)
        if (keysPressed["arrowup"]) leftPaddle.y -= leftPaddle.speed;
        if (keysPressed["arrowdown"]) leftPaddle.y += leftPaddle.speed;

        // AI controls (right paddle)
        if (aiKeysPressed.arrowup) rightPaddle.y -= rightPaddle.speed;
        if (aiKeysPressed.arrowdown) rightPaddle.y += rightPaddle.speed;

        leftPaddle.y = Math.max(0, Math.min(height - leftPaddle.height, leftPaddle.y));
        rightPaddle.y = Math.max(0, Math.min(height - rightPaddle.height, rightPaddle.y));
      }

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (isVertical) {
        // Bounce off left/right
        if (ball.x - ball.size < 0 || ball.x + ball.size > width) {
          ball.dx *= -1;
        }

        // Paddle collisions
        if (
          ball.y + ball.size > leftPaddle.y &&
          ball.x > leftPaddle.x &&
          ball.x < leftPaddle.x + leftPaddle.width
        ) {
          ball.dy *= -1;
          ball.y = leftPaddle.y - ball.size;
        }

        if (
          ball.y - ball.size < rightPaddle.y + rightPaddle.height &&
          ball.x > rightPaddle.x &&
          ball.x < rightPaddle.x + rightPaddle.width
        ) {
          ball.dy *= -1;
          ball.y = rightPaddle.y + rightPaddle.height + ball.size;
        }
      } else {
        // Bounce off top/bottom
        if (ball.y - ball.size < 0 || ball.y + ball.size > height) {
          ball.dy *= -1;
        }

        // Paddle collisions
        if (
          ball.x - ball.size < leftPaddle.x + leftPaddle.width &&
          ball.y > leftPaddle.y &&
          ball.y < leftPaddle.y + leftPaddle.height
        ) {
          ball.dx *= -1;
          ball.x = leftPaddle.x + leftPaddle.width + ball.size;
        }

        if (
          ball.x + ball.size > rightPaddle.x &&
          ball.y > rightPaddle.y &&
          ball.y < rightPaddle.y + rightPaddle.height
        ) {
          ball.dx *= -1;
          ball.x = rightPaddle.x - ball.size;
        }
      }

      // Power-up appearance timing
      const now = performance.now();
      if (now - lastPowerUpTime >= powerUpInterval + powerUpDuration) {
        spawnPowerUp();
        lastPowerUpTime = now;
      }

      // Collision with power-up
      if (powerUps && powerUpRef.current.visible) {
        const p = powerUpRef.current;
        if (
          ball.x + ball.size > p.x &&
          ball.x - ball.size < p.x + p.width &&
          ball.y + ball.size > p.y &&
          ball.y - ball.size < p.y + p.height
        ) {
          if (isVertical) ball.dy *= -1;
          else ball.dx *= -1;

          ball.x += ball.dx * 0.5;
          ball.y += ball.dy * 0.5;

          powerUpRef.current.visible = false;
        }
      }

      // Scoring
      if (!scoredRef.current && (ball.x + ball.size < 0 || (isVertical && ball.y - ball.size > height))) {
        ball.visible = false;
        scoredRef.current = true;
        rScoreRef.current += 1;
        setRightScore(rScoreRef.current);
        if (rScoreRef.current >= 5) setWinner("right");
        resetBall(1);
        return;
      }

      if (!scoredRef.current && (ball.x - ball.size > width || (isVertical && ball.y + ball.size < 0))) {
        ball.visible = false;
        scoredRef.current = true;
        lScoreRef.current += 1;
        setLeftScore(lScoreRef.current);
        if (lScoreRef.current >= 5) setWinner("left");
        resetBall(-1);
        return;
      }
    };

    const loop = () => {
      if (winnerRef.current) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        return;
      }
      update();
      draw();
      rafIdRef.current = requestAnimationFrame(loop);
    };

    loopRef.current = loop;

    if (!startRef.current) {
      startRef.current = true;
      loop();
    }

    return () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isVertical, powerUps, speed, map]);


  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)]">
      {isVertical ? (
        <>
          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className="mb-2 bg-[rgba(217,217,217,0.4)] rounded-md px-4 py-1 text-black font-medium text-sm backdrop-blur-sm">
              ⏱ {formatTime(time)}
            </div>
          </div>

          {/* AI Player Top */}
          <div className="flex flex-col items-center gap-2 text-white">
            <img
              src={players.second.avatar}
              className="h-10 rounded-full border-2 border-[#50614d80]-500"
              alt={players.second.name}
            />
            <span className="text-lg font-semibold">{rightScore}</span>
          </div>

          {/* Game Canvas */}
          <div
            className={`relative w-[90%] max-w-[300px] aspect-[9/16] border border-white/10 rounded-xl ${theme.background} overflow-hidden shadow-xl`}
          >
            <canvas ref={canvasRef} width={300} height={533} className="w-full h-full" />
          </div>

          {/* Winner Overlay */}
          {winner && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-20 p-4">
              <div className="flex flex-col items-center justify-center translate-x-9 sm:translate-x-0">
                <img
                  src={winner === "left" ? players.first.avatar : players.second.avatar}
                  alt="Winner"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-400 shadow-lg mb-3 object-cover"
                />
                <h2 className="text-white text-lg sm:text-2xl font-bold text-center leading-snug">
                  {winner === "left" ? players.first.name : players.second.name} won the game! 🏆
                </h2>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md text-sm"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => navigate("/game")}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md text-sm"
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Human Player Bottom */}
          <div className="flex flex-col items-center gap-2 text-white">
            <span className="text-lg font-semibold">{leftScore}</span>
            <img src={players.first.avatar} className="h-10 rounded-full border-2 border-[#50614d80]-500" alt={players.first.name} />
          </div>
        </>
      ) : (
        <>
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
              {/* Human Player */}
              <div className="flex items-center gap-3 w-20">
                <img src={players.first.avatar} alt={players.first.name} className="h-10 rounded-full border-2 border-[#50614d80]-500" />
                <span className="text-[22px] font-semibold">{leftScore}</span>
              </div>

              {/* Timer */}
              <div
                className="flex flex-col items-center justify-center px-10 py-2 text-black font-medium"
                style={{
                  background: "rgba(217, 217, 217, 0.5)",
                  clipPath: "polygon(0% 0%, 100% 0%, 70% 100%, 30% 100%)",
                  height: "65px",
                  width: "170px",
                }}
              >
                <span className="font-outfit text-[18px] font-medium">Time</span>
                <span className="font-outfit text-[18px] font-medium">{formatTime(time)}</span>
              </div>

              {/* AI Player */}
              <div className="flex items-center gap-3 w-20">
                <span className="text-[22px] font-semibold">{rightScore}</span>
                <div className="relative">
                  <img
                    src={players.second.avatar}
                    alt={players.second.name}
                    className="h-10 rounded-full border-2 border-[#50614d80]-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div
            className={`border border-white/10 rounded-[7px] overflow-hidden shadow-xl ${theme.background} w-full max-w-5xl aspect-[16/9]`}
          >
            <canvas ref={canvasRef} width={1200} height={675} className="w-full h-full" />

            {/* Winner Overlay */}
            {winner && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-tl-4xl z-20 p-6">
                <img
                  src={winner === "left" ? players.first.avatar : players.second.avatar}
                  alt="Winner"
                  className="w-28 h-28 rounded-full border-4 border-yellow-400 shadow-lg mb-4"
                />
                <h2 className="text-white text-2xl sm:text-3xl font-bold text-center">
                  {winner === "left" ? players.first.name : players.second.name} won the game! 🏆
                </h2>
                <div className="flex gap-4 mt-5">
                  <button
                    onClick={resetGame}
                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => navigate("/game")}
                    className="px-5 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-md"
                  >
                    Return to Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
