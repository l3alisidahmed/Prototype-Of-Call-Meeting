import { Injectable } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import { Worker } from 'mediasoup/node/lib/types';

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
}
