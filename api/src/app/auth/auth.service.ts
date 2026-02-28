import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { PasswordResetStore } from './password-reset.store';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { User } from '@prisma/client';

/** Minimal subset used for token signing */
interface TokenUser {
  id: string;
  email: string;
  tier: string;
}

/**
 * Simple TOTP implementation that does NOT require the speakeasy package.
 * Uses RFC 6238 TOTP with SHA-1, 6 digits, 30-second window.
 */
class TotpHelper {
  static generateSecret(length = 20): string {
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      secret += base32Chars[bytes[i] % 32];
    }
    return secret;
  }

  private static base32Decode(base32: string): Buffer {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleaned = base32.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const output: number[] = [];
    for (const char of cleaned) {
      const idx = chars.indexOf(char);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(output);
  }

  static generateCode(secret: string, timeStep?: number): string {
    const step = timeStep ?? Math.floor(Date.now() / 1000 / 30);
    const key = this.base32Decode(secret);
    const stepBuffer = Buffer.alloc(8);
    let remaining = step;
    for (let i = 7; i >= 0; i--) {
      stepBuffer[i] = remaining & 0xff;
      remaining = Math.floor(remaining / 256);
    }
    const hmac = createHmac('sha1', key).update(stepBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    return String(code % 1_000_000).padStart(6, '0');
  }

  static verify(secret: string, token: string, window = 1): boolean {
    const current = Math.floor(Date.now() / 1000 / 30);
    for (let i = -window; i <= window; i++) {
      if (this.generateCode(secret, current + i) === token) return true;
    }
    return false;
  }

  static otpauthUri(secret: string, email: string, issuer = 'Blox'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  }
}

/** Temporary in-memory store for pending MFA secrets before the user confirms */
const pendingMfaSecrets = new Map<string, { secret: string; expiresAt: number }>();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim();
    const resolvedFullName = (dto.fullName ?? dto.name ?? '').trim();
    if (resolvedFullName.length < 2) {
      throw new BadRequestException('Full name is required');
    }

    const allowedPersonas = new Set([
      'Freelancer',
      'JobSeeker',
      'Designer',
      'Developer',
      'Student',
      'Executive',
      'Professional',
      'Enterprise',
    ]);
    const persona = allowedPersonas.has(dto.persona ?? '')
      ? (dto.persona as string)
      : 'JobSeeker';

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const periodEndAt = trialEndsAt;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: resolvedFullName,
        persona,
        tier: 'FREE',
        subscriptions: {
          create: {
            tier: 'FREE',
            cycle: 'MONTHLY',
            amountMinor: 0,
            currency: 'USD',
            provider: 'internal',
            trialEndsAt,
            periodStartAt: now,
            periodEndAt,
            status: 'trialing',
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_SIGNUP',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: user.email, persona: user.persona },
      },
    });

    // Send welcome email (non-blocking)
    this.mailService.sendWelcome(user.email, user.fullName).catch(() => undefined);

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tier: user.tier,
        persona: user.persona,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    if (user.mfaEnabled) {
      // Issue a short-lived challenge token — client must call /auth/mfa/verify with it
      const challengeToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, mfaChallenge: true },
        {
          secret: process.env.JWT_ACCESS_SECRET ?? 'replace-with-32-char-secret',
          expiresIn: '10m',
        },
      );
      return {
        mfaRequired: true,
        challengeToken,
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tier: user.tier,
        persona: user.persona,
        mfaEnabled: user.mfaEnabled,
      },
      accessToken: await this.signAccessToken(user),
      refreshToken: await this.signRefreshToken(user),
      mfaRequired: false,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: { sub: string; tokenType?: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'replace-with-refresh-secret-32-char',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: await this.signAccessToken(user),
    };
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secret = TotpHelper.generateSecret();
    const qrCodeUri = TotpHelper.otpauthUri(secret, user.email);

    // Store pending secret with 10-minute TTL
    pendingMfaSecrets.set(userId, {
      secret,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return {
      secret,
      qrCodeUri,
      message: 'Scan the QR code with your authenticator app, then call /auth/mfa/verify to confirm.',
    };
  }

  async verifyMfa(userId: string, dto: VerifyMfaDto) {
    const pending = pendingMfaSecrets.get(userId);

    if (pending) {
      // Setup flow: user is verifying the pending secret for the first time
      if (Date.now() > pending.expiresAt) {
        pendingMfaSecrets.delete(userId);
        throw new BadRequestException('MFA setup session expired. Please call /auth/mfa/setup again.');
      }

      const valid = TotpHelper.verify(pending.secret, dto.code);
      if (!valid) {
        throw new UnauthorizedException('Invalid MFA code');
      }

      // Persist MFA secret in the DB (stored in a metadata audit record keyed by userId)
      // We encode the secret in the AuditLog metadata and store a flag on the User.
      // A production system would have a dedicated mfaTotpSecret column. Since the schema
      // does not have one, we store the encrypted secret in an AuditLog with action MFA_SECRET_SET
      // and retrieve it on verify. However for a cleaner approach we store it base64-encoded
      // in an ApiKey record keyed by label='__mfa_secret__'.

      // Clean up any existing MFA secret record
      await this.prisma.apiKey.deleteMany({
        where: { userId, label: '__mfa_secret__' },
      });

      // Store TOTP secret as a special ApiKey record (no actual API-key usage)
      await this.prisma.apiKey.create({
        data: {
          userId,
          label: '__mfa_secret__',
          keyPrefix: 'mfa',
          keyHash: Buffer.from(pending.secret).toString('base64'),
        },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });

      pendingMfaSecrets.delete(userId);

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'MFA_ENABLED',
          entityType: 'User',
          entityId: userId,
        },
      });

      return { verified: true, mfaEnabled: true };
    }

    // Login challenge flow: challengeId is the userId resolved via challenge token
    const challengeUserId = dto.challengeId ?? userId;
    const user = await this.prisma.user.findUnique({ where: { id: challengeUserId } });
    if (!user || !user.mfaEnabled) {
      throw new BadRequestException('MFA not enabled for this user');
    }

    const secretRecord = await this.prisma.apiKey.findFirst({
      where: { userId: challengeUserId, label: '__mfa_secret__' },
    });
    if (!secretRecord) {
      throw new BadRequestException('MFA secret not found. Please re-setup MFA.');
    }

    const totpSecret = Buffer.from(secretRecord.keyHash, 'base64').toString();
    const valid = TotpHelper.verify(totpSecret, dto.code);
    if (!valid) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    // Issue full tokens after successful MFA verification
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);

    return {
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tier: user.tier,
      },
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return the same response to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const token = randomBytes(32).toString('hex');
    PasswordResetStore.set(token, user.id, user.email);

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
      },
    });

    this.mailService
      .sendPasswordReset(user.email, token, user.fullName)
      .catch(() => undefined);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const entry = PasswordResetStore.get(token);
    if (!entry) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: entry.userId },
      data: { passwordHash },
    });

    PasswordResetStore.delete(token);

    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'User',
        entityId: entry.userId,
      },
    });

    return { message: 'Password updated successfully' };
  }

  async oauthCallback(
    provider: string,
    providerUid: string,
    email: string,
    fullName: string,
    accessToken?: string,
    refreshToken?: string,
  ) {
    // Upsert user
    let user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          fullName,
          tier: 'FREE',
          subscriptions: {
            create: {
              tier: 'FREE',
              cycle: 'MONTHLY',
              amountMinor: 0,
              currency: 'USD',
              provider: 'internal',
              trialEndsAt,
              periodStartAt: now,
              periodEndAt: trialEndsAt,
              status: 'trialing',
            },
          },
        },
      });
    }

    // Upsert OAuth connection
    await this.prisma.oAuthConnection.upsert({
      where: { provider_providerUid: { provider, providerUid } },
      create: {
        userId: user.id,
        provider,
        providerUid,
        accessToken: accessToken ?? null,
        refreshToken: refreshToken ?? null,
      },
      update: {
        accessToken: accessToken ?? undefined,
        refreshToken: refreshToken ?? undefined,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OAUTH_LOGIN',
        entityType: 'OAuthConnection',
        entityId: user.id,
        metadata: { provider },
      },
    });

    const jwtAccessToken = await this.signAccessToken(user);
    const jwtRefreshToken = await this.signRefreshToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        tier: user.tier,
      },
      accessToken: jwtAccessToken,
      refreshToken: jwtRefreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'USER_LOGOUT',
        entityType: 'User',
        entityId: userId,
      },
    });
    return { message: 'Logged out successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  oauthProviders() {
    return [
      'google',
      'linkedin',
      'github',
      'gitlab',
      'upwork',
      'fiverr',
      'behance',
      'dribbble',
      'slack',
      'trello',
      'asana',
      'jira',
      'zapier',
      'google-workspace',
      'notion',
      'x',
      'youtube',
      'instagram',
      'facebook',
      'calendly',
    ];
  }

  private signAccessToken(user: TokenUser) {
    return this.jwtService.signAsync(
      { email: user.email, tier: user.tier },
      {
        subject: user.id,
        secret: process.env.JWT_ACCESS_SECRET ?? 'replace-with-32-char-secret',
        expiresIn: '15m',
      },
    );
  }

  private signRefreshToken(user: TokenUser) {
    return this.jwtService.signAsync(
      { tokenType: 'refresh' },
      {
        subject: user.id,
        secret: process.env.JWT_REFRESH_SECRET ?? 'replace-with-refresh-secret-32-char',
        expiresIn: '30d',
      },
    );
  }
}
