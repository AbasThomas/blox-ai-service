import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData() {
    return {
      name: 'blox-ai-service',
      status: 'ready',
    };
  }
}


