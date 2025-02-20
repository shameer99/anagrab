export const GameControls = ({ onStartGame, onFlipLetter, onEndGame }) => {
  return (
    <div className="game-controls">
      <button onClick={onStartGame}>Start New Game</button>
      <button onClick={onFlipLetter}>Flip Letter</button>
      <button onClick={onEndGame}>End Game</button>
    </div>
  );
}; 