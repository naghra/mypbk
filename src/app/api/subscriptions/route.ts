import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    const user = await requireUser();
    const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
    return jsonOk(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}

/** Demo upgrade endpoint — wire to Stripe webhooks in production. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const tier = body.tier === "PREMIUM" ? "PREMIUM" : "FREE";

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        tier,
        status: "ACTIVE",
        likesRemaining: tier === "PREMIUM" ? 999999 : Number(process.env.FREE_DAILY_LIKES ?? 10),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        tier,
        status: "ACTIVE",
        likesRemaining: tier === "PREMIUM" ? 999999 : Number(process.env.FREE_DAILY_LIKES ?? 10),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    if (tier === "PREMIUM") {
      await prisma.profile.updateMany({
        where: { userId: user.id },
        data: { isPriority: true },
      });
    }

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SUBSCRIPTION",
        title: tier === "PREMIUM" ? "Premium activated" : "Back to Free",
        body:
          tier === "PREMIUM"
            ? "Unlimited interests, who liked you, and advanced filters are unlocked."
            : "You are on the Free plan.",
      },
    });

    return jsonOk(subscription);
  } catch (error) {
    return handleApiError(error);
  }
}
