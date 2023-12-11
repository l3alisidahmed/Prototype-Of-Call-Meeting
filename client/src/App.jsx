import './App.css'
import SidBar from './Components/SidBare'
import Presentation from './Components/Presentation'
import User from './Components/User'
import CallOption from './Components/CallOption'
import Webcam from 'react-webcam'
import { useState } from 'react'

function App() {
  const [turnOn,setTurnOn] = useState(false)

  return (
    <>
      <div className='App'>
        <SidBar />
        <div className='Content'>
          <Presentation />
          <div className={turnOn ? 'bottom' : 'btm'}>
            <div className='left'>
              <div className='Profiles'>
                <User />
                <User />
                <User />
                <User />
                <User />
                <User />
                <User />
                <User />
                <User />
                <User />
                <User />
              </div>
              <div>
                <CallOption turnOn={turnOn} setTurnOn={setTurnOn}/>
              </div>
            </div>
            {JSON.parse(localStorage.getItem("on")) && <Webcam mirrored={true} style={{width: '40%', borderRadius: '25px'}} />}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
