import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { reportSchema } from "@/lib/validations/messaging";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const limited = await rateLimit({ key: `report:${user.id}`, limit: 10, windowMs: 3600_000 });
    if (!limited.success) return jsonError("Too many reports", 429);

    const body = reportSchema.parse(await request.json());
    if (body.reportedId === user.id) return jsonError("Invalid", 400);

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedId: body.reportedId,
        reason: body.reason,
        description: body.description,
      },
    });

    return jsonOk(report);
  } catch (error) {
    return handleApiError(error);
  }
}
