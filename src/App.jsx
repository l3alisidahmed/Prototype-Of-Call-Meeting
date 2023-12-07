import './App.css'
import SidBar from './Components/SidBare'
import Presentation from './Components/Presentation'
import User from './Components/User'
import CallOption from './Components/CallOption'

function App() {

  return (
    <>
      <div className='App'>
        <SidBar />
        <div className='Content'>
          <Presentation />
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
      </div>
    </>
  )
}

export default App
