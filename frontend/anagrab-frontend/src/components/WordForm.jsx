import { useState } from 'react';

export const WordForm = ({ onClaimWord }) => {
  const [wordInput, setWordInput] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    if (wordInput.trim()) {
      onClaimWord(wordInput);
      setWordInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="word-form">
      <input
        type="text"
        value={wordInput}
        onChange={e => setWordInput(e.target.value)}
        placeholder="Enter word to claim"
      />
      <button type="submit">Claim Word</button>
    </form>
  );
};
