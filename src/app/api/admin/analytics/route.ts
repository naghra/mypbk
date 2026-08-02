import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    await requireAdmin();
    const [
      users,
      profilesComplete,
      matches,
      messages,
      openReports,
      pendingVerifications,
      premium,
      interestsToday,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count({ where: { isComplete: true } }),
      prisma.match.count({ where: { status: "MATCHED" } }),
      prisma.message.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.subscription.count({ where: { tier: "PREMIUM", status: "ACTIVE" } }),
      prisma.interest.count({
        where: {
          action: "INTERESTED",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return jsonOk({
      users,
      profilesComplete,
      matches,
      messages,
      openReports,
      pendingVerifications,
      premium,
      interestsToday,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
