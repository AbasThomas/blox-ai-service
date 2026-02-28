import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { BillingCycle, PlanTier } from '@nextjs-blox/shared-types';
import { User } from '@prisma/client';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@CurrentUser() user: User) {
    return this.billingService.getCurrentSubscription(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(
    @CurrentUser() user: User,
    @Body() payload: { tier: PlanTier; cycle: BillingCycle; currency?: string },
  ) {
    return this.billingService.createCheckout(user.id, user.email, payload.tier, payload.cycle, payload.currency);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(@Body('reference') reference: string) {
    return this.billingService.verifyPayment(reference);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancel(@CurrentUser() user: User, @Body('immediate') immediate?: boolean) {
    return this.billingService.cancel(user.id, immediate ?? false);
  }

  @Post('webhooks/paystack')
  @HttpCode(200)
  webhook(
    @Req() req: Request,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const rawBody = JSON.stringify(req.body);
    const valid = this.billingService.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      throw new UnauthorizedException('Invalid Paystack signature');
    }
    return this.billingService.handleWebhook(req.body);
  }
}


