/* eslint-disable react/prop-types */
import Logo from './Logo';
import Room from './Room';
import './SidBar.css';

const logoName = 'E-TeachHub';
let roomsList = [];

function SidBar({ socket, Rooms }) {
  roomsList.push(Rooms);

  const getRooms = () => {
    socket.emit('getRooms');
    socket.on('rooms', (rooms) => {
      roomsList = rooms;
      console.log(rooms);
    });
  };

  getRooms();

  return (
    <>
      <div className="SideBar">
        <div className="logo">
          <Logo LogoName={logoName} />
        </div>
        <div>
          <Room RoomName="Create a new Room" />
          {roomsList.map((element, index) => {
            console.log(element);
            return <Room RoomName={element.roomName} key={index} />;
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
