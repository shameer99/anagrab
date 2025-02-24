export const PlayersList = ({ players, currentPlayer }) => {
  console.log('[PlayersList] Rendering with:', {
    players,
    currentPlayer,
    playerCount: players ? Object.keys(players).length : 0,
  });

  if (!players) return null;

  // Separate current player and other players
  const playerEntries = Object.entries(players);
  const [currentPlayerEntry, otherPlayers] = playerEntries.reduce(
    ([current, others], [id, player]) => {
      const isCurrentPlayer = currentPlayer?.id
        ? id === currentPlayer.id
        : player.name === currentPlayer?.name;

      return isCurrentPlayer ? [[id, player], others] : [current, [...others, [id, player]]];
    },
    [null, []]
  );

  const renderPlayer = ([id, player]) => (
    <div key={id} className="player">
      <h3>{player.name}</h3>
      <div className="words">
        {player.words.map((word, index) => (
          <span key={index} className="word">
            {word}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="players-container">
      <div className="your-player">{currentPlayerEntry && renderPlayer(currentPlayerEntry)}</div>
      {otherPlayers.length > 0 && (
        <div className="other-players">{otherPlayers.map(renderPlayer)}</div>
      )}
    </div>
  );
};
