import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MediasoupService } from './mediasoup.service';
import { Server, Socket } from 'socket.io';
import {
  Consumer,
  MediaKind,
  Producer,
  Router,
  RtpCapabilities,
  Transport,
} from 'mediasoup/node/lib/types';

const mediaCodecs = [
  {
    kind: 'audio' as MediaKind,
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video' as MediaKind,
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

type ProducerObject = {
  producerTransport: Transport;
  producer: Producer;
};

type ConsumerObject = {
  consumerTransport: Transport;
  consumer: Consumer;
};

type User = {
  id: number;
  name: string;
  socketId: string;
  producers: ProducerObject[];
  consumers: ConsumerObject[];
  roomName: string;
};

// User
// - id
// - name
// - socketId
// - producers
//   - producerObject[0]
//     - producer
//     - producerTransport
//   - producerObject[1]
//     - producer
//     - producerTransport
// - consumers
//   - consumerObject[0]
//     - consumer
//     - consumerTransport
//   - consumerObject[1]
//     - consumer
//     - consumerTransport
// - roomName

type Room = {
  id: string;
  name: string;
  rtpCapabilities: RtpCapabilities;
  users: User[];
  producers: string[];
  roomAdmin: number;
};

@WebSocketGateway(3001, {
  cors: {
    origin: '*',
  },
})
export class MediasoupGateway {
  private routers: Router[] = [];
  private rooms: Room[] = [];
  private users: User[] = [];

  constructor(private readonly mediasoupService: MediasoupService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createRoom')
  async createRoom(client: Socket, payload: any): Promise<Room> {
    const { roomName } = payload;
    const worker = await this.mediasoupService.createWorker();
    if (!worker) {
      console.error('mediasoup worker not initialized');
      return;
    }
    const router = await worker.createRouter({ mediaCodecs });
    console.log(router);
    this.routers.push(router);

    // Generate User Id
    const userId = Date.now();

    // Create New User
    this.users.push({
      id: userId,
      name: 'Sid Ahmed',
      socketId: client.id,
      producers: [],
      consumers: [],
      roomName: '',
    });
    console.log(`Room Creator UserId: ${userId}`);

    // Create New Room
    const newRoom = {
      id: router.id,
      name: roomName,
      rtpCapabilities: router.rtpCapabilities,
      users: [],
      producers: [],
      roomAdmin: userId,
    };
    this.rooms.push(newRoom);
    console.log(`Room Id (Router Id): ${router.id}`);

    client.emit('roomCreated', newRoom);
  }

  @SubscribeMessage('joinRoom')
  joinRoom(client: Socket, payload: any): void {
    const { roomId, isRoomCreator } = payload;

    console.log('room joined');
    console.log('roomId = ' + roomId);

    const roomIndex = this.rooms.findIndex((room) => room.id === roomId);
    const room = this.rooms[roomIndex];

    if (isRoomCreator) {
      client.emit('joined', room);
      return;
    }

    // Generate User Id
    const userId = Date.now();

    // Create New User
    const newUser = {
      id: userId,
      name: 'Sid Ahmed',
      socketId: client.id,
      producers: [],
      consumers: [],
      roomName: '',
    };
    this.users.push(newUser);
    console.log(`Room Joiner UserId: ${userId}`);

    console.log('roomIndex = ' + roomIndex);
    this.rooms[roomIndex].users.push(newUser);
    client.emit('joined', room);
  }

  @SubscribeMessage('getRooms')
  async getRooms(client: Socket): Promise<void> {
    client.emit('rooms', this.rooms);
  }

  @SubscribeMessage('createWebRtcTransport')
  async createWebRtcTransport(client: Socket, payload: any): Promise<void> {
    const { routerId, isProducer, roomName } = payload;

    // Get Router
    console.log('Routers: ');
    console.log(this.routers[0].id);
    console.log('Router: ' + routerId);
    const router = this.routers.find((router) => router.id === routerId);

    // Get UserIndex To Add Transport
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Add Room Name
    this.users[userIndex].roomName = routerId;

    // Check If The User Is Trying To Produce Or Consume
    if (isProducer) {
      // Create Producer Transport
      const producerTransport =
        await this.mediasoupService.createWebRtcTransport(
          router,
          client,
          isProducer,
        );
      this.users[userIndex].producers.push({
        producerTransport,
        producer: null,
      });
    } else {
      // Create Consumer Transport
      const consumerTransport =
        await this.mediasoupService.createWebRtcTransport(
          router,
          client,
          isProducer,
        );
      this.users[userIndex].consumers.push({
        consumerTransport,
        consumer: null,
      });
    }
  }

  @SubscribeMessage('connectSendTransport')
  async connectSendTransport(client: Socket, payload: any): Promise<void> {
    const { transportId, dtlsParameters } = payload;

    // Get UserIndex To Connect Transport
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Get Producer Transport Id
    const transportIndex = this.users[userIndex].producers.findIndex(
      (transport) => transport.producerTransport.id === transportId,
    );

    console.log('transport connected from connect: \nid = ' + transportId);

    // Connect Producer Transport
    await this.users[userIndex].producers[
      transportIndex
    ].producerTransport.connect({
      dtlsParameters,
    });
  }

  @SubscribeMessage('produce')
  async produce(client: Socket, payload: any): Promise<void> {
    const { transportId, kind, rtpParameters } = payload;

    // Get UserIndex To Produce
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Get Transport
    const transportIndex = this.users[userIndex].producers.findIndex(
      (transport) => transport.producerTransport.id === transportId,
    );

    // Create Producer
    const producer = await this.users[userIndex].producers[
      transportIndex
    ].producerTransport.produce({
      kind,
      rtpParameters,
    });

    // Listen To Producer Events
    producer.on('transportclose', () => {
      console.log('producer transport close');
      producer.close();
    });

    // Save Producer In User Instance
    this.users[userIndex].producers[transportIndex].producer = producer;

    // Save Producer In Room Instance
    this.rooms
      .find((room) => room.id === this.users[userIndex].roomName)
      .producers.push(producer.id);

    // Send Producer Id
    client.emit('produced', { id: producer.id });
  }

  @SubscribeMessage('connectRecvTransport')
  async connectRecvTransport(client: Socket, payload: any): Promise<void> {
    const { transportId, dtlsParameters } = payload;

    // Get UserIndex To Connect Transport
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Get Consumer Transport Id
    const transportIndex = this.users[userIndex].consumers.findIndex(
      (transport) => transport.consumerTransport.id === transportId,
    );

    // Connect Consumer Transport
    await this.users[userIndex].consumers[
      transportIndex
    ].consumerTransport.connect({
      dtlsParameters,
    });
  }

  @SubscribeMessage('consume')
  async consume(client: Socket, payload: any): Promise<void> {
    const { transportId, producerId, rtpCapabilities } = payload;

    // Get UserIndex To Consume
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Get Transport
    const transportIndex = this.users[userIndex].consumers.findIndex(
      (transport) => transport.consumerTransport.id === transportId,
    );

    // Get Remote Producer
    const remoteProducer = this.users.find((user) =>
      user.producers.find(
        (producerObject) => producerObject.producer.id === producerId,
      ),
    );

    // Get Producer Instance
    const producerObject = remoteProducer.producers.find(
      (producerObject) => producerObject.producer.id === producerId,
    );

    // Create Consumer
    const consumer = await this.users[userIndex].consumers[
      transportIndex
    ].consumerTransport.consume({
      producerId,
      rtpCapabilities,
      paused: producerObject.producer.kind === 'video',
    });

    // Listen To Consumer Events
    consumer.on('transportclose', () => {
      console.log('consumer transport close');
      consumer.close();
    });

    // producerObject.producer.on('producerclose', () => {
    //   console.log('producer of consumer closed');
    // });

    // Save Consumer
    this.users[userIndex].consumers[transportIndex].consumer = consumer;

    // Send Consumer Parameters
    client.emit('consumed', {
      params: {
        producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
      },
    });
  }

  @SubscribeMessage('resumeConsumer')
  async resumeComsumer(client: Socket, payload: any): Promise<void> {
    const { transportId } = payload;

    // Get UserIndex To Resume
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Get Transport Index
    const transportIndex = this.users[userIndex].consumers.findIndex(
      (transport) => transport.consumerTransport.id === transportId,
    );

    // Resume Consumer
    await this.users[userIndex].consumers[transportIndex].consumer.resume();
  }

  @SubscribeMessage('getProducers')
  async getProducers(client: Socket, payload: any): Promise<void> {
    const { roomId } = payload;

    console.log('producers');
    console.log(roomId);

    // Return All Producers Of Room
    // this.server
    //   .to(roomId)
    //   .emit(
    //     'producers',
    //     this.rooms.find((room) => room.id === roomId).producers,
    //   );
    client.emit(
      'producers',
      this.rooms.find((room) => room.id === roomId).producers,
    );
  }

  @SubscribeMessage('leaveRoom')
  leaveRoom(client: Socket, payload: any): void {
    const { roomName } = payload;
    // Get UserIndex To Disconnect
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Close All Producer Transports
    this.users[userIndex].producers.forEach((producerObject) => {
      producerObject.producerTransport.close();
      producerObject.producer.close();
      producerObject.producerTransport = null;
      producerObject.producer = null;
    });

    // Close All Consumer Transports
    this.users[userIndex].consumers.forEach((consumerObject) => {
      consumerObject.consumerTransport.close();
      consumerObject.consumer.close();
      consumerObject.consumerTransport = null;
      consumerObject.consumer = null;
    });

    // Remove User From Room
    this.users = this.rooms
      .find((room) => room.name === roomName)
      .users.filter((user) => user.socketId === client.id);
  }

  @SubscribeMessage('disconnect')
  async disconnect(client: Socket): Promise<void> {
    // Get UserIndex To Disconnect
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Close All Producer Transports
    this.users[userIndex].producers.forEach((producerObject) => {
      producerObject.producerTransport.close();
      producerObject.producer.close();
      producerObject.producerTransport = null;
      producerObject.producer = null;
    });

    // Close All Consumer Transports
    this.users[userIndex].consumers.forEach((consumerObject) => {
      consumerObject.consumerTransport.close();
      consumerObject.consumer.close();
      consumerObject.consumerTransport = null;
      consumerObject.consumer = null;
    });

    // Remove User From Room
    this.users = this.rooms
      .find((room) => room.name === this.users[userIndex].roomName)
      .users.filter((user) => user.socketId === client.id);

    // Delete User
    this.users = this.users.filter((user) => user.socketId === client.id);
  }
}
