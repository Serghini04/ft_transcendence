# 🎮 TicTacToe Online - Play with Friends

## Your Connection Details

**Your Local IP:** `10.30.250.174`

---

## For Your Friend to Connect:

### Step 1: Make sure you're on the same network (WiFi/LAN)

### Step 2: Share these URLs with your friend:

**Frontend URL:**
```
http://10.30.250.174:5173
```

**Alternative Frontend (if using port 8888):**
```
http://10.30.250.174:8888
```

---

## How to Play Together:

### On Your Computer (Host):
1. Open browser: `http://localhost:5173`
2. Navigate to TicTacToe → Online Multiplayer
3. Login with your username (e.g., "Player1")
4. Click "Find Match"
5. Wait for your friend...

### On Your Friend's Computer:
1. Open browser: `http://10.30.250.174:5173`
2. Navigate to TicTacToe → Online Multiplayer
3. Login with their username (e.g., "Player2")
4. Click "Find Match"
5. You'll be matched automatically! 🎉

---

## Backend Connection Info:

- **API Endpoint:** `http://10.30.250.174:3003/api`
- **WebSocket:** `ws://10.30.250.174:3003/ws`
- **Health Check:** `http://10.30.250.174:3003/health`

---

## Troubleshooting:

### Friend can't connect?

1. **Check Firewall:**
   ```bash
   # Allow port 5173 (frontend)
   # Allow port 3003 (backend)
   ```

2. **Test Backend Connection:**
   ```bash
   curl http://10.30.250.174:3003/health
   ```
   Should return: `{"status":"ok",...}`

3. **Same Network?**
   - Both must be on the same WiFi/LAN network
   - Check your friend's network settings

4. **Frontend Running?**
   ```bash
   cd app/frontend
   npm run dev -- --host
   ```
   The `--host` flag makes it accessible from network

---

## If Using Port 8888 (Production Frontend):

Make sure your frontend is exposed on `0.0.0.0:8888` in docker-compose.

---

## Quick Test:

### From Your Friend's Computer:
```bash
# Test if they can reach your backend
curl http://10.30.250.174:3003/health

# Test if they can reach your frontend
curl http://10.30.250.174:5173
```

---

## Security Note:

⚠️ This setup is for LOCAL NETWORK ONLY (same WiFi/LAN).
- Do NOT expose these ports to the internet without proper security
- For internet play, you need proper firewall, reverse proxy, and SSL

---

## Network Configuration Applied:

✅ CORS updated to allow: `http://10.30.250.174:5173`
✅ Backend listening on: `0.0.0.0:3003`
✅ Frontend should use: `--host` flag

---

## Start Your Frontend with Network Access:

```bash
cd app/frontend
npm run dev -- --host 0.0.0.0
```

Or update `vite.config.ts`:
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Allow network access
    port: 5173
  }
})
```

---

## Summary for Your Friend:

**Just give them this URL:**
```
http://10.30.250.174:5173
```

Both of you click "Find Match" at the same time, and you'll be matched! 🎮
