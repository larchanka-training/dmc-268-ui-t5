import { useState } from 'react'
import './App.css'

export function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <h1>DMC-268 Team 5 UI</h1>
      <p>React + TypeScript + Vite</p>
      <button onClick={() => setCount((count) => count + 1)}>
        Count is {count}
      </button>
    </div>
  )
}

export default App
