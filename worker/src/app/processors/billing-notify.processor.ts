import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

type BillingEvent = 'renewal_success' | 'renewal_failed' | 'trial_ending' | 'cancelled' | 'upgraded';

@Processor('billing-notify')
export class BillingNotifyProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingNotifyProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'localhost',
      port: Number(process.env.MAIL_PORT ?? 1025),
      secure: false,
      auth: process.env.MAIL_USER
        ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
        : undefined,
    });
  }

  async process(
    job: Job<{ userId: string; event: BillingEvent; tier?: string; daysRemaining?: number }>,
  ) {
    const { userId, event, tier, daysRemaining } = job.data;
    this.logger.log(`[billing-notify] ${event} for user ${userId}`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { skipped: true, reason: 'user not found' };

    // Create in-app notification
    const notifications: Record<BillingEvent, { title: string; body: string }> = {
      renewal_success: {
        title: 'Subscription renewed successfully',
        body: `Your ${tier ?? 'plan'} subscription has been renewed.`,
      },
      renewal_failed: {
        title: 'Subscription renewal failed',
        body: 'We could not renew your subscription. Please update your payment method.',
      },
      trial_ending: {
        title: `Trial ending in ${daysRemaining ?? 3} days`,
        body: 'Upgrade now to keep access to premium features.',
      },
      cancelled: {
        title: 'Subscription cancelled',
        body: "Your subscription has been cancelled. You'll retain access until period end.",
      },
      upgraded: {
        title: `Welcome to ${tier ?? 'your new plan'}!`,
        body: 'Your plan has been upgraded. Enjoy all the new features!',
      },
    };

    const notif = notifications[event];
    await this.prisma.notification.create({
      data: {
        userId,
        type: `billing_${event}`,
        title: notif.title,
        payload: { event, tier, daysRemaining },
      },
    });

    // Send email
    try {
      const from = process.env.MAIL_FROM ?? 'Blox <noreply@blox.app>';
      await this.transporter.sendMail({
        from,
        to: user.email,
        subject: notif.title,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>${notif.title}</h2>
            <p>Hi ${user.fullName},</p>
            <p>${notif.body}</p>
            <p><a href="${process.env.APP_BASE_URL ?? 'http://localhost:4200'}/settings"
              style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
              Manage Subscription
            </a></p>
            <hr/><p style="color:#999;font-size:12px;">Blox &mdash; Your professional portfolio platform</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.warn(`[billing-notify] Email failed for ${user.email}: ${err}`);
    }

    return { userId, event, notified: true };
  }
}
