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
server.listen(port, () => console.log(`🐠 Fish server running on port ${port}`));