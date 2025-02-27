import React from 'react';
import '../styles/ConnectionStatus.css';

const ConnectionStatus = ({ state, ping }) => {
  // Determine color based on connection state
  let statusColor = 'yellow'; // Default to yellow for connecting

  if (state === 'connected') {
    statusColor = 'green';
  } else if (state === 'disconnected' || state === 'error') {
    statusColor = 'red';
  }

  return (
    <div className="connection-status">
      <div className={`status-indicator ${statusColor}`}></div>
      {ping !== null && <span className="ping-value">{ping}ms</span>}
    </div>
  );
};

export default ConnectionStatus;
