import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { io } from 'socket.io-client'

const socket = io('http://localhost:5001')

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Listen for counter updates from the server
    socket.on('counter_update', (newCount) => {
      setCount(newCount)
    })

    return () => {
      socket.off('counter_update')
    }
  }, [])

  const handleIncrement = () => {
    socket.emit('increment')
  }

  const handleDecrement = () => {
    socket.emit('decrement')
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <h1>Counter: {count}</h1>
        <button onClick={handleIncrement}>+</button>
        <button onClick={handleDecrement}>-</button>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
