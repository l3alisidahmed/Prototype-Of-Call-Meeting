import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SidBar from './Components/SidBare'

function App() {

  return (
    <>
      <div className='App'>
        <SidBar />
        <div className='Content'></div>
      </div>
    </>
  )
}

export default App
