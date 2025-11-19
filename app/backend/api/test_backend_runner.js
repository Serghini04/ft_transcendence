#!/usr/bin/env node
import { initDatabase, upsertUser, getLeaderboard, saveGameResult, getRecentGames, getUserGames } from './database.js';

function now() {
  return Date.now();
}

function seedAndRun() {
  // Initialize DB (creates file and tables)
  initDatabase();

  console.log('Seeding users...');
  upsertUser({ id: 'user1', name: 'Alice', avatar: 'https://example.com/a.png', level: 5 });
  upsertUser({ id: 'user2', name: 'Bob', avatar: 'https://example.com/b.png', level: 3 });

  console.log('Saving a sample game result...');
  const gameId = `game-${now()}`;
  saveGameResult({
    gameId,
    mode: 'online',
    player1: { id: 'user1', name: 'Alice', avatar: 'https://example.com/a.png', score: 5 },
    player2: { id: 'user2', name: 'Bob', avatar: 'https://example.com/b.png', score: 2 },
    winner: { id: 'user1' },
    createdAt: now()
  });

  console.log('\nLeaderboard:');
  const lb = getLeaderboard(10);
  console.log(lb);

  console.log('\nRecent games:');
  const recent = getRecentGames(10);
  console.log(recent);

  console.log('\nGames for user1:');
  const games = getUserGames('user1', 10);
  console.log(games);

  console.log('\nGames for user2:');
  const games2 = getUserGames('user2', 10);
  console.log(games2);

  console.log('\nLeaderboard:');
  const lb2 = getLeaderboard(10);
  console.log(lb2);
}

seedAndRun();
