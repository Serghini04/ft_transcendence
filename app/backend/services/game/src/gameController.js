
import { saveGameResult } from './db/database.js';


const speedMap = { Slow: 0.8, Normal: 1.3, Fast: 2.5 };

function initGameState(powerUps, speed) {
  return {
    canvas: {
      width: 1200,
      height: 675,
    },
    ball: {
      x: 600,
      y: 337.5,
      radius: 8,
      vx: 4,
      vy: 3,
      speed: speed,
      visible: true,
    },
    paddles: {
      left: {
        x: 0,
        y: 337.5 - 45,
        width: 10,
        height: 90,
        speed: 6 * speed,
      },
      right: {
        x: 1200 - 10,
        y: 337.5 - 45,
        width: 10,
        height: 90,
        speed: 6 * speed,
      },
    },
    scores: {
      left: 0,
      right: 0,
    },
    powerUp: {
      found: powerUps,
      x: 350,
      y: 200,
      width: 12,
      height: 150,
      visible: false,
      duration: 4000,
      spawnTime: null,
    },
    winner : null,
  };
}

async function createRoom(p1, p2, configKey, options) {
	const id = Date.now().toString();
	const state = initGameState(options.powerUps, speedMap[options.speed]);
	
	// Fetch user profiles

	// get users prfile
	const [player1Profile, player2Profile] = await Promise.all([
	  getUserProfile(p1.data.userId),
	  getUserProfile(p2.data.userId)
	]);
	
	rooms.set(id, { 
	  players: [p1, p2], 
	  state, 
	  configKey,
	  options,
	  startTime: Date.now(),
	  playerProfiles: {
		left: player1Profile,
		right: player2Profile
	  },
	  restartReady: { left: false, right: false } // Track who's ready to restart
	});
  
	p1.join(id);
	p2.join(id);
  
	p1.data.side = "left";
	p2.data.side = "right";
	p1.data.roomId = id;
	p2.data.roomId = id;
  
	// Send game start with player profiles
	p1.emit("start", { 
	  side: "left", 
	  roomId: id,
	  opponent: player2Profile,
	  you: player1Profile
	});
	p2.emit("start", { 
	  side: "right", 
	  roomId: id,
	  opponent: player1Profile,
	  you: player2Profile
	});
  
	console.log(`✅ Room ${id} created for config ${configKey}`);
	console.log(`   ↳ ${player1Profile.name} (left) vs ${player2Profile.name} (right)`);
}

function resetBall(state) {
	const { ball } = state;
	ball.x = state.canvas.width / 2;
	ball.y = state.canvas.height / 2;
	ball.vx = 4 * (Math.random() > 0.5 ? 1 : -1);
	ball.vy = 3 * (Math.random() > 0.5 ? 1 : -1);
}

