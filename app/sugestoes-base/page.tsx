"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Filter, RefreshCw, Search, X } from "lucide-react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase/client";
import { formatDate, normalizeSearch } from "@/lib/format";
import type { SugestaoCatalogo, SugestaoCatalogoRisco, SugestaoCatalogoStatus } from "@/lib/supabase/types";
import { useValidatorName } from "@/hooks/useValidatorName";

const SELECT_FIELDS =
  "id,sku,nome_exame,sinonimo_sugerido,termo_original,contexto,atendimento_id,protocolo,ocorrencias,risco,status,origem,observacao,criado_por,aprovado_por,aprovado_em,rejeitado_por,rejeitado_em,aplicado,created_at,updated_at";

const STATUS_OPTIONS: Array<{ value: SugestaoCatalogoStatus | "todos"; label: string }> = [
  { value: "pendente", label: "Pendentes" },
  { value: "aprovado", label: "Aprovadas" },
  { value: "rejeitado", label: "Rejeitadas" },
  { value: "todos", label: "Todas" }
];

const RISK_OPTIONS: Array<{ value: SugestaoCatalogoRisco | "todos"; label: string }> = [
  { value: "todos", label: "Todos os riscos" },
  { value: "alto", label: "Alto risco" },
  { value: "medio", label: "Médio risco" },
  { value: "baixo", label: "Baixo risco" }
];

const RISK_CLASS: Record<SugestaoCatalogoRisco, string> = {
  baixo: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medio: "border-amber-200 bg-amber-50 text-amber-800",
  alto: "border-rose-200 bg-rose-50 text-rose-800"
};

function riskLabel(risco: SugestaoCatalogoRisco) {
  if (risco === "baixo") return "Baixo risco";
  if (risco === "alto") return "Alto risco";
  return "Médio risco";
}

