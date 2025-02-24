import './App.css';
import { useSocket } from './hooks/useSocket';
import { JoinForm } from './components/JoinForm';
import { GameControls } from './components/GameControls';
import { LetterPot } from './components/LetterPot';
import { WordForm } from './components/WordForm';
import { PlayersList } from './components/PlayersList';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';

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
    socket,
  } = useSocket();

  if (!isJoined) {
    return <JoinForm onJoin={joinGame} />;
  }

  return (
    <div className="game-container">
      {errorData && <ErrorMessage data={errorData} />}
      {successData && <SuccessMessage data={successData} />}
      <GameControls
        onStartGame={startGame}
        onFlipLetter={flipLetter}
        onEndGame={endGame}
        deckCount={gameState?.deck?.length}
        gameState={gameState}
      />
      <LetterPot letters={gameState?.pot} />
      <WordForm onClaimWord={claimWord} />
      <PlayersList players={gameState?.players} />
    </div>
  );
}

export default App;
