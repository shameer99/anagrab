import './App.css';
import { useSocket } from './hooks/useSocket';
import { JoinForm } from './components/JoinForm';
import { GameControls } from './components/GameControls';
import { LetterPot } from './components/LetterPot';
import { WordForm } from './components/WordForm';
import { PlayersList } from './components/PlayersList';

function App() {
  const {
    gameState,
    isJoined,
    joinGame,
    startGame,
    flipLetter,
    claimWord,
    endGame,
  } = useSocket();

  if (!isJoined) {
    return <JoinForm onJoin={joinGame} />;
  }

  return (
    <div className="game-container">
      <GameControls
        onStartGame={startGame}
        onFlipLetter={flipLetter}
      />
      <LetterPot letters={gameState?.pot} />
      <WordForm onClaimWord={claimWord} />
      <PlayersList players={gameState?.players} />
    </div>
  );
}

export default App;
