/**
 * In-process TTL store for password reset tokens.
 * Tokens expire after 1 hour. For multi-instance deployments
 * this should be replaced with a Redis-backed store.
 */

interface ResetEntry {
  userId: string;
  email: string;
  expiresAt: number;
}

export class PasswordResetStore {
  private static readonly store = new Map<string, ResetEntry>();
  private static readonly TTL_MS = 60 * 60 * 1000; // 1 hour

  static set(token: string, userId: string, email: string): void {
    this.store.set(token, {
      userId,
      email,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  static get(token: string): ResetEntry | undefined {
    const entry = this.store.get(token);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(token);
      return undefined;
    }
    return entry;
  }

  static delete(token: string): void {
    this.store.delete(token);
  }
}
