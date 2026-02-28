import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getData', () => {
    it('should return worker metadata', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getData()).toHaveProperty('name', 'blox-worker');
    });
  });
});

