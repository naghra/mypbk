import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.verification.findMany({
      include: {
        user: { select: { email: true, profile: { select: { nickname: true, fullName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const item = await prisma.verification.update({
      where: { id: body.id },
      data: {
        status: body.status,
        reviewerNotes: body.notes,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    if (body.status === "APPROVED") {
      const approved = await prisma.verification.count({
        where: { userId: item.userId, status: "APPROVED" },
      });
      if (approved >= 2) {
        await prisma.profile.updateMany({
          where: { userId: item.userId },
          data: { isVerified: true },
        });
      }
      await prisma.notification.create({
        data: {
          userId: item.userId,
          type: "VERIFICATION_UPDATE",
          title: "Verification approved",
          body: "Your verification request was approved.",
        },
      });
    } else if (body.status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: item.userId,
          type: "VERIFICATION_UPDATE",
          title: "Verification rejected",
          body: body.notes || "Please resubmit clearer documents.",
        },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "REVIEW_VERIFICATION",
        targetType: "verification",
        targetId: item.id,
        metadata: body,
      },
    });

    return jsonOk(item);
  } catch (error) {
    return handleApiError(error);
  }
}
