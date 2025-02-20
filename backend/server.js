const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// Load dictionary
const dictionary = new Set(
  fs
    .readFileSync('./dictionary.txt', 'utf8')
    .split('\n')
    .map(word => word.trim().toLowerCase())
);

// Game state
const gameState = {
  players: {}, // { socketId: { name, words: [] } }
  pot: [], // Letters that have been flipped
  deck: [], // Unflipped letters
};

// Initialize letter distribution (simplified for MVP)
function initializeDeck() {
  const distribution =
    'AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ'.split(
      ''
    );
  gameState.deck = shuffle([...distribution]);
  gameState.pot = [];
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isValidWord(word) {
  // Check if it's in dictionary and at least 4 letters
  return (dictionary.has(word.toLowerCase()) && word.length >= 4);
}


// Try to take word from pot, return true if successful
function tryTakeFromPot(word, pot, socketId) {
  // For MVP, just check if letters exist in pot
  const potLetters = [...pot];
  const wordLetters = word.split('');
  
  // Check if word can be formed
  for (const letter of wordLetters) {
    const index = potLetters.indexOf(letter);
    if (index === -1) return false;
    potLetters.splice(index, 1);
  }
  
  // Check if any letters are left in pot
  // Add word to player's words
  gameState.players[socketId].words.push(word);

  // Remove letters from pot
  for (const letter of wordLetters) {
    const index = gameState.pot.indexOf(letter);
    if (index !== -1) {
      gameState.pot.splice(index, 1);
    }
  }
  
  // Check if any letters are left in pot
  return true;
}

function tryToStealWord(word, pot, socketId) {
  const potLetters = [...pot];
  const wordLetters = word.split('');

  // Get all words from all players
  const allPlayerWords = Object.values(gameState.players).reduce((words, player) => {
    return words.concat(player.words);
  }, []);

  // Try each existing word to see if it can be used for stealing
  for (const existingWord of allPlayerWords) {
    // Skip if trying to steal the exact same word
    if (existingWord === word) continue;

    // Check if existing word is contained within the target word
    let remainingLetters = [...wordLetters];
    let canUseExistingWord = true;
    
    for (const letter of existingWord) {
      const index = remainingLetters.indexOf(letter);
      if (index === -1) {
        canUseExistingWord = false;
        break;
      }
      remainingLetters.splice(index, 1);
    }

    if (!canUseExistingWord) continue;

    // Check if remaining letters can be formed from pot
    let canFormFromPot = true;
    for (const letter of remainingLetters) {
      const potIndex = potLetters.indexOf(letter);
      if (potIndex === -1) {
        canFormFromPot = false;
        break;
      }
      potLetters.splice(potIndex, 1);
    }

    if (canFormFromPot) {
      // Remove the word from the original player
      for (const [playerId, player] of Object.entries(gameState.players)) {
        const wordIndex = player.words.indexOf(existingWord);
        if (wordIndex !== -1) {
          player.words.splice(wordIndex, 1);
          break;
        }
      }

      // Add the new word to the current player's words
      gameState.players[socketId].words.push(word);

      // Remove used letters from pot
      for (const letter of remainingLetters) {
        const index = gameState.pot.indexOf(letter);
        if (index !== -1) {
          gameState.pot.splice(index, 1);
        }
      }
      
      return true;
    }
  }

  return false;
}



io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on('join_game', playerName => {
    gameState.players[socket.id] = {
      name: playerName,
      words: [],
    };
    io.emit('game_state_update', gameState);
  });

  socket.on('start_game', () => {
    initializeDeck();
    io.emit('game_state_update', gameState);
  });

  socket.on('flip_letter', () => {
    if (gameState.deck.length > 0) {
      const letter = gameState.deck.pop();
      gameState.pot.push(letter);
      io.emit('game_state_update', gameState);
    }
  });

  socket.on("claim_word", (word) => {
    if (!isValidWord(word)) {
      io.emit("Invalid word");
      return;
    }
    if (tryTakeFromPot(word, gameState.pot, socket.id) || 
        tryToStealWord(word, gameState.pot, socket.id)) {
      io.emit("game_state_update", gameState);
      return;
    }
    io.emit("Invalid move");
  });

  socket.on("end_game", () => {
    if (gameState.deck.length === 0) {
      gameState.isActive = false;
      io.emit("game_state_update", gameState);
    }
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('game_state_update', gameState);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
