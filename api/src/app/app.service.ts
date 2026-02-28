import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData() {
    return {
      name: 'blox-api',
      description: 'AI-powered portfolio and resume platform backend',
      version: '0.1.0',
      docs: '/help',
    };
  }
}


