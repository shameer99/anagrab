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

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);
});

server.listen(5001, () => console.log("Server running on port 5001"));
