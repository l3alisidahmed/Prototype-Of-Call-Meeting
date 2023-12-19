import Presentation from './Presentation';
import CallOption from './CallOption';
import Webcam from 'react-webcam';
import './Content.css';
import { useState } from 'react';
import PropTypes from 'prop-types';

// let device;
// let roomName = 'room';
// let roomId;
// let rtpCapabilities;
// let localProducer;
// let producerTransport;
// let producersIds = [];
// let consumerTransports = [];

function Content({ isAdmin, getLocalStream, remoteVideos }) {
  // const { socket, roomId, roomName } = props;
  const [CamVisible, setCamVisible] = useState(false);

  // Local Camera Stream State
  // const [localStream, setLocalStream] = useState(null);
  //   const [roomName, setRoomName] = useState('room');
  //   const [roomId, setRoomId] = useState(0);

  const onCamClicked = () => {
    setCamVisible(!CamVisible);
  };

  console.log('Remote Videos: ');
  console.log(remoteVideos);

  //   useEffect(() => {

  //   }, []);

  return (
    <>
      <div className="Content">
        <div className="top">
          <Presentation />
        </div>
        <div className={CamVisible ? 'bottom' : 'btm'}>
          <div className="left">
            <div className="Profiles">
              {!isAdmin && (
                <Webcam
                  // className="circle"
                  mirrored={true}
                  onUserMedia={async (stream) => await getLocalStream(stream)}
                  style={{
                    width: '180px',
                    borderRadius: '10px',
                  }}
                />
              )}
              {remoteVideos.map((remoteVideo, index) => {
                return (
                  <video
                    src=""
                    ref={(videoElement) => {
                      if (videoElement) {
                        videoElement.srcObject = remoteVideo;
                        videoElement.addEventListener('loadedmetadata', () => {
                          console.log('Src Object: ');
                          console.log(videoElement.srcObject);
                        });
                      }
                    }}
                    key={index}
                    autoPlay
                    playsInline
                  ></video>
                );
              })}
            </div>
            <div>
              <CallOption func={onCamClicked} />
            </div>
          </div>
          {/* {CamVisible && ( */}
          {/* <Webcam
            // ref={cameraRef}
            mirrored={true}
            onUserMedia={async (stream) => await getLocalStream(stream)}
            style={{ width: '40%', borderRadius: '25px' }}
          /> */}
          {/* )} */}
          {isAdmin ? (
            <Webcam
              className="admin-camera"
              mirrored={true}
              onUserMedia={async (stream) => await getLocalStream(stream)}
              // style={{ width: '40%', borderRadius: '25px' }}
            />
          ) : (
            <video
              className="admin-camera"
              style={{ backgroundColor: 'white' }}
            />
          )}
        </div>
      </div>
    </>
  );
}

Content.propTypes = {
  isAdmin: PropTypes.bool,
  getLocalStream: PropTypes.func,
  remoteVideos: PropTypes.array,
};

export default Content;
