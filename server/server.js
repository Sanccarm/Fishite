// ============================================================================
// IMPORTS
// ============================================================================
import { Server } from "socket.io";
import http from "http";
import express from "express";
import { filterText } from "./profanityFilter.js";

// ============================================================================
// CONFIGURATION
// ============================================================================
// Google Cloud Storage configuration
// TODO: Replace with actual bucket URL
const COINS_BUCKET_URL = "";

// Shark configuration
const sharkConfig = {
  maxXVelocity: 600, // px per second (target velocity)
  maxYVelocity: 700, // px per second (target velocity)
  maxYPosition: 550,
  acceleration: 500, // px per second squared
  friction: 0.99, // friction coefficient
  startX: -100, // off-screen left
  endX: 3000, // off-screen right
  updateIntervalMs: 50, // same as bubble tick rate
};

const bubbleConfig = {
  tickMs: 50, // 20Hz
  defaultVy: -60, // px per second (upwards)
  ttlMs: 8000, // max lifetime
  perPlayerCooldownMs: 300, // cooldown between bubbles per player
  maxBubbles: 500,
};

const messageConfig = {
  ttlMs: 10000, // messages fade after 10 seconds
};

// Use dynamic port from Cloud Run or fallback to 8080 locally
const port = process.env.PORT || 8080;

// ============================================================================
// GLOBAL STATE
// ============================================================================
const players = new Map(); // uid -> {socketId, position, nickname, character, direction}
const activeSockets = new Map(); // socket.id -> uid (tracks which sockets are currently active)
const coins = new Map(); // uid -> coinCount (persists coins by uid)

// Shark state
let sharkPosition = { x: -100, y: 300 }; // off-screen initially (will be set properly in startSharkEvent)
let sharkVelocity = { x: 0, y: 0 };
let sharkActive = false;
let behaviors = ['randomYVelocity', 'randomXandYVelocity', 'signwave', 'loopDloop', 'teleportY'];
let movementBehavior = 'default';
let signDirection = 'up';
let updateBuffer = 0; //use this buffer to simluate a delay in the movement changes
let loopAngle = 0; // persistent angle for loopDloop
let sharkEventOngoing = false;

// Bubbles: server-authoritative bubble state
const bubbles = new Map(); // id -> { id, x, y, vy, ownerId, createdAt }
const lastBubbleAt = new Map(); // uid -> timestamp

// Chat messages
const messages = new Map(); // messageId -> { id, senderId, senderNickname, text, timestamp }

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function makeBubbleId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================================================
// SHARK FUNCTIONS
// ============================================================================
function startSharkEvent() {
  if (sharkActive) {
    console.log("Shark event already active, skipping...");
    return;
  }

  // Initialize shark position and velocity
  // Generate y within valid range to match the clamp constraint
  sharkPosition = { x: sharkConfig.startX, y: Math.random() * sharkConfig.maxYPosition };
  sharkVelocity = { x: 0, y: 0 };
  sharkActive = true;
  movementBehavior = 'default';
  updateBuffer = 0;
  loopAngle = 0;

  // Emit shark event start with initial position
  io.emit("sharkEventStart", { x: sharkPosition.x, y: sharkPosition.y });
  console.log("Shark event started at", sharkPosition);
}

