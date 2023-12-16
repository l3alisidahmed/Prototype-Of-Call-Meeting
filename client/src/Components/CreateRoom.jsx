/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import './CreateRoom.css';
import { Link } from 'react-router-dom';

function CreateRoom({ setRoomName }) {
  const [value, setValue] = useState('');

  const onFormChange = (event) => {
    setValue(event.target.value);
  };

  const SubmitClicked = () => {
    setRoomName(value);
  };

  return (
    <>
      <div className="rightDiv">
        <div className="card">
          <h1>Create Room</h1>
          <input type="text" onChange={onFormChange} className="form" />
          <Link to="/JoinRoom">
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
