import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET ??= 'test-only-secret';
    const { AppModule } = await import('../src/app.module.js');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/carrent/v1');
    await app.init();
  });

  it('/api/carrent/v1 (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/carrent/v1');
    expect(response.status).toBe(200);
    expect(response.text).toBe('ReadyGo CarRent backend prototype is running.');
  });

  afterAll(async () => {
    await app.close();
  });
});
