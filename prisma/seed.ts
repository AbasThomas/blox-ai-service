import { PrismaClient, PlanTier, BillingCycle, AssetType, Visibility } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@blox.app' },
    update: {},
    create: {
      email: 'demo@blox.app',
      fullName: 'Demo User',
      tier: PlanTier.PRO,
      persona: 'Freelancer',
    },
  });

  await prisma.asset.upsert({
    where: { id: 'seed-asset-portfolio' },
    update: {},
    create: {
      id: 'seed-asset-portfolio',
      userId: user.id,
      type: AssetType.PORTFOLIO,
      title: 'Demo Portfolio',
      visibility: Visibility.PUBLIC,
      healthScore: 87,
      content: {
        hero: 'Designing growth-ready products',
        skills: ['TypeScript', 'Next.js', 'NestJS'],
      },
    },
  });

  await prisma.subscription.upsert({
    where: { id: 'seed-subscription-pro' },
    update: {},
    create: {
      id: 'seed-subscription-pro',
      userId: user.id,
      tier: PlanTier.PRO,
      cycle: BillingCycle.MONTHLY,
      amountMinor: 999,
      periodStartAt: new Date(),
      periodEndAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      status: 'active',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

