/* eslint-disable react/prop-types */
import Logo from "./Logo";
import Room from "./Room";
import './SidBar.css';

const logoName = "E-TeachHub";
let arr = [];

function SidBar({ Rooms }) {
    arr.push(Rooms);

    return (
        <>
            <div className="SideBar">
                <div className="logo">
                    <Logo LogoName={logoName} />
                </div>
                <div>
                    <Room RoomName="Create a new Room"/>
                    {arr.map((element, index) => {
                        if (element != "") {
                            return(
                                <Room RoomName={element} key={index} />
                            );
                        }
                    })}
                </div>
            </div>
        </>
    );
}

export default SidBar;