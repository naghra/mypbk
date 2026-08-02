import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();
    const [flaggedMessages, pendingPhotos, suspiciousProfiles] = await Promise.all([
      prisma.message.findMany({
        where: { moderationStatus: { in: ["FLAGGED", "BLOCKED"] } },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { sender: { select: { email: true } } },
      }),
      prisma.photo.findMany({
        where: { isApproved: false },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.profile.findMany({
        where: { fakeScore: { gte: 0.7 } },
        orderBy: { fakeScore: "desc" },
        take: 50,
        include: { user: { select: { email: true } } },
      }),
    ]);
    return jsonOk({ flaggedMessages, pendingPhotos, suspiciousProfiles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    if (body.photoId) {
      const photo = await prisma.photo.update({
        where: { id: body.photoId },
        data: {
          isApproved: Boolean(body.approved),
          moderationNote: body.note,
        },
      });
      await prisma.adminLog.create({
        data: {
          adminId: admin.id,
          action: "MODERATE_PHOTO",
          targetType: "photo",
          targetId: photo.id,
          metadata: body,
        },
      });
      return jsonOk(photo);
    }

    if (body.messageId) {
      const message = await prisma.message.update({
        where: { id: body.messageId },
        data: { moderationStatus: body.status },
      });
      return jsonOk(message);
    }

    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
