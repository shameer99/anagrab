import { useState, useRef } from 'react';

export const WordForm = ({ onClaimWord }) => {
  const [wordInput, setWordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (wordInput.trim() && !isSubmitting) {
      setIsSubmitting(true);
      const success = await onClaimWord(wordInput);
      setIsSubmitting(false);
      if (success) {
        setWordInput('');
      }
      inputRef.current?.focus();
    }
  };

  const handleClear = e => {
    e.preventDefault(); // Prevent form submission
    setWordInput('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="word-form">
      <div
        className="input-container"
        style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={wordInput}
          onChange={e => setWordInput(e.target.value)}
          placeholder="Enter word to claim"
          className="word-input"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          disabled={isSubmitting}
          autoFocus
        />
        {wordInput && !isSubmitting && (
          <button
            type="button"
            onClick={handleClear}
            className="clear-button"
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Clear input"
          >
            ×
          </button>
        )}
      </div>
      <button type="submit" className="claim-button" disabled={isSubmitting}>
        {isSubmitting ? 'Claiming...' : 'Claim Word'}
      </button>
    </form>
  );
};
