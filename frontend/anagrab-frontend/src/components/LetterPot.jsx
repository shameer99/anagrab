export const LetterPot = ({ letters }) => {
  return (
    <div className="pot">
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
