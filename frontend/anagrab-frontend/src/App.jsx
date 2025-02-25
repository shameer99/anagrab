import { useSocket } from './hooks/useSocket';
import { useState } from 'react';
import JoinScreen from './components/JoinScreen';
import GameBoard from './components/GameBoard';
import PlayerSection from './components/PlayerSection';
import GameControls from './components/GameControls';
import Notification from './components/Notification';
import LoadingOverlay from './components/LoadingOverlay';

function App() {
  const {
    gameState,
    isJoined,
    joinGame,
    startGame,
    flipLetter,
    claimWord,
    endGame,
    errorData,
    successData,
    currentPlayer,
    isLoading,
  } = useSocket();

  const [animateNewLetter, setAnimateNewLetter] = useState(false);

  // Handle flip letter with animation trigger
  const handleFlipLetter = () => {
    flipLetter();
    setAnimateNewLetter(true);
    setTimeout(() => setAnimateNewLetter(false), 500);
  };

  // If not joined, show join screen
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <JoinScreen onJoin={joinGame} />
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-2 py-3 sm:px-4 sm:py-6 md:py-8">
      {/* Notifications */}
      {errorData && <Notification type="error" message={errorData.message} />}
      {successData && <Notification type="success" message={successData.message} />}

      {/* Loading overlay */}
      {isLoading && <LoadingOverlay />}

      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:gap-4 md:gap-6">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-900">Anagrab</h1>
          <p className="text-primary-700 mt-0.5 sm:mt-1 text-sm sm:text-base">Word Game</p>
        </header>

        {/* Game Controls */}
        <GameControls
          onStartGame={startGame}
          onFlipLetter={handleFlipLetter}
          onEndGame={endGame}
          deckCount={gameState?.deck?.length || 0}
          hasGameStarted={gameState?.gameInProgress || false}
        />

        {/* Game Board */}
        <GameBoard
          letters={gameState?.pot || []}
          onClaimWord={claimWord}
          animateNewLetter={animateNewLetter}
          isGameInProgress={gameState?.gameInProgress || false}
        />

        {/* Current Player */}
        {currentPlayerEntry && (
          <PlayerSection player={currentPlayerEntry[1]} isCurrentPlayer={true} />
        )}

        {/* Other Players */}
        {otherPlayers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {otherPlayers.map(([id, player]) => (
              <PlayerSection key={id} player={player} isOpponent={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
