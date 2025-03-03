const {
  createGame,
  addPlayerToGame,
  removePlayerFromGame,
  removePlayerFromAllGames,
  getGameByPlayerId,
  startGame,
  flipLetter,
  claimWord,
  endGame,
  listGames,
} = require('../gameState');

function setupSocketHandlers(io) {
  io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    // Create a new game
    socket.on('create_game', playerName => {
      console.log('Creating new game:', { hostSocketId: socket.id, playerName });
      const game = createGame(socket.id);

      // Add the host as a player
      addPlayerToGame(game.id, socket.id, playerName);

      // Join the socket to the game room
      socket.join(game.id);

      // Send the game info back to the creator
      const gameInfo = {
        gameId: game.id,
        joinUrl: `${process.env.FRONTEND_URL || ''}?game=${game.id}`,
      };

      socket.emit('game_created', gameInfo);

      // Send game state to all players in the room
      io.to(game.id).emit('game_state_update', game);
    });

    // Join an existing game
    socket.on('join_game', ({ gameId, playerName }) => {
      console.log('Player joining game:', { socketId: socket.id, playerName, gameId });

      // Add player to the game
      const game = addPlayerToGame(gameId, socket.id, playerName);

      if (game) {
        // Join the socket to the game room
        socket.join(gameId);

        // Send game state to all players in the room
        io.to(gameId).emit('game_state_update', game);
      } else {
        // Game not found
        socket.emit('join_error', { message: 'Game not found' });
      }
    });

    // Start a game
    socket.on('start_game', gameId => {
      console.log('Starting game:', { gameId, requestedBy: socket.id });
      const game = startGame(gameId);

      if (game) {
        io.to(gameId).emit('game_state_update', game);
      }
    });

    // Flip a letter
    socket.on('flip_letter', gameId => {
      console.log('Flipping letter in game:', { gameId, requestedBy: socket.id });
      const { success, state, error } = flipLetter(gameId);

      if (success) {
        io.to(gameId).emit('game_state_update', state);
      } else {
        socket.emit('game_error', { type: 'flip_failed', message: error });
      }
    });

    // Claim a word
    socket.on('claim_word', ({ gameId, word }) => {
      console.log('Word claim attempt:', {
        socketId: socket.id,
        gameId,
        word,
      });

      const result = claimWord(gameId, word, socket.id);

      if (result.success) {
        console.log('Word claim successful', {
          gameId,
          newPotSize: result.state.pot.length,
          playerWordCount: result.state.players[socket.id].words.length,
        });

        // Send game state update to all players in the room
        io.to(gameId).emit('game_state_update', result.state);

        // Send success notification to all players in the room
        const playerName = result.state.players[socket.id].name;
        if (result.source === 'pot') {
          io.to(gameId).emit('claim_success', {
            type: 'pot_claim',
            player: playerName,
            word: result.word,
          });
        } else {
          const stolenFromName = result.state.players[result.stolenFrom].name;
          const isSelfModification = socket.id === result.stolenFrom;

          io.to(gameId).emit('claim_success', {
            type: isSelfModification ? 'self_modify' : 'steal',
            player: playerName,
            word: result.word,
            originalWord: result.originalWord,
            stolenFrom: stolenFromName,
          });
        }
      } else {
        console.log('Word claim failed:', {
          error: result.error,
        });
        socket.emit('claim_error', {
          word,
          type: 'claim_failed',
          reason: result.error,
        });
      }
    });

    // End a game
    socket.on('end_game', gameId => {
      console.log('End game requested:', { gameId, requestedBy: socket.id });
      const { success, state, error } = endGame(gameId);

      if (success) {
        io.to(gameId).emit('game_state_update', state);
      } else {
        socket.emit('game_error', { type: 'end_game_failed', message: error });
      }
    });

    // Leave a game
    socket.on('leave_game', gameId => {
      console.log('Player leaving game:', { socketId: socket.id, gameId });

      // Remove player from the game
      const game = removePlayerFromGame(gameId, socket.id);

      if (game) {
        // Leave the socket room
        socket.leave(gameId);

        // Send updated game state to remaining players
        io.to(gameId).emit('game_state_update', game);
      }
    });

    // List available games
    socket.on('list_games', () => {
      const games = listGames();
      socket.emit('games_list', games);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);

      // Find which game the player was in
      const game = getGameByPlayerId(socket.id);

      if (game) {
        // Remove player from all games
        removePlayerFromAllGames(socket.id);

        // Send updated game state to remaining players
        io.to(game.id).emit('game_state_update', game);
      }
    });

    // Ping for latency measurement
    socket.on('ping', data => {
      socket.emit('pong', data);
    });
  });
}

module.exports = {
  setupSocketHandlers,
};
