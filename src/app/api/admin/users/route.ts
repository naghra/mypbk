import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { profile: { nickname: { contains: q, mode: "insensitive" } } },
              { profile: { fullName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : undefined,
      include: {
        profile: true,
        subscription: true,
        _count: { select: { reportsAgainst: true, photos: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "LIST_USERS",
        metadata: { q },
      },
    });

    return jsonOk(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(["ADMIN"]);
    const body = await request.json();
    const user = await prisma.user.update({
      where: { id: body.userId },
      data: {
        isBanned: body.isBanned ?? undefined,
        banReason: body.banReason ?? undefined,
        isActive: body.isActive ?? undefined,
        role: body.role ?? undefined,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "UPDATE_USER",
        targetType: "user",
        targetId: user.id,
        metadata: body,
      },
    });

    return jsonOk(user);
  } catch (error) {
    return handleApiError(error);
  }
}
