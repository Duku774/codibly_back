import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('GET /endpoint1', () => {
    it('connects to the API', async () => {
      let response;
      let error;

      try {
        response = await appController.getThreeDays();
      } catch (err: unknown) {
        error = err;
      }

      expect(error).toBeUndefined();
      expect(response).toBeDefined();
    });
  });

  describe('GET /endpoint2', () => {
    it('connects to the API', async () => {
      const hours = 2;
      let response;
      let error;

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        response = await appController.getOptimalCharge(hours);
      } catch (err: unknown) {
        error = err;
      }

      expect(error).toBeUndefined();
      expect(response).toBeDefined();
    });
  });
});
