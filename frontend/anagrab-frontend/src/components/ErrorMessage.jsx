import React, { useEffect, useState } from 'react';
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

export default function ErrorMessage({ data, onDismiss }) {
  const nodeRef = React.useRef(null);
  const [show, setShow] = useState(!!data);

  useEffect(() => {
    setShow(!!data);

    if (data) {
      const timer = setTimeout(() => {
        setShow(false);
        if (onDismiss) onDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [data, onDismiss]);

  const handleClose = () => {
    setShow(false);
    if (onDismiss) onDismiss();
  };

  if (!data) return null;

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={show}
      appear={true}
      timeout={400}
      classNames="error-message"
      unmountOnExit
    >
      <div ref={nodeRef} className="error-message" onClick={handleClose}>
        <div className="error-content">
          <span className="error-icon">❌</span>
          <span className="error-text">
            <MessageContent data={data} />
          </span>
          <span className="error-close">✕</span>
        </div>
        <div className="error-progress">
          <div className="error-progress-bar" />
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
  onDismiss: PropTypes.func,
};
