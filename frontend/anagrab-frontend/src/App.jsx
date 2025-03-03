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

  // Add a window resize listener to detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (!isJoined) {
    return <JoinForm onCreateGame={createGame} onJoinGame={joinGame} />;
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
      <ConnectionStatus state={connectionState} ping={pingLatency} />
      {errorData && <ErrorMessage data={errorData} />}
      {successData && <SuccessMessage data={successData} />}

      <div className="game-header">
        <h2>Game: {currentGameId || 'Unknown'}</h2>
        <button className="leave-game-btn" onClick={leaveGame}>
          Leave Game
        </button>
      </div>

      <GameControls
        onStartGame={startGame}
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
        <WordList players={players} />
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
    </div>
  );
}

export default App;
