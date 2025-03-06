export const GameControls = ({ onFlipLetter, deckCount, gameState, currentPlayer }) => {
  // Get the current turn player's name
  const currentTurnPlayerToken = gameState?.playerOrder?.[gameState?.currentTurnIndex];
  const currentTurnPlayer = gameState?.players?.[currentTurnPlayerToken];
  const isCurrentPlayerTurn = currentTurnPlayerToken === currentPlayer?.id;

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
