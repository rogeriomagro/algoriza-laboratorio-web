import type { Atendimento } from "@/lib/supabase/types";
import { AtendimentoCard } from "@/components/kanban/AtendimentoCard";

interface KanbanColumnProps {
  title: string;
  description: string;
  items: Atendimento[];
  onChanged?: () => void | Promise<void>;
}

export function KanbanColumn({ title, description, items, onChanged }: KanbanColumnProps) {
  return (
    <section className="min-h-[520px] rounded-xl border border-slate-200 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur">
      <div className="border-b border-slate-200 bg-[linear-gradient(90deg,#f8fcfa_0%,#ffffff_72%,#f0f8f4_100%)] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <span className="rounded-full border border-brand-emerald/15 bg-brand-mint px-2.5 py-1 text-xs font-semibold text-brand-forest">
            {items.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <div className="space-y-3 p-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Nenhum atendimento nesta coluna.
          </div>
        ) : (
          items.map((atendimento) => (
            <AtendimentoCard key={atendimento.id} atendimento={atendimento} onChanged={onChanged} />
          ))
        )}
      </div>
    </section>
  );
}
