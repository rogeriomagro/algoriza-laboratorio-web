import { Loader2 } from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import { AtendimentoCard } from "@/components/kanban/AtendimentoCard";

interface KanbanColumnProps {
  title: string;
  description: string;
  items: Atendimento[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  onChanged?: () => void | Promise<void>;
}

export function KanbanColumn({
  title,
  description,
  items,
  total,
  loading,
  loadingMore,
  error,
  onLoadMore,
  onChanged,
}: KanbanColumnProps) {
  const hasMore = items.length < total;

  return (
    <section className="min-h-[520px] rounded-lg border border-slate-200 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur">
      <div className="border-b border-slate-200 bg-[linear-gradient(90deg,#f8fcfa_0%,#ffffff_72%,#f0f8f4_100%)] p-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          <span className="rounded-full border border-brand-emerald/15 bg-brand-mint px-2 py-0.5 text-xs font-semibold text-brand-forest">
            {total}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-600">{description}</p>
      </div>

      <div className="scrollbar-thin max-h-[calc(100vh-16rem)] space-y-2.5 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            Erro ao carregar: {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
            Nenhum atendimento nesta coluna.
          </div>
        ) : (
          <>
            {items.map((atendimento) => (
              <AtendimentoCard key={atendimento.id} atendimento={atendimento} onChanged={onChanged} />
            ))}

            {hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                disabled={loadingMore}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-brand-forest transition hover:border-brand-emerald/40 hover:bg-brand-mint/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>Carregar mais ({total - items.length} restantes)</>
                )}
              </button>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
