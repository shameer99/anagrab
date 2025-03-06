import React, { useState, useEffect } from 'react';

export const GameControls = ({
  onFlipLetter,
  onEndGame,
  deckCount,
  gameState,
  isHost,
  currentTurn,
  currentPlayer,
  playerToken,
  autoFlipEnabled,
  autoFlipInterval,
}) => {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    let timer;
    if (autoFlipEnabled && gameState?.nextFlipTime) {
      const updateCountdown = () => {
        const remaining = Math.ceil((gameState.nextFlipTime - Date.now()) / 1000);
        setCountdown(remaining > 0 ? remaining : 0);
      };

      // Update immediately and then every second
      updateCountdown();
      timer = setInterval(updateCountdown, 1000);
    } else {
      setCountdown(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoFlipEnabled, gameState?.nextFlipTime]);

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
            Auto-Flip: Next flip in <strong>{countdown !== null ? countdown : '...'}</strong>{' '}
            seconds
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
