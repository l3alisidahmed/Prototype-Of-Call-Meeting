import Presentation from './Presentation';
import User from './User';
import CallOption from './CallOption';
import Webcam from 'react-webcam';
import './Content.css';
import { useEffect, useState } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import PropTypes from 'prop-types';

// Define Stream Params
let params = {
  encodings: [
    {
      rid: 'r0',
      maxBitrate: 100000,
      scalabilityMode: 'S1T3',
    },
    {
      rid: 'r1',
      maxBitrate: 300000,
      scalabilityMode: 'S1T3',
    },
    {
      rid: 'r2',
      maxBitrate: 900000,
      scalabilityMode: 'S1T3',
    },
  ],
  codecOptions: {
    videoGoogleStartBitrate: 1000,
  },
};

let device;
let roomName = 'room';
let roomId;
let rtpCapabilities;
let localProducer;
let producerTransport;
let producersIds = [];
let consumerTransports = [];

function Content(props) {
  const { socket } = props;
  const [CamVisible, setCamVisible] = useState(false);

  // Local Camera Stream State
  const [localStream, setLocalStream] = useState(null);
  //   const [roomName, setRoomName] = useState('room');
  //   const [roomId, setRoomId] = useState(0);

  const onCamClicked = () => {
    setCamVisible(!CamVisible);
  };

  const getLocalStream = async (stream) => {
    try {
      const track = await stream.getVideoTracks()[0];
      params = { track, ...params };
      setLocalStream(stream);
      console.log(params);
      createRoom();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Device
  const createDevice = async () => {
    try {
      device = new mediasoupClient.Device();

      await device.load({
        routerRtpCapabilities: rtpCapabilities,
      });
      console.log('Router RTP Capabilities: ', rtpCapabilities);
      createSendTransport();
    } catch (error) {
      console.error(error);
      if (error.name === 'UnsupportedError') {
        console.error('browser not supported');
      }
    }
  };

  // Create New Room
  const createRoom = () => {
    console.log('Create Room');
    socket.emit('createRoom', roomName);

    socket.on('roomCreated', (room) => {
      console.log('Room Created');
      roomId = room.id;
      rtpCapabilities = room.rtpCapabilities;
      console.log(room.id);
      console.log(rtpCapabilities);
      createDevice();
    });
  };

  createRoom();

  // Emit Event To Create Transport In The Server Side
  const createSendTransport = () => {
    socket.emit('createWebRtcTransport', {
      routerId: roomId,
      isProducer: true,
      roomName,
    });

    socket.on('createSendTransport', async ({ params }) => {
      if (params.error) {
        console.log(params.error);
        return;
      }
      console.log(params);
      producerTransport = device.createSendTransport(params);
      producerTransport.on(
        'connect',
        async ({ dtlsParameters }, callback, errback) => {
          try {
            console.log('transport connect event');
            // Signal local DTLS parameters to the server side transport
            socket.emit('connectSendTransport', {
              transportId: producerTransport.id,
              dtlsParameters,
            });
            // Tell the transport that parameters were transmitted
            callback();
          } catch (error) {
            console.error(error);
            errback(error);
          }
        }
      );

      producerTransport.on('produce', async (parameters, callback, errback) => {
        console.log('transport produce event');
        console.log('Parameters: ', parameters);
        try {
          socket.emit('produce', {
            transportId: producerTransport.id,
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
          });
          socket.on('produced', ({ id }) => {
            console.log('producer id: ', id);
            // Tell the transport that parameters were transmitted
            // and provide it with server side producer's id
            callback({ id });
          });
        } catch (error) {
          errback(error);
        }
      });

      await connectSendTransport(producerTransport);
    });
  };

  // Connect A Send Transport In The Client Side
  const connectSendTransport = async (producerTransport) => {
    try {
      console.log('transport connect');
      console.log(params);
      localProducer = await producerTransport.produce(params);

      localProducer.on('trackended', () => {
        console.log('track ended');
      });

      // close video track
      localProducer.on('transportclose', () => {
        console.log('transport ended');
      });

      console.log('producer: ', localProducer);
    } catch (error) {
      console.error(error);
    }
  };

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
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
              <User />
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
        </div>
      </div>
    </>
  );
}

Content.propTypes = {
  socket: PropTypes.object.isRequired,
};

export default Content;
