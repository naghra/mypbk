import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { preferenceSchema } from "@/lib/validations/profile";
import { handleApiError, jsonOk } from "@/lib/api/response";

export async function GET() {
  try {
    const user = await requireUser();
    const prefs = await prisma.preference.findUnique({ where: { userId: user.id } });
    return jsonOk(prefs);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = preferenceSchema.parse(await request.json());
    const prefs = await prisma.preference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    });
    return jsonOk(prefs);
  } catch (error) {
    return handleApiError(error);
  }
}
