import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const originalOn = socket.on.bind(socket);
socket.on = (eventName, callback) => {
  return originalOn(eventName, (...args) => {
    console.log(`Socket Received '${eventName}':`, ...args);
    callback(...args);
  });
};

// Wrap the original socket.emit method
const originalEmit = socket.emit.bind(socket);
socket.emit = (eventName, ...args) => {
  console.log(`Socket Emitting '${eventName}':`, ...args);
  return originalEmit(eventName, ...args);
};

export const useSocket = () => {
  const [gameState, setGameState] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [errorData, setErrorData] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    socket.on('game_state_update', newState => {
      console.log('Received game_state_update with state:', {
        isNull: newState === null,
        playerCount: newState ? Object.keys(newState.players).length : 0,
        potSize: newState ? newState.pot.length : 0,
        deckSize: newState ? newState.deck.length : 0,
      });
      setGameState(newState);
    });

    return () => {
      socket.off('game_state_update');
    };
  }, []);

  useEffect(() => {
    socket.on('claim_error', data => {
      setErrorData(data);
      setTimeout(() => setErrorData(null), 5000);
    });

    socket.on('claim_success', data => {
      setSuccessData(data);
      setTimeout(() => setSuccessData(null), 5000);
    });

    return () => {
      socket.off('claim_error');
      socket.off('claim_success');
    };
  }, []);

  const joinGame = playerName => {
    if (playerName.trim()) {
      socket.emit('join_game', playerName);
      setIsJoined(true);
    }
  };

  const startGame = () => {
    socket.emit('start_game');
  };

  const flipLetter = () => {
    socket.emit('flip_letter');
  };

  const claimWord = word => {
    if (word.trim()) {
      socket.emit('claim_word', word.toUpperCase());
    }
  };

  return {
    gameState,
    isJoined,
    joinGame,
    startGame,
    flipLetter,
    claimWord,
    errorData,
    setErrorData,
    successData,
    setSuccessData,
  };
};
