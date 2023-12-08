import Logo from "./Logo";
import Room from "./Room";
import './SidBar.css';

const logoName = "E-TeachHub";

function SidBar() {
    return (
        <>
            <div className="SideBar">
                <div className="logo">
                    <Logo LogoName={logoName} />
                </div>
                <div>
                    <Room RoomName="Create a new Room"/>
                    <Room RoomName="Room_1"/>
                    <Room RoomName="Room_2"/>
                    <Room RoomName="Room_3"/>
                    <Room RoomName="Room_4"/>
                </div>
            </div>
        </>
    );
}

export default SidBar;