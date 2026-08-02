import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { estimatePhotoFakeScore } from "@/lib/moderation/content";
import { handleApiError, jsonError, jsonOk } from "@/lib/api/response";
import { rateLimit } from "@/lib/security/rate-limit";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function GET() {
  try {
    const user = await requireUser();
    const photos = await prisma.photo.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
    return jsonOk(photos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const limited = await rateLimit({ key: `photo:${user.id}`, limit: 10, windowMs: 60_000 });
    if (!limited.success) return jsonError("Too many requests", 429);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("File required", 400);
    if (!ALLOWED.has(file.type)) return jsonError("Only JPEG, PNG, WebP allowed", 400);
    if (file.size > MAX_BYTES) return jsonError("Max file size is 5MB", 400);

    const count = await prisma.photo.count({ where: { userId: user.id } });
    if (count >= 6) return jsonError("Maximum 6 photos", 400);

    const aiFakeScore = estimatePhotoFakeScore({
      fileSize: file.size,
      mimeType: file.type,
    });
    if (aiFakeScore > 0.85) {
      return jsonError("Photo failed authenticity checks", 422, { aiFakeScore });
    }

    const ext = file.type.split("/")[1] ?? "jpg";
    const path = `${user.supabaseAuthId ?? user.id}/${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const admin = createAdminClient();
    const { error } = await admin.storage.from("profile-photos").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return jsonError(error.message, 400);

    const { data: pub } = admin.storage.from("profile-photos").getPublicUrl(path);

    const photo = await prisma.photo.create({
      data: {
        userId: user.id,
        url: pub.publicUrl,
        storagePath: path,
        isPrimary: count === 0,
        sortOrder: count,
        isApproved: aiFakeScore < 0.55,
        aiFakeScore,
      },
    });

    return jsonOk(photo);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return jsonError("Photo id required", 400);

    const photo = await prisma.photo.findFirst({ where: { id, userId: user.id } });
    if (!photo) return jsonError("Not found", 404);

    try {
      const admin = createAdminClient();
      await admin.storage.from("profile-photos").remove([photo.storagePath]);
    } catch {
      // storage cleanup best-effort
    }

    await prisma.photo.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
