const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());

// Initialize counter state
let counter = 0;

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);
  
  // Send initial counter value to newly connected clients
  socket.emit("counter_update", counter);

  // Handle increment request
  socket.on("increment", () => {
    counter++;
    io.emit("counter_update", counter);
  });

  // Handle decrement request
  socket.on("decrement", () => {
    counter--;
    io.emit("counter_update", counter);
  });
});

server.listen(5001, () => console.log("Server running on port 5001"));
