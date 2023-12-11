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
  router: Router;
  users: User[];
  producers: Producer[];
  roomAdmin: number;
};

@WebSocketGateway()
export class MediasoupGateway {
  private routers: Router[];
  private rooms: Room[];
  private users: User[];

  constructor(private readonly mediasoupService: MediasoupService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createRoom')
  async createRoom(client: Socket, payload: any): Promise<void> {
    const { roomName, callback } = payload;
    const worker = this.mediasoupService.worker;
    const router = await worker.createRouter({ mediaCodecs });
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
      router,
      users: [],
      producers: [],
      roomAdmin: userId,
    };
    this.rooms.push(newRoom);
    console.log(`Room Id (Router Id): ${router.id}`);

    callback(newRoom);
  }

  @SubscribeMessage('createWebRtcTransport')
  async createWebRtcTransport(client: Socket, payload: any): Promise<void> {
    const { routerId, isProducer, roomName, callback } = payload;

    // Get Router
    const router = this.routers.find((router) => router.id === routerId);

    // Get UserIndex To Add Transport
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

    // Add Room Name
    this.users[userIndex].roomName = roomName;

    // Check If The User Is Trying To Produce Or Consume
    if (isProducer) {
      // Create Producer Transport
      const producerTransport =
        await this.mediasoupService.createWebRtcTransport(router, callback);
      this.users[userIndex].producers.push({
        producerTransport,
        producer: null,
      });
    } else {
      // Create Consumer Transport
      const consumerTransport =
        await this.mediasoupService.createWebRtcTransport(router, callback);
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

    // Connect Producer Transport
    await this.users[userIndex].producers[
      transportIndex
    ].producerTransport.connect({
      dtlsParameters,
    });
  }

  @SubscribeMessage('produce')
  async produce(client: Socket, payload: any): Promise<void> {
    const { transportId, kind, rtpParameters, callback } = payload;

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

    // Save Producer
    this.users[userIndex].producers[transportIndex].producer = producer;

    // Send Producer Id
    callback({ id: producer.id });
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
    const { transportId, producerId, rtpCapabilities, callback } = payload;

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
    callback({
      producerId,
      id: consumer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
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
    const { roomName } = payload;

    // Return All Producers Of Room
    this.server
      .to(roomName)
      .emit(
        'getProducers',
        this.rooms.find((room) => room.name === roomName).producers,
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
