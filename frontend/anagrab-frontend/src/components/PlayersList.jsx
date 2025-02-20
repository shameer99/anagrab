export const PlayersList = ({ players }) => {
  return (
    <div className="players">
      {Object.entries(players || {}).map(([id, player]) => (
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
      ))}
    </div>
  );
};
