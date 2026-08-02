import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function rateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<{ success: boolean; remaining: number }> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  try {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: {
        key_windowStart: { key, windowStart },
      },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });

    const remaining = Math.max(0, limit - bucket.count);
    return { success: bucket.count <= limit, remaining };
  } catch {
    // Fail open if DB unavailable during local bootstrap
    return { success: true, remaining: limit };
  }
}
