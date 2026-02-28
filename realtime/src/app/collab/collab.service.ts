import { Injectable } from '@nestjs/common';

@Injectable()
export class CollabService {
  private readonly documents = new Map<string, string>();

  updateDocument(workspaceId: string, content: string) {
    this.documents.set(workspaceId, content);
    return {
      workspaceId,
      updatedAt: new Date().toISOString(),
    };
  }

  getDocument(workspaceId: string) {
    return this.documents.get(workspaceId) ?? '';
  }
}

