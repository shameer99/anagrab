export const GameControls = ({ onStartGame, onFlipLetter, deckCount }) => {
  return (
    <div className="game-controls">
      <div className="buttons">
        <button onClick={onStartGame}>Start New Game</button>

        <button onClick={onFlipLetter} className="bag-button" title="Flip Letter">
          <div className="bag-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="bag-svg"
            >
              <path d="M4 4c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v2H4V4zm2 6V6h12v4H6zm-2 0h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z" />
            </svg>
            <span className="bag-count">{deckCount || 0}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
