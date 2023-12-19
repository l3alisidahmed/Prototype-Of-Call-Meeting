/* eslint-disable react/prop-types */
import tag from '../assets/diaz.svg';
import './Room.css';
import { Link } from 'react-router-dom';

function Room({ roomName, joinRoom, getProducers }) {
  const enterRoom = () => {
    joinRoom(roomName, false);
    // getProducers(roomName);
  };
  return (
    <>
      <Link to="/room">
        <div className="RoomCard" onClick={enterRoom}>
          <img className="diaz" src={tag} alt="DIAZ" />
          <p className="RoomName">{roomName}</p>
        </div>
      </Link>
    </>
  );
}

export default Room;
