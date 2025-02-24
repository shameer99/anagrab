import './App.css';
import { useSocket } from './hooks/useSocket';
import { JoinForm } from './components/JoinForm';
import { GameControls } from './components/GameControls';
import { LetterPot } from './components/LetterPot';
import { WordForm } from './components/WordForm';
import { PlayersList } from './components/PlayersList';
import ErrorMessage from './components/ErrorMessage';

function App() {
  const {
    gameState,
    isJoined,
    joinGame,
    startGame,
    flipLetter,
    claimWord,
    endGame,
    error,
    socket,
  } = useSocket();

  if (!isJoined) {
    return <JoinForm onJoin={joinGame} />;
  }

  return (
    <div className="game-container">
      {error && <ErrorMessage error={error} />}
      <GameControls
        onStartGame={startGame}
        onFlipLetter={flipLetter}
        deckCount={gameState?.deck?.length}
      />
      <LetterPot letters={gameState?.pot} />
      <WordForm onClaimWord={claimWord} />
      <PlayersList players={gameState?.players} />
    </div>
  );
}

export default App;
