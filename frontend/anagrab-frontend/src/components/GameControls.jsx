import { useState, useEffect } from 'react';

export const GameControls = ({ onFlipLetter, deckCount, gameState, currentPlayer, socket }) => {
  const [timeUntilFlip, setTimeUntilFlip] = useState(null);

  // Get the current turn player's name
  const currentTurnPlayerToken = gameState?.playerOrder?.[gameState?.currentTurnIndex];
  const currentTurnPlayer = gameState?.players?.[currentTurnPlayerToken];
  const isCurrentPlayerTurn = currentTurnPlayerToken === currentPlayer?.id;

  // Handle countdown timer
  useEffect(() => {
    let timer;
    if (gameState?.nextAutoFlipTime && gameState?.settings?.autoFlip?.enabled) {
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((gameState.nextAutoFlipTime - now) / 1000));
        setTimeUntilFlip(remaining);
      };

      updateTimer();
      timer = setInterval(updateTimer, 100);
    } else {
      setTimeUntilFlip(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState?.nextAutoFlipTime, gameState?.settings?.autoFlip?.enabled]);

  return (
    <div className="game-controls">
      <div className="turn-indicator">
        {currentTurnPlayer ? (
          <p className={`turn-status ${isCurrentPlayerTurn ? 'your-turn' : ''}`}>
            {isCurrentPlayerTurn
              ? 'Your turn to flip!'
              : `${currentTurnPlayer.name}'s turn to flip`}
          </p>
        ) : null}
        {timeUntilFlip !== null && gameState?.settings?.autoFlip?.enabled && (
          <p className="auto-flip-countdown">Auto-flip in: {timeUntilFlip}s</p>
        )}
      </div>
      <div className="buttons">
        <button
          onClick={onFlipLetter}
          className={`bag-button ${!isCurrentPlayerTurn ? 'disabled' : ''}`}
          title={isCurrentPlayerTurn ? 'Flip Letter' : 'Wait for your turn'}
          disabled={!isCurrentPlayerTurn}
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
