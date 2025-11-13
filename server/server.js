import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

// Optional: simple HTTP endpoint for health checks or root
app.get("/", (req, res) => res.send("🐠 Fish server is alive!"));

// Use Node HTTP server with Express
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // allow all origins
});

const players = new Map();

// Bubbles: server-authoritative bubble state
const bubbles = new Map(); // id -> { id, x, y, vy, ownerId, createdAt }
const lastBubbleAt = new Map(); // socketId -> timestamp

function makeBubbleId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const bubbleConfig = {
  tickMs: 50, // 20Hz
  defaultVy: -60, // px per second (upwards)
  ttlMs: 8000, // max lifetime
  perPlayerCooldownMs: 300, // cooldown between bubbles per player
  maxBubbles: 500,
};

// Chat messages: ephemeral storage
const messages = new Map(); // messageId -> { id, senderId, senderNickname, text, timestamp }
const messageConfig = {
  ttlMs: 6000, // messages fade after 6 seconds
};

io.on("connection", (socket) => {

  if (!socket.id) return;

  const position = { x: 100, y: 100 };
  const playerData = { position, nickname: null, character: null , direction: 'right' };
  players.set(socket.id, playerData);

  // Handle player info (nickname and character)
  socket.on("playerInfo", ({ nickname, character }) => {
    if (!socket.id) return;
    const data = players.get(socket.id);
    if (data) {
      data.nickname = nickname;
      data.character = character;
      players.set(socket.id, data);
      
      console.log(`${nickname} joined: ${socket.id}`);
      
      // Broadcast updated player info to others
      socket.broadcast.emit("playerJoined", {
        id: socket.id,
        position: data.position,
        nickname: data.nickname,
        character: data.character,
        direction: data.direction,
      });
    }
  });

  // Send full list of current players
  const playersMap = {};
  for (const [id, data] of players.entries()) {
    playersMap[id] = {
      position: data.position,
      nickname: data.nickname,
      character: data.character,
      direction: data.direction,
    };
  }
  socket.emit("init", playersMap);

  // Handle movement
  socket.on("move", (position, direction) => {
    if (!socket.id) return;
    const data = players.get(socket.id);
    data.position = position;
    data.direction = direction;
    players.set(socket.id, data);
    socket.broadcast.emit("playerMoved", {
      id: socket.id,
      position: data.position,
      direction: data.direction,
    });
  });

  // Handle bubble creation from client (space press)
  socket.on("bubbleCreate", ({ x, y }) => {
    if (!socket.id) return;
    const now = Date.now();
    const last = lastBubbleAt.get(socket.id) || 0;
    if (now - last < bubbleConfig.perPlayerCooldownMs) return; // cooldown
    if (bubbles.size >= bubbleConfig.maxBubbles) return; // global cap

    // Basic per-player live bubble cap (optional): max 20
    let playerCount = 0;
    for (const b of bubbles.values()) if (b.ownerId === socket.id) playerCount++;
    if (playerCount >= 20) return;

    lastBubbleAt.set(socket.id, now);
    const id = makeBubbleId();
    const bubble = {
      id,
      x: Number(x) || 0,
      y: Number(y) || 0,
      vy: bubbleConfig.defaultVy,
      ownerId: socket.id,
      createdAt: now,
    };
    bubbles.set(id, bubble);
    // Announce spawn to all clients
    io.emit("bubbleSpawned", {
      id: bubble.id,
      x: Math.round(bubble.x),
      y: Math.round(bubble.y),
      ownerId: bubble.ownerId,
      createdAt: bubble.createdAt,
    });
  });

  // Handle chat message
  socket.on("chatMessage", ({ text }) => {
    if (!socket.id || !text || typeof text !== "string") return;
    const playerData = players.get(socket.id);
    if (!playerData || !playerData.nickname) return;

    const messageId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const message = {
      id: messageId,
      senderId: socket.id,
      senderNickname: playerData.nickname,
      senderCharacter: playerData.character,
      text: text.trim().substring(0, 200), // max 200 chars
      timestamp: Date.now(),
    };

    messages.set(messageId, message);

    // Broadcast to all clients
    io.emit("chatMessageReceived", message);

    console.log(`${playerData.nickname}: ${text}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (!socket.id) return;
    let nickname = players.get(socket.id).nickname;
    console.log(`${nickname} left: ${socket.id}`);
    players.delete(socket.id);
    io.emit("playerLeft", socket.id);
  });
});

// Use dynamic port from Cloud Run or fallback to 8080 locally
const port = process.env.PORT || 8080;
 
 // Bubble tick loop: update positions and broadcast
 let lastTick = Date.now();
 setInterval(() => {
   const now = Date.now();
   const dt = (now - lastTick) / 1000; // seconds
   lastTick = now;
   if (bubbles.size === 0) return;
 
   const updates = [];
   for (const [id, b] of bubbles.entries()) {
     b.y += b.vy * dt;
     // expire by ttl or off-screen (y < -100)
     if (now - b.createdAt > bubbleConfig.ttlMs || b.y < -100) {
       bubbles.delete(id);
       io.emit("bubbleRemoved", { id });
     } else {
       updates.push({ id: b.id, x: Math.round(b.x), y: Math.round(b.y) });
     }
   }
   if (updates.length) io.emit("bubblesUpdate", updates);
 }, bubbleConfig.tickMs);

 // Message cleanup loop: remove expired messages
 setInterval(() => {
   const now = Date.now();
   for (const [id, msg] of messages.entries()) {
     if (now - msg.timestamp > messageConfig.ttlMs) {
       messages.delete(id);
       io.emit("chatMessageRemoved", { id });
     }
   }
 }, 1000); // Check every second
 
 server.listen(port, () => console.log(`🐠 Fish server running on port ${port}`));