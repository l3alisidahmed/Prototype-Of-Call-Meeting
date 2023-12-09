import './App.css'
import SidBar from './Components/SidBare'
import Presentation from './Components/Presentation'
import User from './Components/User'
import CallOption from './Components/CallOption'
import Webcam from 'react-webcam'

function App() {

  const on = true;

  return (
    <>
      <div className='App'>
        <SidBar />
        <div className='Content'>
          <Presentation />
          <div className='bottom'>
            <div className='left'>
              <div className='Profiles'>
                <User />
                <User />
                <User />
                <User />
                <User />
              </div>
              <div>
                <CallOption />
              </div>
            </div>
            {on ? <Webcam style={{width: '49%', borderRadius: '25px'}} /> : <div className='right'></div>}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
