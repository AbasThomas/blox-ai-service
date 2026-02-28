import { Controller, Get } from '@nestjs/common';

@Controller('queues')
export class QueuesController {
  @Get('health')
  health() {
    return {
      queues: {
        importUnify: 'up',
        assetGenerate: 'up',
        publish: 'up',
      },
      checkedAt: new Date().toISOString(),
    };
  }
}


