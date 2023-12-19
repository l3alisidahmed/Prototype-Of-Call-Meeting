import { Injectable } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { Router } from 'mediasoup/node/lib/types';
import { Socket } from 'socket.io';

@Injectable()
export class MediasoupService {
  public createWorker = async () => {
    const worker = await mediasoup.createWorker({
      rtcMinPort: 2000,
      rtcMaxPort: 2020,
    });
    console.log(`worker created pid: ${worker.pid}`);
    worker.on('died', () => {
      console.error(`worker died pid: ${worker.pid}, exit in 2 seconds!`);
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    });

    return worker;
  };

  createWebRtcTransport = async (
    router: Router,
    client: Socket,
    isProducer: boolean,
  ) => {
    try {
      console.log(router);

      const transport = await router.createWebRtcTransport({
        listenIps: [
          {
            ip: '0.0.0.0',
            announcedIp: '127.0.0.1',
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      transport.on('dtlsstatechange', (dtlsState) => {
        console.log(`transport id: ${transport.id}`);
        if (dtlsState === 'closed') {
          console.log('transport close');
          transport.close();
        }
      });

      console.log('transport connected from create: \nid = ' + transport.id);

      if (isProducer) {
        client.emit('createSendTransport', {
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });
      } else {
        client.emit('createRecvTransport', {
          params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
          },
        });
      }

      return transport;
    } catch (error) {
      console.error(error);
      if (isProducer) {
        client.emit('createSendTransport', {
          params: {
            error: error,
          },
        });
      } else {
        client.emit('createRecvTransport', {
          params: {
            error: error,
          },
        });
      }
    }
  };
}
