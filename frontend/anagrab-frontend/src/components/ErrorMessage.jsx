import React from 'react';
import { CSSTransition } from 'react-transition-group';
import './ErrorMessage.css';
import PropTypes from 'prop-types';

export default function ErrorMessage({ error }) {
  const nodeRef = React.useRef(null);

  if (!error) return null;

  return (
    <CSSTransition
      nodeRef={nodeRef}
      in={!!error}
      appear={true}
      timeout={300}
      classNames="error-message"
      unmountOnExit
    >
      <div ref={nodeRef} className="error-message">
        <div className="error-content">
          <span className="error-icon">❌</span>
          <span className="error-text">{error}</span>
        </div>
      </div>
    </CSSTransition>
  );
}

ErrorMessage.propTypes = {
  error: PropTypes.string,
};
