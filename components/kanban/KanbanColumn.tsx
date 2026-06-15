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
    <section className="min-h-[520px] rounded-lg border border-brand-forest/10 bg-white/60 shadow-sm shadow-brand-forest/5 backdrop-blur">
      <div className="border-b border-brand-forest/10 bg-gradient-to-r from-brand-mint to-white p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-brand-charcoal">{title}</h2>
          <span className="rounded-full border border-brand-emerald/20 bg-brand-emerald/10 px-2 py-1 text-xs font-semibold text-brand-forest">{items.length}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <div className="space-y-3 p-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-brand-silver bg-white/80 p-4 text-center text-xs text-slate-500">
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
