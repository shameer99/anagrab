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
      <div className="card">
        <h1>Counter: {count}</h1>
        <button onClick={handleIncrement}>+</button>
        <button onClick={handleDecrement}>-</button>
      </div>
    </>
  )
}

export default App
