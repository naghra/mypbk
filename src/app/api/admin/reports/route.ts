import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { email: true, profile: { select: { nickname: true } } } },
        reported: { select: { email: true, profile: { select: { nickname: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk(reports);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const report = await prisma.report.update({
      where: { id: body.id },
      data: {
        status: body.status,
        resolution: body.resolution,
        resolvedBy: admin.id,
      },
    });
    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "RESOLVE_REPORT",
        targetType: "report",
        targetId: report.id,
        metadata: body,
      },
    });
    return jsonOk(report);
  } catch (error) {
    return handleApiError(error);
  }
}
