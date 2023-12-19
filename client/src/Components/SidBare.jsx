/* eslint-disable react/prop-types */
import Logo from './Logo';
import Room from './Room';
import './SidBar.css';

const logoName = 'Private School';
// let roomsList = [];

function SidBar({ rooms, joinRoom, getProducers }) {
  // roomsList.push(Rooms);
  // const [roomsList, setRoomsList] = useState([]);
  console.log(rooms);

  return (
    <>
      <div className="SideBar">
        <div className="logo">
          <Logo LogoName={logoName} />
        </div>
        <div>
          {/* <Room RoomName="Create a new Room" /> */}
          {rooms.map((room) => {
            console.log(room);
            return (
              <Room
                roomName={room.id}
                key={room.id}
                joinRoom={joinRoom}
                getProducers={getProducers}
              />
            );
            // if (element != '') {
            //   return <Room RoomName={element} key={index} />;
            // }
          })}
        </div>
      </div>
    </>
  );
}

export default SidBar;
