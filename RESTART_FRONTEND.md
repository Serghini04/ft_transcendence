# Frontend Restart Required

## The Issue
The frontend `.env` file had the wrong port (3004 instead of 3003). This has been fixed.

## How to Restart Frontend

1. **Stop the current frontend process:**
   - Go to the terminal running `npm run dev`
   - Press `Ctrl+C`

2. **Start it again:**
   ```bash
   cd app/frontend
   npm run dev
   ```

3. **Or use Docker if you're running via Docker:**
   ```bash
   docker-compose restart frontend
   ```

## Verify It's Working

After restarting, open your browser console (F12) and check:
- No connection errors
- WebSocket should connect to `ws://localhost:3003/ws`
- API calls should go to `http://localhost:3003/api`

## Quick Test

1. Open browser: http://localhost:5173
2. Navigate to OnlineTicTac component
3. Login with username "Alice"
4. Click "Find Match"
5. Open another browser/tab
6. Login as "Bob"
7. Click "Find Match"
8. Both should match instantly!

## Configuration Summary

✅ Backend running: http://localhost:3003
✅ API endpoints: http://localhost:3003/api/*
✅ WebSocket: ws://localhost:3003/ws
✅ Frontend config: Updated to use port 3003
