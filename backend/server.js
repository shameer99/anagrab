const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Middleware
app.use(express.json());

// Import modules
const { setupSocketHandlers } = require('./socket/handlers');
const debugRoutes = require('./routes/debug');

// Use debug routes
app.use('/debug', debugRoutes);

// Initialize socket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
