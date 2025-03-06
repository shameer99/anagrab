import { useState, useEffect } from 'react';

export const GameSettings = ({ gameState, onAutoFlipChange, onRestartGame, onLeaveGame }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [autoFlipEnabled, setAutoFlipEnabled] = useState(
    gameState?.settings?.autoFlip?.enabled ?? true
  );
  const [autoFlipTimeout, setAutoFlipTimeout] = useState(
    gameState?.settings?.autoFlip?.timeoutSeconds ?? 15
  );

  // Update local state when game state changes
  useEffect(() => {
    if (gameState?.settings?.autoFlip) {
      setAutoFlipEnabled(gameState.settings.autoFlip.enabled);
      setAutoFlipTimeout(gameState.settings.autoFlip.timeoutSeconds);
    }
  }, [gameState?.settings?.autoFlip]);

  const handleAutoFlipToggle = () => {
    const newEnabled = !autoFlipEnabled;
    setAutoFlipEnabled(newEnabled);
    onAutoFlipChange(newEnabled, autoFlipTimeout);
  };

  const handleTimeoutChange = e => {
    const value = Math.max(5, Math.min(120, parseInt(e.target.value) || 5));
    setAutoFlipTimeout(value);
    onAutoFlipChange(autoFlipEnabled, value);
  };

  return (
    <>
      <button className="settings-button" onClick={() => setIsOpen(true)}>
        ⚙️ Game Settings
      </button>

      {isOpen && (
        <div className="settings-modal-overlay">
          <div className="settings-modal">
            <h2>Game Settings</h2>

            <div className="settings-section">
              <h3>Auto-Flip Settings</h3>
              <div className="auto-flip-settings">
                <label>
                  <input
                    type="checkbox"
                    checked={autoFlipEnabled}
                    onChange={handleAutoFlipToggle}
                  />
                  Enable Auto-flip
                </label>
                <div className="timeout-setting">
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={autoFlipTimeout}
                    onChange={handleTimeoutChange}
                    disabled={!autoFlipEnabled}
                  />
                  <span>seconds</span>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Game Controls</h3>
              <div className="game-controls-buttons">
                <button onClick={onRestartGame}>Restart Game</button>
                <button onClick={onLeaveGame}>Leave Game</button>
              </div>
            </div>

            <button className="close-button" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
