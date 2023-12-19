/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import './CreateRoom.css';
import { Link } from 'react-router-dom';

function CreateRoom({
  socket,
  roomId,
  roomName,
  joinRoom,
  setRoomName,
  setIsAdmin,
  getProducers,
}) {
  const [value, setValue] = useState('');

  const onFormChange = (event) => {
    setValue(event.target.value);
  };

  const SubmitClicked = () => {
    setRoomName(value);
    createRoom();
    // getProducers(roomId);
  };

  // Create New Room
  const createRoom = () => {
    setIsAdmin(true);
    console.log('Create Room');
    socket.emit('createRoom', roomName);
    socket.on('roomCreated', (room) => {
      console.log('Room Created');
      console.log('roomId = ' + room.id);
      joinRoom(room.id, true);
      // roomId = room.id;
      // setRtpCapabilities(room.rtpCapabilities);
      // console.log(room.id);
      // console.log(room.rtpCapabilities);
      // createDevice();
    });
  };

  return (
    <>
      <div className="rightDiv">
        <div className="card">
          <h1>Create Room</h1>
          <input type="text" onChange={onFormChange} className="form" />
          <Link to="/room">
            <input
              type="submit"
              onClick={SubmitClicked}
              value="Create"
              className="btn"
            />
          </Link>
        </div>
      </div>
    </>
  );
}

export default CreateRoom;
