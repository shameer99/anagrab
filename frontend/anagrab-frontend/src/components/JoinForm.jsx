import { useState } from 'react';

export const JoinForm = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin(playerName);
  };

  return (
    <div className="join-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
        />
        <button type="submit">Join Game</button>
      </form>
    </div>
  );
}; 