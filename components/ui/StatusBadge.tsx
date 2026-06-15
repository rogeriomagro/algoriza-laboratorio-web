import type { AtendimentoStatus } from "@/lib/supabase/types";
import { STATUS_BADGE_CLASS, STATUS_LABEL } from "@/lib/status";

export function StatusBadge({ status }: { status: AtendimentoStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
