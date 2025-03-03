export const GameControls = ({ onFlipLetter, deckCount }) => {
  return (
    <div className="game-controls">
      <div className="buttons">
        <button onClick={onFlipLetter} className="bag-button" title="Flip Letter">
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
