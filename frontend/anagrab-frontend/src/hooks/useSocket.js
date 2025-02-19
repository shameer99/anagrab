import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export const useSocket = () => {
  const [gameState, setGameState] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    socket.on('game_state_update', (newState) => {
      setGameState(newState);
    });

    return () => {
      socket.off('game_state_update');
    };
  }, []);

  const joinGame = (playerName) => {
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

  const claimWord = (word) => {
    if (word.trim()) {
      socket.emit('claim_word', word.toUpperCase());
    }
  };

  const endGame = () => {
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
  };
}; 