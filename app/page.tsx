"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanFilters } from "@/components/kanban/KanbanFilters";
import { supabase } from "@/lib/supabase/client";
import type { Atendimento } from "@/lib/supabase/types";
import { normalizeSearch } from "@/lib/format";
import { STATUS_ORDER } from "@/lib/status";
import { useRealtimeAtendimentos } from "@/hooks/useRealtimeAtendimentos";

const KANBAN_COLUMNS =
  "id,protocolo,telefone,responsavel_nome,paciente_nome,medico_solicitante,total_validado,total_bruto,status,termos_nao_encontrados,created_at,updated_at";

function KanbanPageContent() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadAtendimentos = useCallback(async () => {
    setError(null);
    const { data, error: loadError } = await supabase
      .from("atendimentos")
      .select(KANBAN_COLUMNS)
      .in("status", STATUS_ORDER)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
    } else {
      setAtendimentos((data || []) as Atendimento[]);
    }

    setLoading(false);
  }, []);

  const realtimeState = useRealtimeAtendimentos(loadAtendimentos);

  useEffect(() => {
    loadAtendimentos();
  }, [loadAtendimentos]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    if (!q) return atendimentos;

    return atendimentos.filter((atendimento) => {
      const haystack = normalizeSearch(
        [
          atendimento.protocolo,
          atendimento.paciente_nome,
          atendimento.telefone,
          atendimento.medico_solicitante,
          atendimento.responsavel_nome
        ].join(" ")
      );
      return haystack.includes(q);
    });
  }, [atendimentos, query]);

  return (
    <AppShell onRefresh={loadAtendimentos} realtimeState={realtimeState}>
      <KanbanFilters value={query} onChange={setQuery} />

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Carregando atendimentos...</div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Erro ao carregar atendimentos: {error}
        </div>
      ) : (
        <KanbanBoard atendimentos={filtered} onChanged={loadAtendimentos} />
      )}
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <AuthGate>
      <KanbanPageContent />
    </AuthGate>
  );
}
