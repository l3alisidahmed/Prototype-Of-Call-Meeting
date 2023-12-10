import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { MediasoupService } from './mediasoup.service';
import { Socket } from 'socket.io';
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

type Room = {
  id: string;
  name: string;
  router: Router;
  users: User[];
  roomAdmin: number;
};

@WebSocketGateway()
export class MediasoupGateway {
  private routers: Router[];
  private rooms: Room[];
  private users: User[];

  constructor(private readonly mediasoupService: MediasoupService) {}

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
      roomName: roomName,
    });
    console.log(`Room Creator UserId: ${userId}`);

    // Create New Room
    const newRoom = {
      id: router.id,
      name: roomName,
      router,
      users: [],
      roomAdmin: userId,
    };
    this.rooms.push(newRoom);
    console.log(`Room Id (Router Id): ${router.id}`);

    callback(newRoom);
  }

  @SubscribeMessage('createWebRtcTransport')
  async createWebRtcTransport(client: Socket, payload: any): Promise<void> {
    const { routerId, isProducer, callback } = payload;

    // Get Router
    const router = this.routers.find((router) => router.id === routerId);

    // Get UserIndex To Add Transport
    const userIndex = this.users.findIndex(
      (user) => user.socketId === client.id,
    );

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

  // @SubscribeMessage('connectRecvTransport')
  // async connectRecvTransport(client: Socket, payload: any): Promise<void> {
  //   const { transportId, dtlsParameters } = payload;

  //   // Get UserIndex To Connect Transport
  //   const userIndex = this.users.findIndex(
  //     (user) => user.socketId === client.id,
  //   );

  //   // Get Consumer Transport Id
  //   const transportIndex = this.users[userIndex].consumers.findIndex(
  //     (transport) => transport.consumerTransport.id === transportId,
  //   );

  //   // Connect Consumer Transport
  //   await this.users[userIndex].consumers[
  //     transportIndex
  //   ].consumerTransport.connect({
  //     dtlsParameters,
  //   });
  // }

  // @SubscribeMessage('consume')
  // async consume(client: Socket, payload: any): Promise<void> {
  //   const { transportId, producerId, rtpCapabilities, callback } = payload;

  //   // Get UserIndex To Consume
  //   const userIndex = this.users.findIndex(
  //     (user) => user.socketId === client.id,
  //   );

  //   // Get Transport
  //   const transportIndex = this.users[userIndex].consumers.findIndex(
  //     (transport) => transport.consumerTransport.id === transportId,
  //   );

  //   // Get Producer
  //   const remoteProducer = this.users.find((user) =>
  //     user.producers.find((producer) => producer.producer.id === producerId),
  //   );
  //   const producer = remoteProducer.producers.find(
  //     (producer) => producer.producer.id === producerId,
  //   );

  //   // Create Consumer
  //   const consumer = await this.users[userIndex].consumers[
  //     transportIndex
  //   ].consumerTransport.consume({
  //     producerId,
  //     rtpCapabilities,
  //     paused: producer.producer.kind === 'video',
  //   });

  //   // Listen To Consumer Events
  //   consumer.on('transportclose', () => {
  //     console.log('consumer transport close');
  //     consumer.close();
  //   });

  //   // Save Consumer
  //   this.users[userIndex].consumers[transportIndex].consumer = consumer;

  //   // Send Consumer Parameters
  //   callback({
  //     producerId,
  //     id: consumer.id,
  //     kind: consumer.kind,
  //     rtpParameters: consumer.rtpParameters,
  //     type: consumer.type,
  //   });

  //   // Resume Consumer
  //   if (producer.producer.kind === 'video') {
  //     await consumer.resume();
  //   }
  // }
}
