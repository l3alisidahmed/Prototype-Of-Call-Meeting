import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MediasoupModule } from './mediasoup/mediasoup.module';

@Module({
  imports: [MediasoupModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
