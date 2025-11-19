#!/usr/bin/env node
import { io } from 'socket.io-client';
import jwt from 'jsonwebtoken';

const SERVER = process.env.SERVER_URL || 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function makeToken(id) {
  return jwt.sign({ sub: id, id }, JWT_SECRET, { expiresIn: '1h' });
}

function makeClient(id, token) {
  const socket = io(SERVER, { transports: ['websocket'], reconnectionDelayMax: 10000 });
  socket.on('connect', () => {
    console.log(`${id} connected (${socket.id})`);
    socket.emit('joinGame', { token, options: { map: 'Classic', powerUps: false, speed: 'Normal' } });
  });

  socket.on('waiting', () => console.log(`${id} waiting for opponent`));

  socket.on('start', (payload) => {
    console.log(`${id} start:`, payload.side, 'you=', payload.you?.name, 'op=', payload.opponent?.name);
    // Start sending random moves to keep game active
    socket._moveInterval = setInterval(() => {
      const dir = Math.random() > 0.5 ? 1 : -1;
      socket.emit('move', { direction: dir });
    }, 120);
  });

  socket.on('state', (state) => {
    // silent
  });

  socket.on('gameOver', (data) => {
    console.log(`${id} gameOver: winner=${data.winner}`);
    console.log('winnerProfile:', data.winnerProfile?.name);
    if (socket._moveInterval) clearInterval(socket._moveInterval);
    socket.disconnect();
  });

  socket.on('disconnect', () => console.log(`${id} disconnected`));
  socket.on('unauthorized', (m) => {
    console.error(`${id} unauthorized:`, m);
    socket.disconnect();
  });

  return socket;
}

async function run() {
  const token1 = makeToken('test_user_1');
  const token2 = makeToken('test_user_2');

  console.log('Starting two test clients connecting to', SERVER);
  const c1 = makeClient('test_user_1', token1);
  // small delay to simulate realistic pairing
  setTimeout(() => makeClient('test_user_2', token2), 300);
}

run();
