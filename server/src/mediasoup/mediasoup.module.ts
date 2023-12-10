import { Module } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { MediasoupGateway } from './mediasoup.gateway';

@Module({
  providers: [MediasoupService, MediasoupGateway],
})
export class MediasoupModule {}
