import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Initialize socket connection
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
console.log('[Socket] Connecting to backend at:', BACKEND_URL);
const socket = io(BACKEND_URL);

// Enhanced logging for development
const isDev = import.meta.env.DEV;

// Add logging to socket events in development
if (isDev) {
  const originalOn = socket.on.bind(socket);
  socket.on = (eventName, callback) => {
    return originalOn(eventName, (...args) => {
      console.log(`[Socket] Received '${eventName}':`, ...args);
      callback(...args);
    });
  };

  const originalEmit = socket.emit.bind(socket);
  socket.emit = (eventName, ...args) => {
    console.log(`[Socket] Emitting '${eventName}':`, ...args);
    return originalEmit(eventName, ...args);
  };

  // Add connection status logging
  socket.on('connect', () => {
    console.log('[Socket] Connected successfully with ID:', socket.id);
  });

  socket.on('connect_error', error => {
    console.error('[Socket] Connection error:', error);
  });

  socket.on('disconnect', reason => {
    console.log('[Socket] Disconnected:', reason);
  });
}

export const useSocket = () => {
  const [gameState, setGameState] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [errorData, setErrorData] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle game state updates
  useEffect(() => {
    socket.on('game_state_update', newState => {
      if (isDev) {
        console.log('[GameState] Update:', {
          isNull: newState === null,
          playerCount: newState ? Object.keys(newState.players).length : 0,
          potSize: newState ? newState.pot.length : 0,
          deckSize: newState ? newState.deck.length : 0,
          gameInProgress: newState ? newState.gameInProgress : false,
        });
      }

      // Update current player with their ID from game state
      if (newState?.players && currentPlayer?.name) {
        const playerEntry = Object.entries(newState.players).find(
          ([_, p]) => p.name === currentPlayer.name
        );

        if (playerEntry) {
          const [id] = playerEntry;
          setCurrentPlayer(prev => ({ ...prev, id }));
        }
      }

      setGameState(newState);
      setIsLoading(false);
    });

    return () => {
      socket.off('game_state_update');
    };
  }, [currentPlayer?.name]);

  // Handle messages
  useEffect(() => {
    socket.on('claim_error', data => {
      console.log('[Socket] Claim error:', data);
      setErrorData(data);
      setTimeout(() => setErrorData(null), 5000);
    });

    socket.on('claim_success', data => {
      console.log('[Socket] Claim success:', data);
      setSuccessData(data);
      setTimeout(() => setSuccessData(null), 5000);
    });

    socket.on('game_error', data => {
      console.error('[Socket] Game error:', data);
      setErrorData(data);
      setTimeout(() => setErrorData(null), 5000);
    });

    return () => {
      socket.off('claim_error');
      socket.off('claim_success');
      socket.off('game_error');
    };
  }, []);

  // Game actions
  const joinGame = playerName => {
    if (playerName.trim()) {
      console.log('[Game] Joining game with name:', playerName);
      setIsLoading(true);
      socket.emit('join_game', playerName);
      setIsJoined(true);
      setCurrentPlayer({ name: playerName });
    }
  };

  const startGame = () => {
    console.log('[Game] Starting new game...');
    setIsLoading(true);
    try {
      socket.emit('start_game');
      console.log('[Game] Start game event emitted');
    } catch (error) {
      console.error('[Game] Error starting game:', error);
      setErrorData({ message: 'Failed to start game: ' + error.message });
      setIsLoading(false);
    }
  };

  const flipLetter = () => {
    console.log('[Game] Flipping letter...');
    setIsLoading(true);
    socket.emit('flip_letter');
  };

  const claimWord = word => {
    if (word.trim()) {
      console.log('[Game] Claiming word:', word);
      setIsLoading(true);
      socket.emit('claim_word', word.toUpperCase());
    }
  };

  const endGame = () => {
    console.log('[Game] Ending game...');
    setIsLoading(true);
    socket.emit('end_game');
  };

  return {
    gameState,
    isJoined,
    joinGame,
    startGame,
    flipLetter,
    claimWord,
    endGame,
    errorData,
    successData,
    currentPlayer,
    isLoading,
    socket,
  };
};