function updateShark(dt) {
  if (!sharkActive) return;
  
  switch (movementBehavior) {
    case 'randomYVelocity':
      // linear X + random Y velocity with buffer
      if (sharkVelocity.x < sharkConfig.maxXVelocity) {
        sharkVelocity.x += sharkConfig.acceleration * dt;
        sharkVelocity.x = Math.min(sharkVelocity.x, sharkConfig.maxXVelocity);
      }
      if (sharkPosition.y <= 1 || sharkPosition.y >= sharkConfig.maxYPosition-10) {
        sharkVelocity.y *= -1;
      }
      updateBuffer++;
      // Set random Y velocity every 2 frames for more noticeable movement
      if (updateBuffer >= 4) {
        // Set Y velocity directly to a random value within limits
        sharkVelocity.y = (Math.random() * sharkConfig.maxYVelocity * 2) - sharkConfig.maxYVelocity;
        updateBuffer = 0;
      }
      break;
    case 'randomXandYVelocity':
      // random X and Y velocity with buffer
      if (sharkVelocity.x < sharkConfig.maxXVelocity) {
        sharkVelocity.x += sharkConfig.acceleration * dt;
        sharkVelocity.x = Math.min(sharkVelocity.x, sharkConfig.maxXVelocity);
      }
      if (sharkVelocity.y < sharkConfig.maxYVelocity) {
        sharkVelocity.y += sharkConfig.acceleration * dt;
        sharkVelocity.y = Math.min(sharkVelocity.y, sharkConfig.maxYVelocity);
      }
      if (sharkPosition.y <= 1 || sharkPosition.y >= sharkConfig.maxYPosition-10) {
        sharkVelocity.y *= -1;
      }
      updateBuffer++;
      // Set random X and Y velocity every 2 frames for more noticeable movement
      if (updateBuffer >= 4) {
        // Set X and Y velocity directly to a random value within limits
        sharkVelocity.x = (Math.random() * (sharkConfig.maxXVelocity-100)) + 100 ;
        sharkVelocity.y = (Math.random() * sharkConfig.maxYVelocity * 2) - sharkConfig.maxYVelocity;
        updateBuffer = 0;
      }
      break;
    case 'signwave':
      
      if (sharkPosition.y < 50) {
        signDirection = 'down';
        sharkVelocity.y = 0;
      }else if (sharkPosition.y > sharkConfig.maxYPosition) {
        signDirection = 'up';
        sharkVelocity.y = 0;
      }
      if (signDirection === 'up') {
        sharkVelocity.y -= sharkConfig.acceleration * dt;
      } else {
        sharkVelocity.y += sharkConfig.acceleration * dt;
      }
      if (Math.abs(sharkVelocity.y) > sharkConfig.maxYVelocity) {
        if (signDirection === 'up') {
          signDirection = 'down';
        } else {
          signDirection = 'up';
        }
      }
      break;
    case 'loopDloop':
      updateBuffer++;
      
      if (updateBuffer < 15) {
        // Move forward before starting the loop
        if (sharkVelocity.x < sharkConfig.maxXVelocity) {
          sharkVelocity.x += sharkConfig.acceleration * dt;
          sharkVelocity.x = Math.max(Math.min(sharkVelocity.x, sharkConfig.maxXVelocity), 500);
        }
        sharkVelocity.y = 0;
        break;
      }
        
      // Do a circular movement when updateBuffer >= 100
      // Log when first entering loop (angle is near 0)
      // if (loopAngle < 0.02) {
      //   console.log(`Shark loopDloop: Starting loop at position (${sharkPosition.x.toFixed(1)}, ${sharkPosition.y.toFixed(1)}), updateBuffer: ${updateBuffer}`);
      // }
      let radius = 50;
      let centerX = sharkPosition.x;
      let centerY = sharkPosition.y;
      loopAngle += .15;
      sharkVelocity.x = 0; // Override velocity for circular movement
      sharkVelocity.y = 0;
      let newX = centerX + radius * Math.cos(loopAngle);
      let newY = centerY + radius * Math.sin(loopAngle);
      sharkPosition.x = newX;
      sharkPosition.y = newY;
      // Log every 90 degrees (quarter circle)
      let angleDegrees = (loopAngle * 180 / Math.PI) % 360;

      if (loopAngle > 2 * Math.PI) {
        //console.log("loopDloop: Completed full circle, moving forward");
        loopAngle = 0;
        sharkVelocity.x = 100;
        sharkVelocity.y = 0;
        updateBuffer = 0; // Reset to move forward again
      }
      break;
    case 'teleportY':
      // teleport Y movement - teleport to random y every 10 updateBuffers
      updateBuffer++;
      if (updateBuffer >= 10) {
        // Teleport to a random y position
        sharkPosition.y = Math.floor(Math.random() * sharkConfig.maxYPosition / 50) * 50;
        updateBuffer = 0;
      } else {
        // Keep moving forward
        if (sharkVelocity.x < 100) {
          sharkVelocity.x += sharkConfig.acceleration * dt;
          sharkVelocity.x = Math.min(sharkVelocity.x, 100);
        }
        sharkVelocity.y = 0;
      }
      break;
    default:
      //straight line horizontal movement
      if (sharkVelocity.x < sharkConfig.maxXVelocity) {
        sharkVelocity.x += sharkConfig.acceleration * dt;
        sharkVelocity.x = Math.min(sharkVelocity.x, sharkConfig.maxXVelocity);
      }
      sharkVelocity.y = 0;
      if (sharkPosition.x < 0){
        movementBehavior = 'default';
      }else {
        updateBuffer++;
        if (updateBuffer > 15){ 
          if (Math.random() < 0.3){
            movementBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
            console.log("Shark movement changed");
          }
          //movementBehavior = 'default'; // change to test
          console.log("Shark movement behavior: ", movementBehavior, "x:", sharkPosition.x);
          updateBuffer = 0;
        }
      }
      break;
  }

  // Apply friction
  sharkVelocity.x *= sharkConfig.friction;

  // Update position based on velocity
  sharkPosition.x += sharkVelocity.x * dt;
  sharkPosition.y += sharkVelocity.y * dt;
  sharkPosition.y = Math.max(Math.min(sharkPosition.y, sharkConfig.maxYPosition), 0);


  // Broadcast position update
  io.emit("sharkPosition", { x: Math.round(sharkPosition.x), y: Math.round(sharkPosition.y) });

  // Check if shark has reached end position
  if (sharkPosition.x >= sharkConfig.endX) {
    // End shark event
    sharkActive = false;
    sharkEventOngoing = false;
    io.emit("sharkEventEnd");
    console.log("Shark event ended");
  }
}

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================
// Load coins map from Google Cloud bucket on startup
async function loadCoinsFromBucket() {
  try {
    if (!COINS_BUCKET_URL) {
      console.log("No coins bucket URL configured, starting with empty map");
      return;
    }
    
    console.log(`Loading coins map from bucket: ${COINS_BUCKET_URL}`);
    const response = await fetch(COINS_BUCKET_URL);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log("Coins map not found in bucket, starting with empty map");
        return;
      }
      throw new Error(`Failed to load coins map: ${response.status} ${response.statusText}`);
    }
    
    const coinsData = await response.json();
    
    // Clear existing coins and load from bucket
    coins.clear();
    for (const [uid, coinCount] of Object.entries(coinsData)) {
      coins.set(uid, coinCount);
    }
    
    console.log(`Successfully loaded ${coins.size} coin entries from bucket`);
  } catch (error) {
    console.error("Error loading coins map from bucket:", error.message);
    console.log("Starting with empty coins map");
  }
}

