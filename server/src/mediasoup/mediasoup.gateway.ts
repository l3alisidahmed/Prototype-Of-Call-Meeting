import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { MediasoupService } from './mediasoup.service';
import { Socket } from 'socket.io';
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

type User = {
  id: number;
  name: string;
  socketId: string;
  producerTransport: Transport;
  consumerTransport: Transport;
  producer: Producer;
  consumer: Consumer;
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
  async createRoom(client: Socket, payload: any): Promise<RtpCapabilities> {
    const { roomName } = payload;
    const worker = this.mediasoupService.worker;
    const router = await worker.createRouter({ mediaCodecs });
    this.routers.push(router);

    // Generate user id
    const userId = Date.now();

    // Create new user
    this.users.push({
      id: userId,
      name: 'Sid Ahmed',
      socketId: client.id,
      producerTransport: null,
      consumerTransport: null,
      producer: null,
      consumer: null,
      roomName: roomName,
    });
    console.log(`Room Creator UserId: ${userId}`);

    // Create new room
    this.rooms.push({
      id: router.id,
      name: payload.roomName,
      router,
      users: [],
      roomAdmin: userId,
    });
    console.log(`Room Id (Router Id): ${router.id}`);

    return router.rtpCapabilities;
  }
}
