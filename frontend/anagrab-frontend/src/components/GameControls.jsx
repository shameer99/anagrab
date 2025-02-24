export const GameControls = ({ onStartGame, onFlipLetter, deckCount }) => {
  return (
    <div className="game-controls">
      <div className="buttons">
        <button onClick={onStartGame}>Start New Game</button>
        <button onClick={onFlipLetter}>Flip Letter</button>
      </div>
      <div className="deck-count">Letters remaining: {deckCount || 0}</div>
    </div>
  );
};
