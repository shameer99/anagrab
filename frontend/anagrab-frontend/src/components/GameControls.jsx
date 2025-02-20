export const GameControls = ({ onStartGame, onFlipLetter }) => {
  return (
    <div className="game-controls">
      <button onClick={onStartGame}>Start New Game</button>
      <button onClick={onFlipLetter}>Flip Letter</button>
    </div>
  );
}; 