import { Injectable } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { Router, Worker } from 'mediasoup/node/lib/types';

@Injectable()
export class MediasoupService {
  private _worker: Worker;

  public get worker(): Worker {
    return this._worker;
  }
  public set worker(value: Worker) {
    this._worker = value;
  }

  private createWorker = async () => {
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

  this_worker = this.createWorker();

  createWebRtcTransport = async (router: Router, callback: any) => {
    try {
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

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      });

      return transport;
    } catch (error) {
      console.error(error);
      callback({
        params: {
          error: error,
        },
      });
    }
  };
}
