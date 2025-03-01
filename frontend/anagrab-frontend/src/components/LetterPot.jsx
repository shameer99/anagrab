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
      {letters?.length === 0 && <div className="empty-pot">No letters in play yet</div>}
    </div>
  );
};
