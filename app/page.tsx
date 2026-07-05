"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanFilters } from "@/components/kanban/KanbanFilters";
import { supabase } from "@/lib/supabase/client";
import type { KanbanFilters as KanbanFiltersValue } from "@/lib/kanban";
import { useKanbanBoard } from "@/hooks/useKanbanBoard";
import { useRealtimeAtendimentos } from "@/hooks/useRealtimeAtendimentos";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function KanbanPageContent() {
  const [query, setQuery] = useState("");
  const [validador, setValidador] = useState("");
  const [lab, setLab] = useState("");
  const [usuariosCadastrados, setUsuariosCadastrados] = useState<string[]>([]);

  // A busca por texto é debounced para não disparar uma query por tecla.
  const debouncedQuery = useDebounced(query.trim(), 350);
  const filters: KanbanFiltersValue = useMemo(
    () => ({ query: debouncedQuery, validador, lab }),
    [debouncedQuery, validador, lab]
  );

  const { columns, loadMore, refresh } = useKanbanBoard(filters);
  const realtimeState = useRealtimeAtendimentos(refresh);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("kanban_usuarios")
        .select("nome")
        .eq("ativo", true)
        .order("nome", { ascending: true });
      if (data) {
        setUsuariosCadastrados(
          (data as { nome: string | null }[]).map((u) => (u.nome || "").trim()).filter(Boolean)
        );
      }
    })();
  }, []);

  const validadores = useMemo(() => {
    const set = new Set<string>();
    for (const nome of usuariosCadastrados) if (nome) set.add(nome);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [usuariosCadastrados]);

  return (
    <AppShell onRefresh={refresh} realtimeState={realtimeState}>
      <KanbanFilters
        value={query}
        onChange={setQuery}
        validador={validador}
        onValidadorChange={setValidador}
        validadores={validadores}
        lab={lab}
        onLabChange={setLab}
      />

      <KanbanBoard columns={columns} onLoadMore={loadMore} onChanged={refresh} />
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
