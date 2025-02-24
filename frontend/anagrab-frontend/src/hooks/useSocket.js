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
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    socket.on('game_state_update', newState => {
      console.log('Received game_state_update with state:', {
        isNull: newState === null,
        playerCount: newState ? Object.keys(newState.players).length : 0,
        potSize: newState ? newState.pot.length : 0,
        deckSize: newState ? newState.deck.length : 0,
      });

      // Update current player with their ID from game state
      if (newState?.players && currentPlayer?.name) {
        console.log('[game_state_update] Current player before update:', currentPlayer);
        console.log('[game_state_update] All players:', newState.players);

        const playerEntry = Object.entries(newState.players).find(([_, p]) => {
          const match = p.name === currentPlayer.name;
          console.log('[game_state_update] Comparing:', {
            playerName: p.name,
            currentPlayerName: currentPlayer.name,
            match,
          });
          return match;
        });

        console.log('[game_state_update] Found player entry:', playerEntry);

        if (playerEntry) {
          const [id] = playerEntry;
          console.log('[game_state_update] Updating current player with id:', id);
          setCurrentPlayer(prev => {
            const updated = { ...prev, id };
            console.log('[game_state_update] Updated current player:', updated);
            return updated;
          });
        } else {
          console.log('[game_state_update] WARNING: Could not find current player in game state');
        }
      } else {
        console.log('[game_state_update] Skipping current player update:', {
          hasPlayers: !!newState?.players,
          hasCurrentPlayer: !!currentPlayer,
          currentPlayerName: currentPlayer?.name,
        });
      }

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
      console.log('[joinGame] Setting current player name:', playerName);
      socket.emit('join_game', playerName);
      setIsJoined(true);
      setCurrentPlayer({ name: playerName });
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
    currentPlayer,
  };
};
