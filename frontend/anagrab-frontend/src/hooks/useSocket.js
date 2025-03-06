import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
  getPlayerToken,
  storeGameSession,
  getLastGameSession,
  clearGameSession,
} from '../utils/SessionManager';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const socket = io(BACKEND_URL);
console.log(`Socket initialized with URL: ${BACKEND_URL}`);

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
  const [playerToken, setPlayerToken] = useState(() => getPlayerToken());

  // Handle reconnection on initial load
  useEffect(() => {
    const lastSession = getLastGameSession();
    if (lastSession && lastSession.gameId && lastSession.playerName) {
      console.log('Found previous session, attempting to reconnect:', lastSession);
      reconnectToGame(lastSession.gameId, lastSession.playerName);
    }
  }, []);

  // Handle connection state changes
  useEffect(() => {
    const handleConnect = () => {
      setConnectionState('connected');
      // Try to reconnect if we have an active game
      const lastSession = getLastGameSession();
      if (lastSession && lastSession.gameId && lastSession.playerName) {
        reconnectToGame(lastSession.gameId, lastSession.playerName);
      }
    };

    const handleDisconnect = () => {
      setConnectionState('disconnected');
    };

    const handleConnectError = () => {
      setConnectionState('error');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Set up ping measurement
    socket.on('pong', data => {
      const latency = Date.now() - data.time;
      setPingLatency(latency);
    });

    const pingInterval = setInterval(() => {
      socket.emit('ping', { time: Date.now() });
    }, 5000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('pong');
      clearInterval(pingInterval);
    };
  }, []);

  // Handle game state updates
  useEffect(() => {
    socket.on('game_state_update', newState => {
      if (newState?.id) {
        setCurrentGameId(newState.id);
      }

      if (newState?.players && currentPlayer?.name) {
        // Find the player entry by name
        const playerEntry = Object.entries(newState.players).find(
          ([_, p]) => p.name === currentPlayer.name
        );

        if (playerEntry) {
          const [token] = playerEntry;
          setCurrentPlayer(prev => ({
            ...prev,
            id: token,
          }));
        }
      }

      setGameState(newState);
    });

    return () => {
      socket.off('game_state_update');
    };
  }, [currentPlayer?.name]);

  // Handle game events
  useEffect(() => {
    socket.on('join_successful', ({ gameId, playerToken: newToken }) => {
      if (newToken) {
        setPlayerToken(newToken);
      }
      setCurrentGameId(gameId);

      // Get the player name from the stored session
      const session = getLastGameSession();
      if (session) {
        setCurrentPlayer({ name: session.playerName });
      }

      // Set as joined
      setIsJoined(true);

      // Dispatch a custom event for the JoinForm component
      const joinSuccessEvent = new CustomEvent('join_successful', {
        detail: { gameId },
      });
      window.dispatchEvent(joinSuccessEvent);
    });

    socket.on('reconnection_successful', ({ gameId }) => {
      setIsJoined(true);
      setCurrentGameId(gameId);
      const session = getLastGameSession();
      if (session) {
        setCurrentPlayer({ name: session.playerName });
      }
    });

    socket.on('reconnection_failed', () => {
      clearGameSession();
      setIsJoined(false);
      setCurrentPlayer(null);
      setGameState(null);
      setCurrentGameId(null);
    });

    socket.on('claim_error', data => {
      setErrorData(data);
      // Resolve pending claim as failed
      if (pendingClaim) {
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
      if (pendingClaim) {
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

      // Dispatch a custom event for the JoinForm component to listen for
      const joinErrorEvent = new CustomEvent('join_error', {
        detail: {
          type: 'join_failed',
          reason: data.message,
        },
      });
      window.dispatchEvent(joinErrorEvent);

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
      socket.off('join_successful');
      socket.off('reconnection_successful');
      socket.off('reconnection_failed');
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
        // Store the game session with the new game ID
        const playerName = currentPlayer?.name;
        if (playerName) {
          storeGameSession(data.gameId, playerName);
        }
        // Update player token if provided
        if (data.playerToken) {
          setPlayerToken(data.playerToken);
        }
      }
    };

    socket.on('game_created', handleGameCreated);

    return () => {
      socket.off('game_created', handleGameCreated);
    };
  }, [currentPlayer?.name]);

  const createGame = playerName => {
    if (playerName.trim()) {
      socket.emit('create_game', { playerName, playerToken });
      setIsJoined(true);
      setCurrentPlayer({ name: playerName });
    }
  };

  const joinGame = (gameId, playerName) => {
    if (gameId && playerName.trim()) {
      socket.emit('join_game', { gameId, playerName, playerToken });
      // Store the session but don't set as joined yet - wait for server confirmation
      storeGameSession(gameId, playerName);
      // We'll set these states when we receive join_successful event
      // setIsJoined(true);
      // setCurrentPlayer({ name: playerName });
      // setCurrentGameId(gameId);
    }
  };

  const reconnectToGame = (gameId, playerName) => {
    if (gameId && playerName && playerToken) {
      console.log('Attempting to reconnect to game:', { gameId, playerName, playerToken });
      setCurrentGameId(gameId);
      socket.emit('reconnect_to_game', { gameId, playerToken });
    }
  };

  const leaveGame = () => {
    if (currentGameId) {
      socket.emit('leave_game', currentGameId);
      clearGameSession();
      setIsJoined(false);
      setCurrentPlayer(null);
      setGameState(null);
      setCurrentGameId(null);
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
    if (socket && currentGameId) {
      socket.emit('flip_letter', currentGameId);
    }
  };

  const toggleAutoFlip = (gameId, enabled, interval) => {
    if (socket && gameId) {
      socket.emit('toggle_auto_flip', { gameId, enabled, interval });
    }
  };

  const claimWord = word => {
    if (currentGameId && word.trim()) {
      return new Promise(resolve => {
        // Set a timeout to automatically resolve the claim after 2 seconds
        const timeoutId = setTimeout(() => {
          setPendingClaim(prev => {
            if (prev) {
              prev.resolve(false);
            }
            return null;
          });
          setErrorData({
            type: 'claim_failed',
            word: word,
            reason: 'Request timed out',
          });
        }, 2000);

        setPendingClaim({
          resolve: success => {
            clearTimeout(timeoutId);
            // Set minimum delay to 300ms as requested
            const minDelay = new Promise(r => setTimeout(() => r(success), 300));
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
    socket,
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
    toggleAutoFlip,
    gamesList,
    playerToken,
    reconnectToGame,
  };
};