function updateGame(roomId, rooms, io) {
	const room = rooms.get(roomId);
	if (!room || room.state.winner) return;
	const { ball, paddles, scores, powerUp } = room.state;
  
	// Move ball
	ball.x += ball.vx * ball.speed;
	ball.y += ball.vy * ball.speed;
  
	
	// Collision: left paddle
	const left = paddles.left;
	if (
	  ball.x - ball.radius <= left.x + left.width &&
	  ball.y >= left.y &&
	  ball.y <= left.y + left.height
	)
	{
	  ball.vx = Math.abs(ball.vx); // Force ball to move RIGHT
	  ball.x = left.x + left.width + ball.radius; // prevent sticking
	  // ball effect I will think about it later
	  // const intersect = (ball.y - (left.y + left.height / 2)) / (left.height / 2);
	  // ball.vy = intersect * 3; // adjust bounce angle
	}
	
	// Collision: right paddle
	const right = paddles.right;
	if (
	  ball.x + ball.radius >= right.x &&
	  ball.y >= right.y &&
	  ball.y <= right.y + right.height
	)
	{
	  ball.vx = -Math.abs(ball.vx); // Force ball to move LEFT
	  ball.x = right.x - ball.radius; // prevent sticking
	  // ball effect I will think about it later
	  // const intersect = (ball.y - (right.y + right.height / 2)) / (right.height / 2);
	  // ball.vy = intersect * 3; // adjust bounce angle
	}
	// Top/bottom wall collision
	if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= room.state.canvas.height)
	  ball.vy *= -1;
	
	// Scoring logic
	if (ball.x < 0) {
	  scores.right += 1;
	  resetBall(room.state);
	} else if (ball.x > room.state.canvas.width) {
	  scores.left += 1;
	  resetBall(room.state);
	}
  
	// win condition
	if (scores.left >= 5) {
	  room.state.winner = "left";
	  const profiles = room.playerProfiles;
	  
	  // Save game result to database
	  try {
		saveGameResult({
		  gameId: roomId,
		  mode: 'online',
		  player1: {
			id: profiles.left.id,
			name: profiles.left.name,
			avatar: profiles.left.avatar,
			score: scores.left
		  },
		  player2: {
			id: profiles.right.id,
			name: profiles.right.name,
			avatar: profiles.right.avatar,
			score: scores.right
		  },
		  winner: {
			id: profiles.left.id
		  },
		  createdAt: room.startTime,
		});
		console.log(`💾 Game ${roomId} saved - Winner: ${profiles.left.name}`);
	  } catch (error) {
		console.error('❌ Failed to save game result:', error);
	  }
	  
	  io.to(roomId).emit("gameOver", { 
		winner: "left",
		winnerProfile: profiles.left,
		loserProfile: profiles.right,
		scores: { left: scores.left, right: scores.right },
	  });
	} else if (scores.right >= 5) {
	  room.state.winner = "right";
	  const profiles = room.playerProfiles;
	  
	  // Save game result to database
	  try {
		saveGameResult({
		  gameId: roomId,
		  mode: 'online',
		  player1: {
			id: profiles.left.id,
			name: profiles.left.name,
			avatar: profiles.left.avatar,
			score: scores.left
		  },
		  player2: {
			id: profiles.right.id,
			name: profiles.right.name,
			avatar: profiles.right.avatar,
			score: scores.right
		  },
		  winner: {
			id: profiles.right.id,
		  },
		  createdAt: room.startTime,
		});
		console.log(`💾 Game ${roomId} saved - Winner: ${profiles.right.name}`);
	  } catch (error) {
		console.error('❌ Failed to save game result:', error);
	  }
	  
	  io.to(roomId).emit("gameOver", { 
		winner: "right",
		winnerProfile: profiles.right,
		loserProfile: profiles.left,
		scores: { left: scores.left, right: scores.right },
	  });
	}
  
	handlePowerUps(room.state);
	// Emit full state including scores so the client can render them
	io.to(roomId).emit("state", room.state);
  }
  
  function handlePowerUps(state) {
	const { powerUp, ball } = state;
  
	if (!powerUp.found) return;
  
	if (!powerUp.visible) {
	  // Randomly spawn power-up
	  if (powerUp.spawnTime === null || Date.now() - powerUp.spawnTime > 8000) {
		powerUp.x = state.canvas.width / 2 + (Math.random() * 100 - 100);
		powerUp.y = state.canvas.height / 2 + (Math.random() * 100 - 100);
		powerUp.visible = true;
		powerUp.spawnTime = Date.now();
	  }
	}
	else {
	  // Check collision with ball
	  if (
		ball.x + ball.radius >= powerUp.x &&
		ball.x - ball.radius <= powerUp.x + powerUp.width &&
		ball.y + ball.radius >= powerUp.y &&
		ball.y - ball.radius <= powerUp.y + powerUp.height
	  ) {
		// Reflect ball only once by checking direction
		const ballCenterX = ball.x;
		const powerUpCenterX = powerUp.x + powerUp.width / 2;
		
		// Determine which side of the power-up was hit
		if ((ballCenterX < powerUpCenterX && ball.vx > 0) || 
			(ballCenterX > powerUpCenterX && ball.vx < 0)) {
		  ball.vx *= -1;
		}
		
		// affect on y I'll think about it later
		// const intersect = (ball.y - (powerUp.y + powerUp.height / 2)) / (powerUp.height / 2);
		// ball.vy = intersect * 3; // adjust bounce angle
		
		powerUp.visible = false; // Disappear after collision
	  }
	}
	if (powerUp.visible && Date.now() - powerUp.spawnTime > powerUp.duration) {
	  powerUp.visible = false;
	}
  }