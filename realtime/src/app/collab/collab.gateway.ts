import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CollabService } from './collab.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
  },
})
export class CollabGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CollabGateway.name);

  constructor(private readonly collabService: CollabService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('workspace:join')
  joinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { workspaceId: string; userId: string },
  ) {
    client.join(payload.workspaceId);
    this.server.to(payload.workspaceId).emit('workspace:presence', {
      userId: payload.userId,
      status: 'joined',
      at: new Date().toISOString(),
    });

    return {
      ok: true,
      content: this.collabService.getDocument(payload.workspaceId),
    };
  }

  @SubscribeMessage('workspace:update')
  updateWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { workspaceId: string; content: string; userId: string },
  ) {
    const result = this.collabService.updateDocument(payload.workspaceId, payload.content);
    client.to(payload.workspaceId).emit('workspace:patch', {
      workspaceId: payload.workspaceId,
      content: payload.content,
      userId: payload.userId,
      at: result.updatedAt,
    });

    return result;
  }
}