function toCount(value: number | string | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function groupKey(sugestao: SugestaoCatalogo) {
  return `${sugestao.sku || "sem-sku"}::${sugestao.nome_exame}`;
}

function SugestoesBaseContent() {
  const { validatorName } = useValidatorName();
  const [items, setItems] = useState<SugestaoCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SugestaoCatalogoStatus | "todos">("pendente");
  const [risk, setRisk] = useState<SugestaoCatalogoRisco | "todos">("todos");

  const loadSugestoes = useCallback(async () => {
    setError(null);
    const request = supabase
      .from("sugestoes_catalogo")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false });

    const { data, error: loadError } = await request;

    if (loadError) {
      setError(loadError.message);
      setItems([]);
    } else {
      setItems((data || []) as SugestaoCatalogo[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSugestoes();
  }, [loadSugestoes]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    return items.filter((item) => {
      if (status !== "todos" && item.status !== status) return false;
      if (risk !== "todos" && item.risco !== risk) return false;
      if (!q) return true;

      const haystack = normalizeSearch(
        [
          item.sku,
          item.nome_exame,
          item.sinonimo_sugerido,
          item.termo_original,
          item.protocolo,
          item.contexto
        ].join(" ")
      );
      return haystack.includes(q);
    });
  }, [items, query, risk, status]);

  const groups = useMemo(() => {
    const map = new Map<string, SugestaoCatalogo[]>();
    for (const item of filtered) {
      const key = groupKey(item);
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
    }
    return Array.from(map.entries()).map(([key, sugestoes]) => ({ key, sugestoes }));
  }, [filtered]);

  const summary = useMemo(() => {
    const pending = items.filter((item) => item.status === "pendente").length;
    const highRisk = items.filter((item) => item.status === "pendente" && item.risco === "alto").length;
    const approved = items.filter((item) => item.status === "aprovado").length;
    const rejected = items.filter((item) => item.status === "rejeitado").length;
    return { pending, highRisk, approved, rejected };
  }, [items]);

  async function runAction(id: string, action: "approve" | "reject") {
    setSavingId(id);
    setError(null);

    const fn = action === "approve" ? "aprovar_sugestao_catalogo" : "rejeitar_sugestao_catalogo";
    const { error: actionError } = await supabase.rpc(fn, {
      p_sugestao_id: id,
      p_usuario: validatorName || null
    });

    setSavingId(null);

    if (actionError) {
      setError(actionError.message);
      return;
    }

    await loadSugestoes();
  }

  async function runGroupAction(sugestoes: SugestaoCatalogo[], action: "approve" | "reject") {
    const pending = sugestoes.filter((item) => item.status === "pendente");
    if (pending.length === 0) return;

    const label = action === "approve" ? "aprovar" : "rejeitar";
    const ok = window.confirm(`Deseja ${label} ${pending.length} sugestão(ões) deste exame?`);
    if (!ok) return;

    setError(null);
    for (const item of pending) {
      setSavingId(item.id);
      const fn = action === "approve" ? "aprovar_sugestao_catalogo" : "rejeitar_sugestao_catalogo";
      const { error: actionError } = await supabase.rpc(fn, {
        p_sugestao_id: item.id,
        p_usuario: validatorName || null
      });

      if (actionError) {
        setSavingId(null);
        setError(actionError.message);
        await loadSugestoes();
        return;
      }
    }

    setSavingId(null);
    await loadSugestoes();
  }

  return (
    <AppShell onRefresh={loadSugestoes}>
      <div className="space-y-4">
        <section className="section">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-950">Sugestões da base</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Revise termos corrigidos pela equipe antes de incorporá-los como sinônimos oficiais no catálogo.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={loadSugestoes}>
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-brand-forest/10 bg-brand-mint/40 p-3">
              <p className="text-xs text-slate-500">Pendentes</p>
              <p className="mt-1 text-2xl font-semibold text-brand-forest">{summary.pending}</p>
            </div>
            <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
              <p className="text-xs text-rose-700">Alto risco</p>
              <p className="mt-1 text-2xl font-semibold text-rose-800">{summary.highRisk}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700">Aprovadas</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-800">{summary.approved}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Rejeitadas</p>
              <p className="mt-1 text-2xl font-semibold text-slate-700">{summary.rejected}</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="field-input pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por exame, SKU, sinônimo, protocolo ou contexto"
              />
            </label>
            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select className="field-input pl-9" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <select className="field-input" value={risk} onChange={(event) => setRisk(event.target.value as typeof risk)}>
              {RISK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </section>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="section text-center text-sm text-slate-600">Carregando sugestões...</div>
        ) : groups.length === 0 ? (
          <div className="section text-center text-sm text-slate-600">Nenhuma sugestão encontrada para os filtros atuais.</div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ key, sugestoes }) => {
              const first = sugestoes[0];
              const pending = sugestoes.filter((item) => item.status === "pendente");
              const totalOccurrences = sugestoes.reduce((sum, item) => sum + toCount(item.ocorrencias), 0);

              return (
                <article key={key} className="rounded-lg border border-brand-forest/10 bg-white/95 p-4 shadow-sm shadow-brand-forest/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-950">{first.nome_exame}</h2>
                        <span className="rounded-full border border-brand-forest/15 bg-brand-mint/60 px-2 py-1 text-xs font-semibold text-brand-forest">
                          SKU: {first.sku || "sem SKU"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {sugestoes.length} sugestão(ões) · {totalOccurrences} ocorrência(s)
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn btn-secondary"
                        disabled={pending.length === 0 || Boolean(savingId)}
                        onClick={() => runGroupAction(sugestoes, "reject")}
                      >
                        <X className="h-4 w-4" />
                        Rejeitar pendentes
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={pending.length === 0 || Boolean(savingId)}
                        onClick={() => runGroupAction(sugestoes, "approve")}
                      >
                        <Check className="h-4 w-4" />
                        Aprovar pendentes
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {sugestoes.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-brand-mint/25 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md border border-brand-forest/15 bg-white px-2 py-1 text-sm font-semibold text-slate-950">
                                {item.sinonimo_sugerido}
                              </span>
                              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${RISK_CLASS[item.risco]}`}>
                                {riskLabel(item.risco)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                                {item.status}
                              </span>
                              {item.risco === "alto" ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  revisar contexto
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-2 space-y-1 text-xs text-slate-600">
                              <p>Termo original: <span className="font-medium text-slate-800">{item.termo_original || "-"}</span></p>
                              <p>Protocolo: <span className="font-medium text-slate-800">{item.protocolo || "-"}</span></p>
                              <p>Ocorrências: <span className="font-medium text-slate-800">{toCount(item.ocorrencias)}</span></p>
                              <p>Criada em: <span className="font-medium text-slate-800">{formatDate(item.created_at)}</span></p>
                              {item.contexto ? (
                                <p className="mt-2 rounded-md border border-slate-100 bg-white/80 p-2 text-slate-700">
                                  {item.contexto}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 gap-2">
                            <button
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-100 bg-white text-rose-700 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                              title="Rejeitar sinônimo"
                              disabled={item.status !== "pendente" || savingId === item.id}
                              onClick={() => runAction(item.id, "reject")}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-emerald-100 bg-white text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
                              title="Aprovar sinônimo"
                              disabled={item.status !== "pendente" || savingId === item.id}
                              onClick={() => runAction(item.id, "approve")}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function SugestoesBasePage() {
  return (
    <AuthGate>
      <SugestoesBaseContent />
    </AuthGate>
  );
}
