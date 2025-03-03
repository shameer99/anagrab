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
  const [connectionState, setConnectionState] = useState('connecting');
  const [pingLatency, setPingLatency] = useState(null);
  const [pendingClaim, setPendingClaim] = useState(null);
  const [currentGameId, setCurrentGameId] = useState(null);
  const [gamesList, setGamesList] = useState([]);

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionState('connected');
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('connect_error', () => {
      setConnectionState('error');
    });

    // Set up ping measurement
    socket.on('pong', data => {
      const latency = Date.now() - data.time;
      setPingLatency(latency);
    });

    const pingInterval = setInterval(() => {
      socket.emit('ping', { time: Date.now() });
    }, 5000);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('pong');
      clearInterval(pingInterval);
    };
  }, []);

  useEffect(() => {
    socket.on('game_state_update', newState => {
      if (newState?.id && !currentGameId) {
        setCurrentGameId(newState.id);
      }

      if (newState?.players && currentPlayer?.name) {
        const playerEntry = Object.entries(newState.players).find(([_, p]) => {
          return p.name === currentPlayer.name;
        });

        if (playerEntry) {
          const [id] = playerEntry;
          setCurrentPlayer(prev => ({
            ...prev,
            id,
          }));
        }
      }

      setGameState(newState);
    });

    return () => {
      socket.off('game_state_update');
    };
  }, [currentPlayer?.name, currentGameId]);

  useEffect(() => {
    socket.on('claim_error', data => {
      setErrorData(data);
      // Resolve pending claim as failed
      if (pendingClaim && data.type === 'claim_failed') {
        setPendingClaim(prev => {
          if (prev) {
            prev.resolve(false);
          }
          return null;
        });
      }
      setTimeout(() => setErrorData(null), 5000);
    });

    socket.on('claim_success', data => {
      setSuccessData(data);
      // Resolve pending claim as successful
      if (pendingClaim && data.type?.includes('claim')) {
        setPendingClaim(prev => {
          if (prev) {
            prev.resolve(true);
          }
          return null;
        });
      }
      setTimeout(() => setSuccessData(null), 5000);
    });

    socket.on('join_error', data => {
      setErrorData({
        type: 'join_failed',
        reason: data.message,
      });
      setTimeout(() => setErrorData(null), 5000);
    });

    socket.on('game_error', data => {
      setErrorData({
        type: data.type,
        reason: data.message,
      });
      setTimeout(() => setErrorData(null), 5000);
    });

    socket.on('games_list', games => {
      setGamesList(games);
    });

    return () => {
      socket.off('claim_error');
      socket.off('claim_success');
      socket.off('join_error');
      socket.off('game_error');
      socket.off('games_list');
    };
  }, [pendingClaim]);

  // Add a useEffect specifically for handling the game_created event
  useEffect(() => {
    const handleGameCreated = data => {
      if (data && data.gameId) {
        setCurrentGameId(data.gameId);
      }
    };

    socket.on('game_created', handleGameCreated);

    return () => {
      socket.off('game_created', handleGameCreated);
    };
  }, []);

  // Game creation
  const createGame = playerName => {
    if (playerName.trim()) {
      console.log('[createGame] Creating new game with player:', playerName);
      socket.emit('create_game', playerName);
      setIsJoined(true);
      setCurrentPlayer({ name: playerName });
    }
  };

  // Join an existing game
  const joinGame = (gameId, playerName) => {
    if (gameId && playerName.trim()) {
      console.log('[joinGame] Joining game:', { gameId, playerName });
      socket.emit('join_game', { gameId, playerName });
      setIsJoined(true);
      setCurrentPlayer({ name: playerName });
      setCurrentGameId(gameId);
    }
  };

  // Leave the current game
  const leaveGame = () => {
    if (currentGameId) {
      socket.emit('leave_game', currentGameId);
      setIsJoined(false);
      setCurrentPlayer(null);
      setCurrentGameId(null);
      setGameState(null);
    }
  };

  // List available games
  const listGames = () => {
    socket.emit('list_games');
  };

  // Game actions
  const startGame = () => {
    if (currentGameId) {
      socket.emit('start_game', currentGameId);
    }
  };

  const flipLetter = () => {
    if (currentGameId) {
      socket.emit('flip_letter', currentGameId);
    }
  };

  const claimWord = word => {
    if (currentGameId && word.trim()) {
      return new Promise(resolve => {
        setPendingClaim({
          resolve: success => {
            // Create a minimum delay of 500ms
            const minDelay = new Promise(r => setTimeout(() => r(success), 500));
            Promise.all([minDelay]).then(() => resolve(success));
          },
        });
        socket.emit('claim_word', { gameId: currentGameId, word: word.toUpperCase() });
      });
    }
    return Promise.resolve(false);
  };

  const endGame = () => {
    if (currentGameId) {
      socket.emit('end_game', currentGameId);
    }
  };

  return {
    gameState,
    isJoined,
    createGame,
    joinGame,
    leaveGame,
    listGames,
    startGame,
    flipLetter,
    claimWord,
    endGame,
    errorData,
    setErrorData,
    successData,
    setSuccessData,
    currentPlayer,
    currentGameId,
    connectionState,
    pingLatency,
    gamesList,
    socket,
  };
};
