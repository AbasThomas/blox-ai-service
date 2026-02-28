import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData() {
    return {
      name: 'blox-worker',
      status: 'running',
      startedAt: new Date().toISOString(),
    };
  }
}

