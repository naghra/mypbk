import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: { select: { email: true, profile: { select: { nickname: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return jsonOk(subscriptions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(["ADMIN"]);
    const body = await request.json();
    const sub = await prisma.subscription.update({
      where: { userId: body.userId },
      data: {
        tier: body.tier,
        status: body.status,
        likesRemaining: body.likesRemaining,
      },
    });
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_SUBSCRIPTION",
        targetType: "subscription",
        targetId: sub.id,
        metadata: body,
      },
    });
    return jsonOk(sub);
  } catch (error) {
    return handleApiError(error);
  }
}
