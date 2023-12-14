import './App.css'
import SidBar from './Components/SidBare'
import Presentation from './Components/Presentation'
import User from './Components/User'
import CallOption from './Components/CallOption'
import Webcam from 'react-webcam'
import { useState } from 'react'


function App() {
  const [CamVisible, setCamVisible] = useState(false);

  const onCamClicked = () => {
    setCamVisible(!CamVisible);
  }

  return (
    <>
      <div className='App'>
        <SidBar />
        <div className='Content'>
          <div className="top">
            <Presentation />
          </div>
          <div className={CamVisible ? 'bottom' : 'btm'}>
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
                <User />
                <User />
                <User />
              </div>
              <div>
                <CallOption func={onCamClicked}/>
              </div>
            </div>
            {CamVisible && <Webcam mirrored={true} style={{width: '40%', borderRadius: '25px'}} />}
          </div>
        </div>
      </div>
    </>
  )
}

export default App;
