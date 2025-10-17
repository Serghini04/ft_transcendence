import { useState, useEffect, useRef } from "react";
import { User } from "lucide-react"; // you can replace with avatar images

export default function Local() {
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [time, setTime] = useState(0); // seconds = 2:08
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simple countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    let ball = { x: width / 2, y: height / 2, dx: 4, dy: 3, size: 8, visible: true};
    let leftPaddle = { x: 0, y: height / 2 - 45, width: 10, height: 90, speed: 6 };
    let rightPaddle = { x: width - 10, y: height / 2 - 45, width: 10, height: 90, speed: 6 };

    let gameOver = false;
    let lScore = 0;
    let rScore = 0;

    const keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLocaleLowerCase()] = true;
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.key.toLocaleLowerCase()] = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const resetBall = (direction : number) => {
      ball.visible = false;
      setTimeout(() => {
        ball.x = width / 2;
        ball.y = height / 2;
        ball.dx = 3 * direction;
        ball.dy = 3;
        ball.visible = true;
      }, 1000);
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, width, height);

      // Center dashed line
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.setLineDash([20]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      // Ball
      ctx.fillStyle = "#8ADDD4";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
      ctx.fill();

      // Paddles
      ctx.fillStyle = "#8ADDD4";
      ctx.beginPath();
      ctx.roundRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, 8);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, 8);
      ctx.fill();

    };

    const update = () => {
      if (gameOver || !ball.visible) return;

      if (keysPressed["w"]) leftPaddle.y -= leftPaddle.speed;
      if (keysPressed["s"]) leftPaddle.y += leftPaddle.speed;
      if (keysPressed["arrowup"]) rightPaddle.y -= rightPaddle.speed;
      if (keysPressed["arrowdown"]) rightPaddle.y += rightPaddle.speed;

      // ******** mathmin(???) ***************************&&&&&&&*****&*&*&**&&*&****
      // Prevent paddles from going outside canvas
      leftPaddle.y = Math.max(0, Math.min(height - leftPaddle.height, leftPaddle.y));
      rightPaddle.y = Math.max(0, Math.min(height - rightPaddle.height, rightPaddle.y));

      ball.x += ball.dx;
      ball.y += ball.dy;

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

      // Scoring
      if (ball.x + ball.size < 0) {
        rScore++;
        setRightScore(rScore);
        
        // if (rightScore === 5) {
        //   gameOver = true;
        //   alert("🏆 Left Player Wins!");
        // }
      }

      if (ball.x - ball.size > width) {
        lScore++;
        setLeftScore(lScore);
        // if (leftScore === 5) {
        //   gameOver = true;
        //   alert("🏆 Left Player Wins!");
        // }
      }
    };

    const loop = () => {
      update();
      draw();
      requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keydown", handleKeyUp);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-5rem)]">
      {/* Scoreboard */}
      <div className="flex items-center justify-between w-full max-w-4xl px-6 py-3 bg-[rgba(13,34,52,0.55)] rounded-t-xl backdrop-blur-md border border-white/10 shadow-lg">
        {/* Left Player */}
        <div className="flex items-center space-x-2">
          <User className="text-[#12C0AD] h-6 w-6" />
          <span className="text-white font-semibold text-lg">{leftScore}</span>
        </div>

        {/* Time */}
        <div className="px-6 py-1 bg-[rgba(255,255,255,0.1)] rounded-md text-white/90 font-medium text-sm">
          Time {formatTime(time)}
        </div>

        {/* Right Player */}
        <div className="flex items-center space-x-2">
          <span className="text-white font-semibold text-lg">{rightScore}</span>
          <User className="text-[#12C0AD] h-6 w-6" />
        </div>
      </div>

      {/* Game Canvas */}
      <div className="w-full max-w-4xl aspect-[16/9] bg-[rgba(0,0,0,0.75)] border border-white/10 rounded-b-xl overflow-hidden shadow-xl">
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
