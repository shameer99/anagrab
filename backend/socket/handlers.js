const { GameManager } = require('../GameManager');

function setupSocketHandlers(io) {
  io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    // Create a new game
    socket.on('create_game', async playerName => {
      console.log('Creating new game:', { hostSocketId: socket.id, playerName });
      try {
        const game = await GameManager.createGame(socket.id);

        // Add the host as a player
        await GameManager.addPlayerToGame(game.id, socket.id, playerName);

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
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('game_error', { type: 'create_failed', message: 'Failed to create game' });
      }
    });

    // Join an existing game
    socket.on('join_game', async ({ gameId, playerName }) => {
      console.log('Player joining game:', { socketId: socket.id, playerName, gameId });

      try {
        // Add player to the game
        const game = await GameManager.addPlayerToGame(gameId, socket.id, playerName);

        if (game) {
          // Join the socket to the game room
          socket.join(gameId);

          // Send game state to all players in the room
          io.to(gameId).emit('game_state_update', game);
        } else {
          // Game not found
          socket.emit('join_error', { message: 'Game not found' });
        }
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('join_error', { message: 'Failed to join game' });
      }
    });

    // Start a game
    socket.on('start_game', async gameId => {
      console.log('Starting game:', { gameId, requestedBy: socket.id });
      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          game.startNewGame();
          await GameManager.saveGameToDB(game);
          io.to(gameId).emit('game_state_update', game);
        }
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('game_error', { type: 'start_failed', message: 'Failed to start game' });
      }
    });

    // Flip a letter
    socket.on('flip_letter', async gameId => {
      console.log('Flipping letter in game:', { gameId, requestedBy: socket.id });
      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          const { success, state } = game.flipLetter();
          if (success) {
            await GameManager.saveGameToDB(state);
            io.to(gameId).emit('game_state_update', state);
          } else {
            socket.emit('game_error', { type: 'flip_failed', message: 'No more letters in deck' });
          }
        }
      } catch (error) {
        console.error('Error flipping letter:', error);
        socket.emit('game_error', { type: 'flip_failed', message: 'Failed to flip letter' });
      }
    });

    // Claim a word
    socket.on('claim_word', async ({ gameId, word }) => {
      console.log('Word claim attempt:', { socketId: socket.id, gameId, word });

      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          const result = game.claimWord(word, socket.id);

          if (result.success) {
            await GameManager.saveGameToDB(result.state);
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
            socket.emit('claim_error', {
              word,
              type: 'claim_failed',
              reason: result.error,
            });
          }
        }
      } catch (error) {
        console.error('Error claiming word:', error);
        socket.emit('claim_error', {
          word,
          type: 'claim_failed',
          reason: 'Internal server error',
        });
      }
    });

    // End a game
    socket.on('end_game', async gameId => {
      console.log('End game requested:', { gameId, requestedBy: socket.id });
      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          const { success, state } = game.endGame();
          if (success) {
            await GameManager.saveGameToDB(state);
            io.to(gameId).emit('game_state_update', state);
          } else {
            socket.emit('game_error', { type: 'end_game_failed', message: 'Cannot end game yet' });
          }
        }
      } catch (error) {
        console.error('Error ending game:', error);
        socket.emit('game_error', { type: 'end_game_failed', message: 'Failed to end game' });
      }
    });

    // Leave a game
    socket.on('leave_game', async gameId => {
      console.log('Player leaving game:', { socketId: socket.id, gameId });

      try {
        // Remove player from the game
        const game = await GameManager.removePlayerFromGame(gameId, socket.id);

        if (game) {
          // Leave the socket room
          socket.leave(gameId);

          // Send updated game state to remaining players
          io.to(gameId).emit('game_state_update', game);
        }
      } catch (error) {
        console.error('Error leaving game:', error);
      }
    });

    // List available games
    socket.on('list_games', () => {
      const games = Array.from(GameManager.games.values());
      socket.emit('games_list', games);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('Player disconnected:', socket.id);

      try {
        // Find which game the player was in
        const game = GameManager.getGameByPlayerId(socket.id);

        if (game) {
          // Remove player from all games
          await GameManager.removePlayerFromAllGames(socket.id);

          // Send updated game state to remaining players
          io.to(game.id).emit('game_state_update', game);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
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
