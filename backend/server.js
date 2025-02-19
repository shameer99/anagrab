const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Load dictionary
const dictionary = new Set(
  fs.readFileSync('./dictionary.txt', 'utf8')
    .split('\n')
    .map(word => word.trim().toLowerCase())
);

// Game state
const gameState = {
  players: {},  // { socketId: { name, words: [] } }
  pot: [],      // Letters that have been flipped
  deck: [],     // Unflipped letters
  isActive: false
};

// Initialize letter distribution (simplified for MVP)
function initializeDeck() {
  const distribution = 'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ'.split('');
  gameState.deck = shuffle([...distribution]);
  gameState.pot = [];
  gameState.isActive = true;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isValidWord(word, playerWords, pot) {
  // Check if it's in dictionary and at least 4 letters
  if (!dictionary.has(word.toLowerCase()) || word.length < 4) return false;
  
  // For MVP, just check if letters exist in pot
  const potLetters = [...pot];
  const wordLetters = word.split('');
  
  for (const letter of wordLetters) {
    const index = potLetters.indexOf(letter);
    if (index === -1) return false;
    potLetters.splice(index, 1);
  }
  
  return true;
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("join_game", (playerName) => {
    gameState.players[socket.id] = {
      name: playerName,
      words: []
    };
    io.emit("game_state_update", gameState);
  });

  socket.on("start_game", () => {
    initializeDeck();
    io.emit("game_state_update", gameState);
  });

  socket.on("flip_letter", () => {
    if (gameState.deck.length > 0) {
      const letter = gameState.deck.pop();
      gameState.pot.push(letter);
      io.emit("game_state_update", gameState);
    }
  });

  socket.on("claim_word", (word) => {
    if (isValidWord(word, gameState.players[socket.id].words, gameState.pot)) {
      gameState.players[socket.id].words.push(word);
      // Remove used letters from pot
      const wordLetters = word.split('');
      for (const letter of wordLetters) {
        const index = gameState.pot.indexOf(letter);
        if (index !== -1) {
          gameState.pot.splice(index, 1);
        }
      }
      io.emit("game_state_update", gameState);
    }
  });

  socket.on("end_game", () => {
    if (gameState.deck.length === 0) {
      gameState.isActive = false;
      io.emit("game_state_update", gameState);
    }
  });

  socket.on("disconnect", () => {
    delete gameState.players[socket.id];
    io.emit("game_state_update", gameState);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
