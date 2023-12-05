/* eslint-disable react/prop-types */
import tag from '../assets/diaz.svg';
import './Room.css';

function Room({RoomName}) {
    return (
        <>
            <div className="RoomCard">
                <img src={tag} alt="DIAZ" />
                <p className="RoomName">{RoomName}</p>
            </div>
        </>
    );
}

export default Room;