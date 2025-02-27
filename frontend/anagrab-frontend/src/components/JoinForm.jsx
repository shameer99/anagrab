import { useState } from 'react';

export const JoinForm = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [flippedTiles, setFlippedTiles] = useState(new Set());

  const handleTileClick = index => {
    setFlippedTiles(prev => {
      const newFlipped = new Set(prev);
      newFlipped.add(index);
      return newFlipped;
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    onJoin(playerName);
  };

  return (
    <div className="join-form">
      <div className="title-tiles">
        {['A', 'N', 'A', 'G', 'R', 'A', 'B'].map((letter, index) => (
          <div
            key={index}
            className={`title-tile ${flippedTiles.has(index) ? 'flipped' : ''}`}
            onClick={() => handleTileClick(index)}
          >
            <div className="title-tile-inner">
              <div className="title-tile-front"></div>
              <div className="title-tile-back">{letter}</div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          placeholder="Enter your name"
        />
        <button type="submit">Join Game</button>
      </form>
    </div>
  );
};
