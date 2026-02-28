import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly fromAddress: string;

  constructor() {
    this.fromAddress =
      process.env.MAIL_FROM ?? 'Blox <noreply@blox.app>';

    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'smtp.mailtrap.io',
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER ?? '',
        pass: process.env.MAIL_PASS ?? '',
      },
    });
  }

  async sendPasswordReset(email: string, token: string, name: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Reset your Blox password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}"
                 style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                Reset Password
              </a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <hr style="margin-top: 32px;" />
            <p style="color:#999;font-size:12px;">Blox &mdash; Your professional portfolio platform</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
    }
  }

  async sendWelcome(email: string, name: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Welcome to Blox!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Blox, ${name}!</h2>
            <p>Your account is ready. You're on the FREE plan with a 7-day trial of PRO features.</p>
            <p style="margin: 24px 0;">
              <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/dashboard"
                 style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                Go to Dashboard
              </a>
            </p>
            <p>Start by creating your first portfolio or resume.</p>
            <hr style="margin-top: 32px;" />
            <p style="color:#999;font-size:12px;">Blox &mdash; Your professional portfolio platform</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    }
  }

  async sendSubscriptionConfirmation(
    email: string,
    tier: string,
    cycle: string,
    name: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: `Your Blox ${tier} subscription is active`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Subscription Confirmed</h2>
            <p>Hi ${name},</p>
            <p>Your <strong>${tier}</strong> plan (${cycle}) is now active. Enjoy all the premium features!</p>
            <p style="margin: 24px 0;">
              <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/dashboard"
                 style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                Start Creating
              </a>
            </p>
            <hr style="margin-top: 32px;" />
            <p style="color:#999;font-size:12px;">Blox &mdash; Your professional portfolio platform</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send subscription confirmation email to ${email}`, error);
    }
  }

  async sendSubscriptionCancelled(email: string, name: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: 'Your Blox subscription has been cancelled',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Subscription Cancelled</h2>
            <p>Hi ${name},</p>
            <p>Your subscription has been cancelled. You will retain access until the end of your current billing period.</p>
            <p>We're sorry to see you go. If you change your mind, you can resubscribe at any time.</p>
            <p style="margin: 24px 0;">
              <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/billing"
                 style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                Resubscribe
              </a>
            </p>
            <hr style="margin-top: 32px;" />
            <p style="color:#999;font-size:12px;">Blox &mdash; Your professional portfolio platform</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send cancellation email to ${email}`, error);
    }
  }

  async sendCollaborationInvite(
    email: string,
    assetTitle: string,
    inviterName: string,
    link: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: email,
        subject: `${inviterName} invited you to collaborate on "${assetTitle}"`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Collaboration Invite</h2>
            <p><strong>${inviterName}</strong> has invited you to collaborate on their asset: <em>${assetTitle}</em>.</p>
            <p style="margin: 24px 0;">
              <a href="${link}"
                 style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                View Asset
              </a>
            </p>
            <hr style="margin-top: 32px;" />
            <p style="color:#999;font-size:12px;">Blox &mdash; Your professional portfolio platform</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send collaboration invite email to ${email}`, error);
    }
  }
}
