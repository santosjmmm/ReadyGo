import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'ReadyGo CarRent backend prototype is running.';
  }
}
