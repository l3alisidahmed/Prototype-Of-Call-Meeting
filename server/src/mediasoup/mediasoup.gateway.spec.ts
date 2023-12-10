import { Test, TestingModule } from '@nestjs/testing';
import { MediasoupGateway } from './mediasoup.gateway';

describe('MediasoupGateway', () => {
  let gateway: MediasoupGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediasoupGateway],
    }).compile();

    gateway = module.get<MediasoupGateway>(MediasoupGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
