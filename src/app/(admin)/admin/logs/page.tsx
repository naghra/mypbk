export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLogsPage() {
  await requireAdmin();
  const logs = await prisma.adminLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { admin: { select: { email: true } } },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Admin logs</h1>
      <ul className="mt-6 space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="rounded-2xl border border-emerald-100/80 bg-white/80 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-slate-950/70">
            <span className="font-medium">{log.admin.email}</span> · {log.action}
            {log.targetType ? ` · ${log.targetType}:${log.targetId}` : ""}
            <div className="text-xs text-slate-500">{log.createdAt.toISOString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
