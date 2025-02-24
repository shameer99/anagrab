const {
  addPlayer,
  removePlayer,
  startNewGame,
  flipLetter,
  claimWord,
  endGame,
} = require('../gameState');

function setupSocketHandlers(io) {
  io.on('connection', socket => {
    console.log('Player connected:', socket.id);

    socket.on('join_game', playerName => {
      console.log('Player joining game:', { socketId: socket.id, playerName });
      const state = addPlayer(socket.id, playerName);
      io.emit('game_state_update', state);
    });

    socket.on('start_game', () => {
      console.log('Starting new game, initializing deck...');
      const state = startNewGame();
      io.emit('game_state_update', state);
    });

    socket.on('flip_letter', () => {
      console.log('Received flip_letter event from:', socket.id);
      const { success, state } = flipLetter();
      if (success) {
        console.log('Emitting updated game state after flip');
        io.emit('game_state_update', state);
      } else {
        console.log('Flip letter failed, not emitting update');
      }
    });

    socket.on('claim_word', word => {
      console.log('Word claim attempt:', {
        socketId: socket.id,
        word,
      });
      const result = claimWord(word, socket.id);

      if (result.success) {
        console.log('Word claim successful', {
          newPotSize: result.state.pot.length,
          playerWordCount: result.state.players[socket.id].words.length,
          totalPlayers: Object.keys(result.state.players).length,
        });
        io.emit('game_state_update', result.state);
      } else {
        console.log('Word claim failed:', {
          error: result.error,
          hasState: !!result.state,
          potSize: result.state?.pot?.length,
        });
        socket.emit('claim_error', {
          word,
          reason: result.error,
        });
      }
    });

    socket.on('end_game', () => {
      console.log('End game requested by:', socket.id);
      const { success, state } = endGame();
      if (success) {
        console.log('Game ended successfully');
        io.emit('game_state_update', state);
      }
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      const state = removePlayer(socket.id);
      io.emit('game_state_update', state);
    });
  });
}

module.exports = {
  setupSocketHandlers,
};