// Save coins map to Google Cloud bucket on shutdown
async function saveCoinsToBucket() {
  try {
    console.log(`Saving coins map to bucket: ${COINS_BUCKET_URL}`);
    
    // Convert Map to plain object for JSON serialization
    const coinsData = {};
    for (const [uid, coinCount] of coins.entries()) {
      coinsData[uid] = coinCount;
    }
    
    const response = await fetch(COINS_BUCKET_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coinsData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save coins map: ${response.status} ${response.statusText}`);
    }
    
    console.log(`Successfully saved ${coins.size} coin entries to bucket`);
  } catch (error) {
    console.error("Error saving coins map to bucket:", error.message);
  }
}

// Graceful shutdown handlers
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  await saveCoinsToBucket();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================
const app = express();

app.use(express.json());

// Optional: simple HTTP endpoint for health checks or root
app.get("/", (req, res) => res.send("🐠 Fish server is alive!"));

// Pub/Sub push endpoint for shark events
app.post("/pubsub/shark-event", (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.data) {
      console.error("Invalid Pub/Sub message format:", req.body);
      return res.status(400).send("Invalid message format");
    }

    // Decode base64 message data
    let messageData;
    try {
      const decodedData = Buffer.from(message.data, "base64").toString("utf-8");
      messageData = JSON.parse(decodedData);
    } catch (error) {
      console.error("Error decoding message data:", error);
      return res.status(400).send("Invalid message data");
    }

    if (sharkEventOngoing) {
      console.log("Attpemted shark event trigger... Shark event already ongoing, skipping...");
      res.status(202).send("Event already in progress");
      return null;
    }

    sharkEventOngoing = true;
    console.log(message.publishTime, "Event triggered:", messageData.event);
    console.log("Triggered by:", message.attributes || {});
    // Return 200 to acknowledge the message
    res.status(200).send("OK");
    startSharkEvent();
  } catch (error) {
    console.error("Error processing shark event:", error);
    res.status(500).send("Internal server error");
  }
});

// ============================================================================
// HTTP SERVER AND SOCKET.IO SETUP
// ============================================================================
// Use Node HTTP server with Express
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }, // allow all origins
});

// ============================================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================================
io.on("connection", (socket) => {

  if (!socket.id) return;

  // Handle player info (uid, nickname and character)
  socket.on("playerInfo", ({ uid, nickname, character }) => {
    if (!socket.id || !uid) return;
    
    // Check if uid already exists (user reconnecting)
    let existingPlayer = null;
    let direction = 'right';
    let position = { x: 100, y: 100 };
    let oldSocketId = null;
    const filteredNickname = filterText(nickname);
    if (players.has(uid)) {
      existingPlayer = players.get(uid);
      //console.log(`Reconnecting player ${uid}: existing character=${existingPlayer.character}, new character=${character}, existing nickname="${existingPlayer.nickname}", new nickname="${filteredNickname}"`);
      // Preserve position and direction only if character and nickname haven't changed
      if (existingPlayer.character === character && existingPlayer.nickname === filteredNickname) {
        position = existingPlayer.position;
        direction = existingPlayer.direction;
        //console.log(`Preserving position: ${position.x}, ${position.y} and direction: ${direction}`);
      } else {
        //console.log(`Character or nickname changed, resetting position to 100,100`);
      }
      oldSocketId = existingPlayer.socketId;
    }
    
    // Create new player entry with uid as key
    const playerData = {
      socketId: socket.id,
      position: position,
      nickname: filteredNickname,
      character: character,
      direction: direction
    };
    players.set(uid, playerData);
    activeSockets.set(socket.id, uid);
    
    // Initialize coins if player is new
    if (!coins.has(uid)) {
      coins.set(uid, 0);
    }
    
    // Now disconnect old socket if it exists
    if (oldSocketId) {
      const oldSocket = io.sockets.sockets.get(oldSocketId);
      if (oldSocket) {
        oldSocket.disconnect();
      }
      // Clean up old mapping
      activeSockets.delete(oldSocketId);
    }
    
    console.log(`${playerData.nickname} joined | uid: ${uid} | socket: ${socket.id}`);
    
    // Get coin count for this player
    const coinCount = coins.get(uid) || 0;
    
    // Send full list of current active players (only those with active sockets)
    const playersMap = {};
    for (const [socketId, playerUid] of activeSockets.entries()) {
      const data = players.get(playerUid);
      if (data) {
        playersMap[playerUid] = {
          position: data.position,
          nickname: data.nickname,
          character: data.character,
          direction: data.direction,
        };
      }
    }
    socket.emit("init", { playersMap, coinCount });
    
    // Broadcast updated player info to others
    socket.broadcast.emit("playerJoined", {
      id: uid,
      position: playerData.position,
      nickname: playerData.nickname,
      character: playerData.character,
      direction: playerData.direction,
    });
  });

  // Handle player movement
  socket.on("move", (position, direction) => {
    if (!socket.id) return;
    const uid = activeSockets.get(socket.id);
    if (!uid) return; // Player not yet registered
    const data = players.get(uid);
    if (!data) return;
    data.position = position;
    data.direction = direction;
    players.set(uid, data);
    socket.broadcast.emit("playerMoved", {
      id: uid,
      position: data.position,
      direction: data.direction,
    });
  });

  // Handle bubble creation from client (space press)
  socket.on("bubbleCreate", ({ x, y }) => {
    if (!socket.id) return;
    const uid = activeSockets.get(socket.id);
    if (!uid) return; // Player not yet registered
    const now = Date.now();
    const last = lastBubbleAt.get(uid) || 0;
    if (now - last < bubbleConfig.perPlayerCooldownMs) return; // cooldown
    if (bubbles.size >= bubbleConfig.maxBubbles) return; // global cap

    // Basic per-player live bubble cap (optional): max 20
    let playerCount = 0;
    for (const b of bubbles.values()) if (b.ownerId === uid) playerCount++;
    if (playerCount >= 20) return;

    lastBubbleAt.set(uid, now);
    const id = makeBubbleId();
    const bubble = {
      id,
      x: Number(x) || 0,
      y: Number(y) || 0,
      vy: bubbleConfig.defaultVy,
      ownerId: uid,
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
    const uid = activeSockets.get(socket.id);
    if (!uid) return; // Player not yet registered
    const playerData = players.get(uid);
    if (!playerData || !playerData.nickname) return;

    const messageId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const filteredText = filterText(text.trim().substring(0, 200)); // Filter and max 200 chars
    const message = {
      id: messageId,
      senderId: uid,
      senderNickname: playerData.nickname,
      senderCharacter: playerData.character,
      text: filteredText,
      timestamp: Date.now(),
    };

    messages.set(messageId, message);

    // Broadcast to all clients
    io.emit("chatMessageReceived", message);

    console.log(`${playerData.nickname}: ${filteredText}`);
  });

  // Handle player-shark collision
  socket.on("playerSharkCollision", () => {
    if (!socket.id) return;
    const uid = activeSockets.get(socket.id);
    if (!uid) return; // Player not yet registered
    const playerData = players.get(uid);
    if (playerData) {
      console.log(`${playerData.nickname} collided with shark: ${uid}`);
      // Deduct 10 coins (minimum 0)
      const currentCoins = coins.get(uid) || 0;
      const newCoinCount = Math.max(0, currentCoins - 10);
      coins.set(uid, newCoinCount);
      // Notify client of coin loss
      socket.emit("coinBalanceUpdate", { coinCount: newCoinCount });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    if (!socket.id) return;
    const uid = activeSockets.get(socket.id);
    if (!uid) return; // Player not yet registered
    const playerData = players.get(uid);
    // Only remove socket from activeSockets, don't delete player data
    // This allows player data to persist for reconnection
    if (playerData && playerData.socketId === socket.id) {
      console.log(`${playerData.nickname} disconnected: ${uid}`);
      // Clear the socketId in player data to mark as disconnected
      playerData.socketId = null;
      io.emit("playerLeft", uid);
    }
    activeSockets.delete(socket.id);
  });
});

// ============================================================================
// GAME LOOPS
// ============================================================================
// Game tick loop: update bubbles and shark positions
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = (now - lastTick) / 1000; // seconds
  lastTick = now;

  // Update shark (physics-based movement)
  updateShark(dt);

  // Update bubbles
  if (bubbles.size > 0) {
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
  }
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

// Coin distribution loop: give 1 coin to each active player every 10 seconds
setInterval(() => {
  for (const [socketId, uid] of activeSockets.entries()) {
    const currentCoins = coins.get(uid) || 0;
   const newCoinCount = currentCoins + 1;
   coins.set(uid, newCoinCount);
   
   // Find the socket and emit coinBalanceUpdate event
   const socket = io.sockets.sockets.get(socketId);
   if (socket) {
     socket.emit("coinBalanceUpdate", { coinCount: newCoinCount });
   }
  }
}, 10000); // Every 10 seconds

// ============================================================================
// SERVER STARTUP
// ============================================================================
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Load coins on startup, then start server
loadCoinsFromBucket().then(() => {
  server.listen(port, () => console.log(`🐠 Fish server running on port ${port}`));
});
