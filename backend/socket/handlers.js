const { GameManager } = require('../GameManager');

function setupSocketHandlers(io) {
  io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    // Create a new game
    socket.on('create_game', async ({ playerName, playerToken }) => {
      console.log('Creating new game:', { hostSocketId: socket.id, playerName, playerToken });
      try {
        // Validate and truncate player name if needed
        const sanitizedPlayerName = playerName
          ? playerName.trim().substring(0, 20) // Limit to 20 characters
          : 'Player';

        const game = await GameManager.createGame(socket.id);

        // Add the host as a player
        const result = await GameManager.addPlayerToGame(
          game.id,
          socket.id,
          sanitizedPlayerName,
          playerToken
        );

        // Join the socket to the game room
        socket.join(game.id);

        // Send the game info back to the creator
        const gameInfo = {
          gameId: game.id,
          joinUrl: `${process.env.FRONTEND_URL || ''}?game=${game.id}`,
          playerToken: result.playerToken,
        };

        socket.emit('game_created', gameInfo);

        // Send game state to all players in the room
        io.to(game.id).emit('game_state_update', result.game);
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('game_error', { type: 'create_failed', message: 'Failed to create game' });
      }
    });

    // Join an existing game
    socket.on('join_game', async ({ gameId, playerName, playerToken }) => {
      console.log('Player joining game:', { socketId: socket.id, playerName, gameId, playerToken });

      try {
        // Validate and truncate player name if needed
        const sanitizedPlayerName = playerName
          ? playerName.trim().substring(0, 20) // Limit to 20 characters
          : 'Player';

        // Add player to the game
        const result = await GameManager.addPlayerToGame(
          gameId,
          socket.id,
          sanitizedPlayerName,
          playerToken
        );

        if (result) {
          // Join the socket to the game room
          socket.join(gameId);

          // Send player token back to the client
          socket.emit('join_successful', {
            gameId,
            playerToken: result.playerToken,
          });

          // Send game state to all players in the room
          io.to(gameId).emit('game_state_update', result.game);
        } else {
          // Game not found
          socket.emit('join_error', { message: 'Game not found' });
        }
      } catch (error) {
        console.error('Error joining game:', error);
        socket.emit('join_error', { message: 'Failed to join game' });
      }
    });

    // Reconnect to a game
    socket.on('reconnect_to_game', async ({ gameId, playerToken }) => {
      console.log('Player reconnecting:', { socketId: socket.id, gameId, playerToken });

      try {
        const game = await GameManager.reconnectPlayer(gameId, playerToken, socket.id);

        if (game) {
          // Join the socket to the game room
          socket.join(gameId);

          // Send success response
          socket.emit('reconnection_successful', { gameId });

          // Send game state to all players
          io.to(gameId).emit('game_state_update', game);
        } else {
          socket.emit('reconnection_failed', {
            message:
              'Unable to reconnect to the game. The game may have ended or your session expired.',
          });
        }
      } catch (error) {
        console.error('Error reconnecting:', error);
        socket.emit('reconnection_failed', {
          message: 'Failed to reconnect to the game',
        });
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
          // Emit initial turn info
          const currentPlayer = game.players[game.getCurrentTurn()];
          io.to(gameId).emit('turn_update', {
            currentTurn: game.getCurrentTurn(),
            playerName: currentPlayer?.name,
          });
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
          const { success, state, error } = game.flipLetter(socket.id);
          if (success) {
            await GameManager.saveGameToDB(state);
            io.to(gameId).emit('game_state_update', state);
            // Emit whose turn is next
            const nextPlayer = state.players[state.getCurrentTurn()];
            io.to(gameId).emit('turn_update', {
              currentTurn: state.getCurrentTurn(),
              playerName: nextPlayer?.name,
            });
          } else {
            socket.emit('game_error', {
              type: 'flip_failed',
              message: error || 'No more letters in deck',
            });
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
            const playerToken = game.playerTokens.get(socket.id);
            console.log('Word claim successful', {
              gameId,
              newPotSize: result.state.pot.length,
              playerWordCount: result.state.players[playerToken].words.length,
            });

            // Send game state update to all players in the room
            io.to(gameId).emit('game_state_update', result.state);

            // Send success notification to all players in the room
            const playerName = result.state.players[playerToken].name;
            if (result.source === 'pot') {
              io.to(gameId).emit('claim_success', {
                type: 'pot_claim',
                player: playerName,
                word: result.word,
              });
            } else {
              const stolenFromName = result.state.players[result.stolenFrom].name;
              const isSelfModification = playerToken === result.stolenFrom;

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
          // Update the player's last seen timestamp but don't remove them
          const player = game.getPlayerBySocket(socket.id);
          if (player) {
            player.lastSeen = new Date();
            await GameManager.saveGameToDB(game);

            // Send updated game state to remaining players
            io.to(game.id).emit('game_state_update', game);
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Ping for latency measurement
    socket.on('ping', data => {
      socket.emit('pong', data);
    });

    // Toggle auto-flip
    socket.on('toggle_auto_flip', async ({ gameId, enabled, interval }) => {
      console.log('Toggle auto-flip:', { gameId, enabled, interval, requestedBy: socket.id });
      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          game.toggleAutoFlip(enabled, interval);
          await GameManager.saveGameToDB(game);
          io.to(gameId).emit('game_state_update', game);
          io.to(gameId).emit('auto_flip_update', {
            enabled: game.settings.autoFlipEnabled,
            interval: game.settings.autoFlipInterval,
            nextFlipTime: game.nextFlipTime,
          });
        }
      } catch (error) {
        console.error('Error toggling auto-flip:', error);
        socket.emit('game_error', {
          type: 'auto_flip_failed',
          message: 'Failed to toggle auto-flip',
        });
      }
    });

    // Get current turn info
    socket.on('get_turn_info', async gameId => {
      console.log('Getting turn info:', { gameId, requestedBy: socket.id });
      try {
        const game = GameManager.getGame(gameId);
        if (game) {
          const currentTurn = game.getCurrentTurn();
          const currentPlayer = game.players[currentTurn];
          socket.emit('turn_info', {
            currentTurn,
            playerName: currentPlayer?.name,
          });
        }
      } catch (error) {
        console.error('Error getting turn info:', error);
        socket.emit('game_error', {
          type: 'turn_info_failed',
          message: 'Failed to get turn information',
        });
      }
    });
  });
}

module.exports = {
  setupSocketHandlers,
};
