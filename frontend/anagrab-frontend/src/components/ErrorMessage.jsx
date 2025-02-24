import React from 'react';
import { CSSTransition } from 'react-transition-group';
import './ErrorMessage.css';
import PropTypes from 'prop-types';

function MessageContent({ data }) {
  if (data.type === 'claim_failed') {
    return (
      <>
        Failed to claim <strong>"{data.word}"</strong>: {data.reason}
      </>
    );
  }

  return null;
}

MessageContent.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.oneOf(['claim_failed']).isRequired,
    word: PropTypes.string.isRequired,
    reason: PropTypes.string.isRequired,
  }).isRequired,
};

export default function ErrorMessage({ data }) {
  const nodeRef = React.useRef(null);

  if (!data) return null;

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={!!data}
      appear={true}
      timeout={300}
      classNames="error-message"
      unmountOnExit
    >
      <div ref={nodeRef} className="error-message">
        <div className="error-content">
          <span className="error-icon">❌</span>
          <span className="error-text">
            <MessageContent data={data} />
          </span>
        </div>
      </div>
    </CSSTransition>
  );
}

ErrorMessage.propTypes = {
  data: PropTypes.shape({
    type: PropTypes.oneOf(['claim_failed']).isRequired,
    word: PropTypes.string.isRequired,
    reason: PropTypes.string.isRequired,
  }),
};
