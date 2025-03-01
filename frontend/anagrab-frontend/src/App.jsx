import './App.css';
import { useSocket } from './hooks/useSocket';
import { JoinForm } from './components/JoinForm';
import { GameControls } from './components/GameControls';
import { LetterPot } from './components/LetterPot';
import { WordForm } from './components/WordForm';
import { PlayersList } from './components/PlayersList';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import ConnectionStatus from './components/ConnectionStatus';

function App() {
  const {
    gameState,
    isJoined,
    joinGame,
    startGame,
    flipLetter,
    claimWord,
    getCurrentPlayer,
    endGame,
    errorData,
    successData,
    currentPlayer,
    connectionState,
    pingLatency,
    socket,
  } = useSocket();

  if (!isJoined) {
    return <JoinForm onJoin={joinGame} />;
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

  const playerTurn =
    gameState?.players[gameState?.playerOrder[gameState.turn % gameState.playerOrder.length]].name;

  return (
    <div className="game-container">
      <ConnectionStatus state={connectionState} ping={pingLatency} />
      {errorData && <ErrorMessage data={errorData} />}
      {successData && <SuccessMessage data={successData} />}
      <GameControls
        onStartGame={startGame}
        onFlipLetter={flipLetter}
        onEndGame={endGame}
        deckCount={gameState?.deck?.length}
        gameState={gameState}
      />

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
                    padding: '0 5px', // Adds some padding to make the background color visible around the text
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

      {/* Letters in play */}
      <div className="game-board">
        <LetterPot letters={gameState?.pot || []} />
        <WordForm onClaimWord={claimWord} />
        <h3>Current Player: {playerTurn}</h3>
      </div>

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
                  padding: '0 5px', // Adds some padding to make the background color visible around the text
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
    </div>
  );
}

export default App;
