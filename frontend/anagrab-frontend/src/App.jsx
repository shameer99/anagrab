import './App.css';
import { useSocket } from './hooks/useSocket';
import { JoinForm } from './components/JoinForm';
import { GameControls } from './components/GameControls';
import { WordForm } from './components/WordForm';
import { PlayersList } from './components/PlayersList';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import ConnectionStatus from './components/ConnectionStatus';
import { AlphabetDisplay } from './components/AlphabetDisplay';
import { WordList } from './components/WordList';
import { useEffect, useState } from 'react';

function App() {
  const {
    gameState,
    isJoined,
    createGame,
    joinGame,
    leaveGame,
    startGame,
    flipLetter,
    claimWord,
    endGame,
    errorData,
    successData,
    currentPlayer,
    currentGameId,
    connectionState,
    pingLatency,
    socket,
  } = useSocket();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [stealingPhase, setStealingPhase] = useState(false);
  const [stealingTimeLeft, setStealingTimeLeft] = useState(60);
  const [winner, setWinner] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Add a window resize listener to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // PWA installation event handlers
  useEffect(() => {
    // Check if the app is already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsAppInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = e => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt to the user
      setShowInstallPrompt(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      // Hide the install prompt
      setShowInstallPrompt(false);
      // Set the app as installed
      setIsAppInstalled(true);
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      // Log the installation
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Function to install the PWA
  const installPWA = () => {
    if (!deferredPrompt) {
      console.log('Cannot install PWA: No installation prompt available');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      // Clear the deferredPrompt variable as it can only be used once
      setDeferredPrompt(null);
      // Hide the install prompt
      setShowInstallPrompt(false);
    });
  };

  // Function to dismiss the install prompt
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  // Reset copy success message after a delay
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Add meta viewport tag to prevent zooming on mobile
  useEffect(() => {
    // Check if there's an existing viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');

    if (!viewportMeta) {
      // Create a new viewport meta tag if it doesn't exist
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }

    // Set the content attribute to prevent zooming
    viewportMeta.content =
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    // Cleanup function (optional)
    return () => {
      // If you want to restore zooming when component unmounts
      if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0';
      }
    };
  }, []);

  // Monitor deck size and trigger stealing phase
  useEffect(() => {
    if (gameState?.deck?.length === 0 && !stealingPhase && !showWinnerModal) {
      setStealingPhase(true);
      setStealingTimeLeft(60);
    }
  }, [gameState?.deck?.length]);

  // Countdown timer for stealing phase
  useEffect(() => {
    let timer;
    if (stealingPhase && stealingTimeLeft > 0) {
      timer = setInterval(() => {
        setStealingTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (stealingPhase && stealingTimeLeft === 0) {
      // When stealing phase ends, calculate winner(s)
      const players = gameState?.players || {};
      const playerScores = Object.entries(players).map(([id, player]) => ({
        id,
        name: player.name,
        score: player.words.reduce((total, word) => total + word.length, 0),
      }));

      // Find highest score
      const highestScore = Math.max(...playerScores.map(player => player.score));

      // Find all players with the highest score (handles ties)
      const winners = playerScores.filter(player => player.score === highestScore);

      setWinner(winners);
      setShowWinnerModal(true);
      setStealingPhase(false);
    }
    return () => clearInterval(timer);
  }, [stealingPhase, stealingTimeLeft, gameState?.players]);

  // Reset states when game restarts
  useEffect(() => {
    if (gameState?.deck?.length > 0) {
      setStealingPhase(false);
      setStealingTimeLeft(60);
      setShowWinnerModal(false);
      setWinner(null);
    }
  }, [gameState?.deck?.length]);

  const handleShareGame = () => {
    // Always show the modal first
    setShowShareModal(true);
  };

  const copyGameLink = () => {
    const url = `${window.location.origin}?gameCode=${currentGameId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopySuccess(true);
        // Don't close the modal so user can see the success message
      })
      .catch(err => {
        console.error('Failed to copy link: ', err);
      });
  };

  // Function to handle native sharing
  const shareGameNative = () => {
    const shareData = {
      title: 'Join my Anagrab game!',
      text: `Join my game with code: ${currentGameId}`,
      url: `${window.location.origin}?gameCode=${currentGameId}`,
    };

    if (navigator.canShare(shareData)) {
      navigator
        .share(shareData)
        .then(() => {
          console.log('Game shared successfully');
          setShowShareModal(false);
        })
        .catch(error => {
          // Only log the error, don't close the modal
          // This allows users to try again or use the copy link option
          console.error('Error sharing game:', error);
        });
    }
  };

  const handleLeaveGame = () => {
    setShowLeaveConfirmModal(true);
  };

  const confirmLeaveGame = () => {
    leaveGame();
    setShowLeaveConfirmModal(false);
  };

  const handleRestartGame = () => {
    setShowRestartConfirmModal(true);
  };

  const confirmRestartGame = () => {
    startGame();
    setShowRestartConfirmModal(false);
  };

  if (!isJoined) {
    return (
      <>
        {showInstallPrompt && isMobile && !isAppInstalled && (
          <div className="install-prompt">
            <div className="install-prompt-content">
              <h3>Install Anagrab</h3>
              <p>Install this app on your device for a better experience!</p>
              <div className="install-prompt-buttons">
                <button onClick={installPWA} className="install-btn">
                  Install
                </button>
                <button onClick={dismissInstallPrompt} className="dismiss-btn">
                  Not Now
                </button>
              </div>
            </div>
          </div>
        )}
        <JoinForm onCreateGame={createGame} onJoinGame={joinGame} />
      </>
    );
  }

  // Split players into current and others
  const players = gameState?.players || {};
  const [currentPlayerEntry, otherPlayers] = Object.entries(players).reduce(
    ([current, others], [id, player]) => {
      const isCurrentPlayer = currentPlayer?.id
        ? id === currentPlayer.id
        : player.name === currentPlayer?.name;
      return isCurrentPlayer ? [[id, player], others] : [current, [...others, [id, player]]];
    },
    [null, []]
  );

  return (
    <div className="game-container">
      {showInstallPrompt && isMobile && !isAppInstalled && (
        <div className="install-prompt">
          <div className="install-prompt-content">
            <h3>Install Anagrab</h3>
            <p>Install this app on your device for a better experience!</p>
            <div className="install-prompt-buttons">
              <button onClick={installPWA} className="install-btn">
                Install
              </button>
              <button onClick={dismissInstallPrompt} className="dismiss-btn">
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
      <ConnectionStatus state={connectionState} ping={pingLatency} />
      {errorData && <ErrorMessage data={errorData} onDismiss={() => socket.emit('clear_error')} />}
      {successData && (
        <SuccessMessage data={successData} onDismiss={() => socket.emit('clear_success')} />
      )}

      {/* Stealing Phase Banner */}
      {stealingPhase && (
        <div className="stealing-phase-banner">
          <h3>Stealing Phase!</h3>
          <p>Time remaining: {stealingTimeLeft} seconds</p>
        </div>
      )}

      <div className="game-header">
        <h2>Game Code: {currentGameId || 'Unknown'}</h2>
        <div className="game-header-buttons">
          <button className="start-game-btn" onClick={handleRestartGame}>
            Restart Game
          </button>
          <button className="share-game-btn" onClick={handleShareGame}>
            Share Game
          </button>
          <button className="leave-game-btn" onClick={handleLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>

      <GameControls
        onFlipLetter={flipLetter}
        onEndGame={endGame}
        deckCount={Array.isArray(gameState?.deck) ? gameState.deck.length : gameState?.deck}
        gameState={gameState}
      />

      {/* Alphabet display for all 26 letters */}
      <AlphabetDisplay letters={gameState?.pot || []} />

      {/* Game board with word form only */}
      <div className="game-board">
        <WordForm onClaimWord={claimWord} />
      </div>

      {/* Responsive layout: Show WordList on mobile, traditional layout on desktop */}
      {isMobile ? (
        <WordList players={players} currentPlayer={currentPlayer} />
      ) : (
        <>
          {/* Other players at the top */}
          {otherPlayers.length > 0 && (
            <div className="other-players">
              {otherPlayers.map(([id, player]) => (
                <div key={id} className="player">
                  <h3>
                    {player.name}
                    {'   '}
                    <span
                      style={{
                        backgroundColor: 'red',
                        color: 'white',
                        padding: '0 5px',
                        borderRadius: 15,
                      }}
                    >
                      {player.words.reduce((total, word) => total + word.length, 0)}
                    </span>
                  </h3>
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
          )}

          {/* Current player at the bottom */}
          {currentPlayerEntry && (
            <div className="your-player">
              <div className="player">
                <h3>
                  {currentPlayerEntry[1].name}
                  {'   '}
                  <span
                    style={{
                      backgroundColor: 'red',
                      color: 'white',
                      padding: '0 5px',
                      borderRadius: 15,
                    }}
                  >
                    {currentPlayerEntry[1].words.reduce((total, word) => total + word.length, 0)}
                  </span>
                </h3>
                <div className="words">
                  {currentPlayerEntry[1].words.map((word, index) => (
                    <span key={index} className="word">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Winner Display Modal */}
      {showWinnerModal && winner && (
        <div className="modal-overlay">
          <div className="modal-content winner-modal">
            <button className="modal-close" onClick={() => setShowWinnerModal(false)}>
              ×
            </button>
            <h2>Game Over!</h2>
            <div className="winner-content">
              {winner.length === 1 ? (
                <>
                  <h3>Winner: {winner[0].name}</h3>
                  <p className="winner-score">{winner[0].score} points</p>
                </>
              ) : (
                <>
                  <h3>It's a Tie!</h3>
                  <div className="winners-list">
                    {winner.map((w, index) => (
                      <div key={w.id} className="winner-item">
                        <p className="winner-name">{w.name}</p>
                        <p className="winner-score">{w.score} points</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leave Game Confirmation Modal */}
      {showLeaveConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Leave Game?</h2>
            <p>Are you sure you want to leave the game? This action cannot be undone.</p>

            <div className="modal-buttons">
              <button className="confirm-button" onClick={confirmLeaveGame}>
                Yes, Leave Game
              </button>
              <button className="cancel-button" onClick={() => setShowLeaveConfirmModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart Game Confirmation Modal */}
      {showRestartConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Restart Game?</h2>
            <p>Are you sure you want to restart the game? All current progress will be lost.</p>

            <div className="modal-buttons">
              <button className="confirm-button" onClick={confirmRestartGame}>
                Yes, Restart Game
              </button>
              <button className="cancel-button" onClick={() => setShowRestartConfirmModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Game Modal */}
      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Share Game</h2>
            <p>
              Invite friends to join your game with code: <strong>{currentGameId}</strong>
            </p>

            <div className="share-buttons">
              {navigator.share && (
                <button className="share-button native-share" onClick={shareGameNative}>
                  Share via Device
                </button>
              )}

              <button className="share-button copy-link" onClick={copyGameLink}>
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <button className="close-modal" onClick={() => setShowShareModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
