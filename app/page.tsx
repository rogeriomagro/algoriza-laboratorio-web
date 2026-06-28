"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanFilters } from "@/components/kanban/KanbanFilters";
import { supabase } from "@/lib/supabase/client";
import type { Atendimento } from "@/lib/supabase/types";
import { labFromUnidade, normalizeSearch } from "@/lib/format";
import { STATUS_ORDER } from "@/lib/status";
import { useRealtimeAtendimentos } from "@/hooks/useRealtimeAtendimentos";

const KANBAN_COLUMNS =
  "id,protocolo,telefone,responsavel_nome,paciente_nome,medico_solicitante,total_validado,total_bruto,desconto_pct,desconto_tipo,desconto_reais,status,termos_nao_encontrados,unidade_preferida,validado_por,created_at,updated_at";

function KanbanPageContent() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [validador, setValidador] = useState("");
  const [lab, setLab] = useState("");
  const [usuariosCadastrados, setUsuariosCadastrados] = useState<string[]>([]);

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
    for (const atendimento of atendimentos) {
      const nome = (atendimento.validado_por || "").trim();
      if (nome) set.add(nome);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [usuariosCadastrados, atendimentos]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);

    return atendimentos.filter((atendimento) => {
      if (q) {
        const haystack = normalizeSearch(
          [
            atendimento.protocolo,
            atendimento.paciente_nome,
            atendimento.telefone,
            atendimento.medico_solicitante,
            atendimento.responsavel_nome
          ].join(" ")
        );
        if (!haystack.includes(q)) return false;
      }

      if (validador && (atendimento.validado_por || "").trim() !== validador) return false;

      if (lab && labFromUnidade(atendimento.unidade_preferida) !== lab) return false;

      return true;
    });
  }, [atendimentos, query, validador, lab]);

  return (
    <AppShell onRefresh={loadAtendimentos} realtimeState={realtimeState}>
      <KanbanFilters
        value={query}
        onChange={setQuery}
        validador={validador}
        onValidadorChange={setValidador}
        validadores={validadores}
        lab={lab}
        onLabChange={setLab}
      />

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
