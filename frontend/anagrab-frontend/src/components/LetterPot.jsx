export const LetterPot = ({ letters }) => {
  return (
    <div className="pot">
      <h2>Letters in Play:</h2>
      <div className="letters">
        {letters?.map((letter, index) => (
          <span key={index} className="letter">
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};
