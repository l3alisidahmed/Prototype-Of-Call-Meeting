import './App.css';
import Content from './Components/Content';
import CreateRoom from './Components/CreateRoom';
import SidBar from './Components/SidBare';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import io from 'socket.io-client';

// Connect Socket
const socket = io('http://localhost:3001');

function App() {
  const [RoomName, setRoomName] = useState('');

  return (
    <>
      <Router>
        <div className="App">
          <SidBar socket={socket} Rooms={RoomName} />
          <Routes>
            <Route
              path="/"
              element={<CreateRoom setRoomName={setRoomName} />}
            />
            <Route path="/JoinRoom" element={<Content socket={socket} />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
