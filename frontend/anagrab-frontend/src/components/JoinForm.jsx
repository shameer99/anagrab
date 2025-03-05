import { useState, useEffect } from 'react';

export const JoinForm = ({ onCreateGame, onJoinGame }) => {
  const [mode, setMode] = useState('choice'); // 'choice', 'create', or 'join'
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [flippedTiles, setFlippedTiles] = useState(new Set());
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check URL for game code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('gameCode');
    if (gameParam) {
      setGameCode(gameParam);
      setMode('join');
    }
  }, []);

  // Listen for socket errors
  useEffect(() => {
    const handleJoinError = event => {
      if (event.detail && event.detail.type === 'join_failed') {
        setError(event.detail.reason || 'Failed to join game. Please check your game code.');
        setIsLoading(false);
      }
    };

    const handleJoinSuccess = () => {
      // On successful join, the component will unmount as the app navigates to the game
      setIsLoading(false);
    };

    // Create custom event listeners
    window.addEventListener('join_error', handleJoinError);
    window.addEventListener('join_successful', handleJoinSuccess);

    return () => {
      window.removeEventListener('join_error', handleJoinError);
      window.removeEventListener('join_successful', handleJoinSuccess);
    };
  }, []);

  useEffect(() => {
    // Reset flipped tiles when mode changes
    setFlippedTiles(new Set());
    // Clear any errors when mode changes
    setError(null);
    // Reset loading state
    setIsLoading(false);

    // Start the flip animation sequence
    const letters = ['A', 'N', 'A', 'G', 'R', 'A', 'B'];
    letters.forEach((_, index) => {
      setTimeout(
        () => {
          setFlippedTiles(prev => {
            const newFlipped = new Set(prev);
            newFlipped.add(index);
            return newFlipped;
          });
        },
        500 * (index + 1)
      );
    });
  }, [mode]); // Run when mode changes or on mount

  const handleSubmit = e => {
    e.preventDefault();

    // Clear any previous errors
    setError(null);

    if (mode === 'create') {
      // No need for callback since component will unmount
      setIsLoading(true);
      onCreateGame(playerName);
    } else if (mode === 'join') {
      // Validate game code
      if (!gameCode || gameCode.length !== 4) {
        setError('Please enter a valid 4-character game code');
        return;
      }

      // Set loading state
      setIsLoading(true);

      // Add event listener for join errors that will be triggered by the socket
      const handleJoinErrorEvent = errorData => {
        setError(errorData.detail.reason || 'Failed to join game');
        setIsLoading(false);
        document.removeEventListener('join_error', handleJoinErrorEvent);
      };

      document.addEventListener('join_error', handleJoinErrorEvent, { once: true });

      // Attempt to join the game
      onJoinGame(gameCode, playerName);
    }
  };

  // Render the title tiles
  const renderTitleTiles = () => (
    <div className="title-tiles">
      {['A', 'N', 'A', 'G', 'R', 'A', 'B'].map((letter, index) => (
        <div key={index} className={`title-tile ${flippedTiles.has(index) ? 'flipped' : ''}`}>
          <div className="title-tile-inner">
            <div className="title-tile-front"></div>
            <div className="title-tile-back">{letter}</div>
          </div>
        </div>
      ))}
    </div>
  );

  // Initial choice screen
  if (mode === 'choice') {
    return (
      <div className="join-form">
        {renderTitleTiles()}
        <div className="game-options">
          <button onClick={() => setMode('create')}>Create New Game</button>
          <button onClick={() => setMode('join')}>Join Existing Game</button>
        </div>
      </div>
    );
  }

  // Create or join form
  return (
    <div className="join-form">
      {renderTitleTiles()}
      <form onSubmit={handleSubmit}>
        <h2>{mode === 'create' ? 'Create New Game' : 'Join Existing Game'}</h2>

        {mode === 'join' && (
          <div className="form-group">
            <label htmlFor="gameCode">Game Code:</label>
            <input
              id="gameCode"
              type="text"
              value={gameCode}
              onChange={e => {
                setGameCode(e.target.value.toUpperCase());
                // Clear error when user types
                if (error) setError(null);
              }}
              placeholder="GAME CODE"
              maxLength={4}
              style={{ textTransform: 'uppercase', letterSpacing: '0.5em', fontWeight: 'bold' }}
              disabled={isLoading}
            />
            {error && (
              <div
                className="error-message"
                style={{
                  color: 'white',
                  backgroundColor: '#ff5252',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="playerName">Your Name:</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            required
            maxLength={20}
            disabled={isLoading}
          />
          <small
            className="char-counter"
            style={{
              fontSize: '12px',
              color: playerName.length >= 15 ? '#ff5252' : '#888',
              textAlign: 'right',
              display: 'block',
              marginTop: '4px',
            }}
          >
            {playerName.length}/20 characters
          </small>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => setMode('choice')} disabled={isLoading}>
            Back
          </button>
          <button type="submit" disabled={(mode === 'join' && error) || isLoading}>
            {isLoading ? 'Connecting...' : mode === 'create' ? 'Create Game' : 'Join Game'}
          </button>
        </div>
      </form>
    </div>
  );
};
