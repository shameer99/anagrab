import { useState, useEffect } from 'react';

export const JoinForm = ({ onCreateGame, onJoinGame }) => {
  const [mode, setMode] = useState('choice'); // 'choice', 'create', or 'join'
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [flippedTiles, setFlippedTiles] = useState(new Set());

  // Check URL for game code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get('game');
    if (gameParam) {
      setGameCode(gameParam);
      setMode('join');
    }
  }, []);

  const handleSubmit = e => {
    e.preventDefault();
    if (mode === 'create') {
      // No need for callback since component will unmount
      onCreateGame(playerName);
    } else if (mode === 'join') {
      onJoinGame(gameCode, playerName);
    }
  };

  useEffect(() => {
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
      ); // 500ms delay between each flip
    });
  }, []); // Run once on component mount

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
              onChange={e => setGameCode(e.target.value.toUpperCase())}
              placeholder="GAME CODE"
              maxLength={4}
              style={{ textTransform: 'uppercase', letterSpacing: '0.5em', fontWeight: 'bold' }}
            />
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
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => setMode('choice')}>
            Back
          </button>
          <button type="submit">{mode === 'create' ? 'Create Game' : 'Join Game'}</button>
        </div>
      </form>
    </div>
  );
};
