import { useEffect, useState } from 'react'
import './App.css'
import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_BACKEND_URL)

function App() {
  const [playerName, setPlayerName] = useState('')
  const [gameState, setGameState] = useState(null)
  const [wordInput, setWordInput] = useState('')
  const [isJoined, setIsJoined] = useState(false)

  useEffect(() => {
    socket.on('game_state_update', (newState) => {
      setGameState(newState)
    })

    return () => {
      socket.off('game_state_update')
    }
  }, [])

  const handleJoinGame = (e) => {
    e.preventDefault()
    if (playerName.trim()) {
      socket.emit('join_game', playerName)
      setIsJoined(true)
    }
  }

  const handleStartGame = () => {
    socket.emit('start_game')
  }

  const handleFlipLetter = () => {
    socket.emit('flip_letter')
  }

  const handleClaimWord = (e) => {
    e.preventDefault()
    if (wordInput.trim()) {
      socket.emit('claim_word', wordInput.toUpperCase())
      setWordInput('')
    }
  }

  const handleEndGame = () => {
    socket.emit('end_game')
  }

  if (!isJoined) {
    return (
      <div className="join-form">
        <form onSubmit={handleJoinGame}>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
          />
          <button type="submit">Join Game</button>
        </form>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="game-controls">
        <button onClick={handleStartGame}>Start New Game</button>
        <button onClick={handleFlipLetter}>Flip Letter</button>
        <button onClick={handleEndGame}>End Game</button>
      </div>

      <div className="pot">
        <h2>Letters in Play:</h2>
        <div className="letters">
          {gameState?.pot.map((letter, index) => (
            <span key={index} className="letter">{letter}</span>
          ))}
        </div>
      </div>

      <form onSubmit={handleClaimWord} className="word-form">
        <input
          type="text"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          placeholder="Enter word to claim"
        />
        <button type="submit">Claim Word</button>
      </form>

      <div className="players">
        {Object.entries(gameState?.players || {}).map(([id, player]) => (
          <div key={id} className="player">
            <h3>{player.name}</h3>
            <div className="words">
              {player.words.map((word, index) => (
                <span key={index} className="word">{word}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
