import { useState } from 'react';
import { motion } from 'framer-motion';

const JoinScreen = ({ onJoin }) => {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.length > 15) {
      setError('Name must be 15 characters or less');
      return;
    }

    onJoin(playerName);
  };

  return (
    <motion.div
      className="game-card w-full max-w-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary-900">Anagrab</h1>
        <p className="text-slate-600 mt-2">Form words from the shared letter pool!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="playerName" className="block text-sm font-medium text-slate-700 mb-1">
            Enter Your Name
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={e => {
              setPlayerName(e.target.value);
              setError('');
            }}
            className="input-primary"
            placeholder="Your name"
            maxLength={15}
            autoFocus
          />
          {error && <p className="text-error-600 text-sm mt-1">{error}</p>}
        </div>

        <button type="submit" className="button-primary w-full">
          Join Game
        </button>
      </form>

      <div className="mt-8 text-sm text-slate-500">
        <h3 className="font-medium text-slate-700 mb-2">How to Play:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Start a new game or join an existing one</li>
          <li>Flip letters from the deck to the playing field</li>
          <li>Form words using the available letters</li>
          <li>Claim words faster than other players</li>
          <li>The player with the most words wins!</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default JoinScreen;
