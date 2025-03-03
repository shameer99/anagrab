import { useState, useEffect } from 'react';

export const WordForm = ({ onClaimWord }) => {
  const [wordInput, setWordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add cleanup effect for submission state
  useEffect(() => {
    let timeoutId;
    if (isSubmitting) {
      // Reduced safety timeout from 6s to 3s
      timeoutId = setTimeout(() => {
        setIsSubmitting(false);
      }, 3000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSubmitting]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (wordInput.trim() && !isSubmitting) {
      try {
        setIsSubmitting(true);
        const success = await onClaimWord(wordInput);
        // Immediately set isSubmitting to false after getting a response
        setIsSubmitting(false);
        if (success) {
          setWordInput('');
        }
      } catch (error) {
        console.error('Error claiming word:', error);
        setIsSubmitting(false);
      }
    }
  };

  const handleClear = e => {
    e.preventDefault(); // Prevent form submission
    setWordInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="word-form">
      <div
        className="input-container"
        style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      >
        <input
          type="text"
          value={wordInput}
          onChange={e => setWordInput(e.target.value)}
          placeholder="Enter word to claim"
          className="word-input"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          disabled={isSubmitting}
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
