import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData() {
    return {
      name: 'blox-realtime',
      status: 'running',
      protocol: 'socket.io',
    };
  }
}

