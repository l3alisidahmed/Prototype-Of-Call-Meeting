import './App.css';
import Content from './Components/Content';
import CreateRoom from './Components/CreateRoom';
import SidBar from './Components/SidBare';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

// Connect Socket
const socket = io('http://localhost:3001');

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
let roomId;
let roomName = 'room';
let rtpCapabilities;
let localProducer;
let producerTransport;
let producersIds = [];
let consumerTransports = [];

function App() {
  const [RoomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState([]);
  // const [rtpCapabilities, setRtpCapabilities] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [remoteVideos, setRemoteVideos] = useState([]);

  // Join Room
  const joinRoom = (joinedRoomId, isRoomCreator) => {
    roomId = joinedRoomId;
    console.log('JoinRoom Function: roomId = ' + roomId);
    socket.emit('joinRoom', { roomId, isRoomCreator });
    socket.on('joined', async (room) => {
      console.log(room);
      console.log('RouterId = ' + roomId);
      rtpCapabilities = room.rtpCapabilities;
      console.log(rtpCapabilities);
    });
  };

  const getLocalStream = async (stream) => {
    try {
      const track = await stream.getVideoTracks()[0];
      params = { track, ...params };
      setLocalStream(stream);
      console.log(params);
      // createRoom();
      await createDevice();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Device
  const createDevice = async () => {
    try {
      device = new mediasoupClient.Device();

      console.log(rtpCapabilities);
      await device.load({
        routerRtpCapabilities: rtpCapabilities,
      });
      console.log('Router RTP Capabilities: ', rtpCapabilities);
      createSendTransport(roomId);
    } catch (error) {
      console.error(error);
      if (error.name === 'UnsupportedError') {
        console.error('browser not supported');
      }
    }
  };

  // // Create New Room
  // const createRoom = () => {
  //   console.log('Create Room');
  //   socket.emit('createRoom', roomName);

  //   socket.on('roomCreated', (room) => {
  //     console.log('Room Created');
  //     roomId = room.id;
  //     rtpCapabilities = room.rtpCapabilities;
  //     console.log(room.id);
  //     console.log(rtpCapabilities);
  //     // createDevice();
  //   });
  // };

  // createRoom();

  // Emit Event To Create Transport In The Server Side
  const createSendTransport = () => {
    console.log('RouterId = ' + roomId);
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

      getProducers(roomId);

      console.log('producer: ', localProducer);
    } catch (error) {
      console.error(error);
    }
  };

  // Get Producers
  const getProducers = (roomId) => {
    console.log('Inside getProducers');
    console.log(roomId);
    socket.emit('getProducers', { roomId });
    socket.on('producers', async (producersIds) => {
      console.log('producers: ');
      console.log(producersIds);
      await consumeProducers(producersIds);
    });
  };

  // Consume All Producers
  const consumeProducers = async (producersIds) => {
    console.log('Inside consumeProducers');
    console.log(producersIds);
    for (const producerId of producersIds) {
      createRecvTransport(producerId);
    }
  };

  // Create A Receive Transport In The Client Side
  const createRecvTransport = (producerId) => {
    console.log('RouterId = ' + roomId);
    socket.emit('createWebRtcTransport', {
      routerId: roomId,
      isProducer: false,
      roomName,
    });

    socket.on('createRecvTransport', async ({ params }) => {
      if (params.error) {
        console.log(params.error);
        return;
      }

      console.log(params);

      consumerTransports.push(device.createRecvTransport(params));
      console.log(consumerTransports[consumerTransports.length - 1]);

      consumerTransports[consumerTransports.length - 1].on(
        'connect',
        async ({ dtlsParameters }, callback, errback) => {
          try {
            console.log('consumer transport connect event');
            socket.emit('connectRecvTransport', {
              transportId: consumerTransports[consumerTransports.length - 1].id,
              dtlsParameters,
            });
            callback();
          } catch (error) {
            console.error(error);
            errback(error);
          }
        }
      );
      await connectRecvTransport(
        consumerTransports[consumerTransports.length - 1],
        producerId
      );
    });
  };

  // Connect A Receive Transport In The Client Side
  const connectRecvTransport = async (consumerTransport, producerId) => {
    console.log('connectrecvtransport');
    socket.emit('consume', {
      transportId: consumerTransport.id,
      producerId,
      rtpCapabilities: device.rtpCapabilities,
    });
    socket.on('consumed', async ({ params }) => {
      // if (params.error) {
      //   console.log('Cannot Consume');
      //   return;
      // }

      console.log(params);
      const consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters,
      });

      const { track } = consumer;
      const remoteVideo = new MediaStream([track]);
      remoteVideos.push(remoteVideo);
      setRemoteVideos(remoteVideos);
      // const stream = new MediaStream();
      // stream.addTrack(track);
      // remoteVideo.srcObject = stream;
      // console.log(stream);

      socket.emit('resumeConsumer', { transportId: consumerTransport });
    });
    console.log(remoteVideos);
  };

  useEffect(() => {
    const getRooms = () => {
      socket.emit('getRooms');
      socket.on('rooms', (rooms) => {
        // roomsList = rooms;
        console.log(rooms);
        setRooms(rooms);
      });
    };

    getRooms();
  }, []);

  return (
    <>
      <Router>
        <div className="App">
          <SidBar
            rooms={rooms}
            joinRoom={joinRoom}
            getProducers={getProducers}
          />
          <Routes>
            <Route
              path="/"
              element={
                <CreateRoom
                  setRoomName={setRoomName}
                  socket={socket}
                  roomId={roomId}
                  roomName={roomName}
                  joinRoom={joinRoom}
                  setIsAdmin={setIsAdmin}
                  getProducers={getProducers}
                />
              }
            />
            <Route
              path="/room"
              element={
                <Content
                  isAdmin={isAdmin}
                  getLocalStream={getLocalStream}
                  remoteVideos={remoteVideos}
                />
              }
            />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
