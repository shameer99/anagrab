import React from 'react';
import { CSSTransition } from 'react-transition-group';
import './SuccessMessage.css';
import PropTypes from 'prop-types';

function MessageContent({ data }) {
  if (data.type === 'pot_claim') {
    return (
      <>
        <em>{data.player}</em> claimed <strong>"{data.word}"</strong> from the pot!
      </>
    );
  }

  if (data.type === 'steal') {
    return (
      <>
        <em>{data.player}</em> stole <strong>"{data.word}"</strong> by using{' '}
        <strong>"{data.originalWord}"</strong> from <em>{data.stolenFrom}</em>!
      </>
    );
  }

  if (data.type === 'self_modify') {
    return (
      <>
        <em>{data.player}</em> modified <strong>"{data.originalWord}"</strong> into{' '}
        <strong>"{data.word}"</strong>!
      </>
    );
  }

  return null;
}

MessageContent.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.oneOf(['pot_claim', 'steal', 'self_modify']).isRequired,
    player: PropTypes.string.isRequired,
    word: PropTypes.string.isRequired,
    originalWord: PropTypes.string,
    stolenFrom: PropTypes.string,
  }).isRequired,
};

export default function SuccessMessage({ data }) {
  const nodeRef = React.useRef(null);

  if (!data) return null;

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={!!data}
      appear={true}
      timeout={300}
      classNames="success-message"
      unmountOnExit
    >
      <div ref={nodeRef} className="success-message">
        <div className="success-content">
          <span className="success-icon">✨</span>
          <span className="success-text">
            <MessageContent data={data} />
          </span>
        </div>
      </div>
    </CSSTransition>
  );
}

SuccessMessage.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.oneOf(['pot_claim', 'steal', 'self_modify']).isRequired,
    player: PropTypes.string.isRequired,
    word: PropTypes.string.isRequired,
    originalWord: PropTypes.string,
    stolenFrom: PropTypes.string,
  }),
};
