import { useState, useEffect } from 'react';

export const GameControls = ({
  onFlipLetter,
  deckCount,
  currentTurn,
  currentPlayer,
  playerToken,
  autoFlipEnabled,
  autoFlipInterval,
}) => {
  const [countdown, setCountdown] = useState(autoFlipInterval);

  useEffect(() => {
    let timer;
    if (autoFlipEnabled) {
      // Reset countdown when interval changes
      setCountdown(autoFlipInterval);

      // Update countdown every second
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            return autoFlipInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoFlipEnabled, autoFlipInterval]);

  const isPlayerTurn = currentTurn === playerToken;
  const canFlip = !autoFlipEnabled && (isPlayerTurn || !currentTurn);

  return (
    <div className="game-controls">
      <div className="turn-info">
        {currentTurn && !autoFlipEnabled && (
          <div className="current-turn">
            Current Turn: <strong>{currentPlayer}</strong>
            {isPlayerTurn && <span className="your-turn"> (Your Turn!)</span>}
          </div>
        )}
        {autoFlipEnabled && (
          <div className="auto-flip-status">
            Auto-Flip: Next flip in <strong>{countdown}</strong> seconds
          </div>
        )}
      </div>

      <div className="buttons">
        <button
          onClick={onFlipLetter}
          className={`bag-button ${canFlip ? '' : 'disabled'}`}
          title={canFlip ? 'Flip Letter' : 'Not your turn'}
          disabled={!canFlip}
        >
          <div className="bag-icon">
            <span role="img" aria-label="banana" className="bag-svg">
              🍌
            </span>
            <span className="bag-count">{deckCount || 0}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
