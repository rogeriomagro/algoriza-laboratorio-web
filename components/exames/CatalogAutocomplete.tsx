"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { AtendimentoExame, CatalogoExame } from "@/lib/supabase/types";
import { formatCurrency, formatDays, formatHours } from "@/lib/format";

function safeSearchTerm(value: string) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

function dedupeCatalogResults(items: CatalogoExame[]) {
  const map = new Map<string, CatalogoExame>();
  for (const item of items) {
    const key = `${item.sku || ""}::${item.nome}`;
    if (!map.has(key)) map.set(key, item);
  }
  return Array.from(map.values());
}

interface CatalogAutocompleteProps {
  atendimentoId: string;
  exames: AtendimentoExame[];
  readOnly: boolean;
  initialSearch: string;
  onConsumedInitialSearch: () => void;
  onAdded: () => Promise<void>;
}

export function CatalogAutocomplete({
  atendimentoId,
  exames,
  readOnly,
  initialSearch,
  onConsumedInitialSearch,
  onAdded
}: CatalogAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogoExame[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingSku, setAddingSku] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialSearch) return;
    setQuery(initialSearch);
    onConsumedInitialSearch();
  }, [initialSearch, onConsumedInitialSearch]);

  useEffect(() => {
    const term = safeSearchTerm(query);
    if (term.length < 2) {
      setResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      const filter = `nome.ilike.*${term}*,sku.ilike.*${term}*,sinonimos.ilike.*${term}*`;

      const [matchResponse, catalogResponse] = await Promise.all([
        supabase.rpc("match_termos_exames", { termos: [term] }),
        supabase
          .from("catalogo_exames")
          .select("sku,nome,sinonimos,preco,material,metodo,preparo,prazo_dias,jejum_horas")
          .or(filter)
          .order("nome", { ascending: true })
          .limit(12)
      ]);

      const searchError = matchResponse.error || catalogResponse.error;

      if (searchError) {
        setError(searchError.message);
        setResults([]);
      } else {
        const matched = ((matchResponse.data || []) as CatalogoExame[]).filter((item) => item.nome);
        const catalog = (catalogResponse.data || []) as CatalogoExame[];
        setResults(dedupeCatalogResults([...matched, ...catalog]).slice(0, 12));
      }

      setLoading(false);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const nextOrder = useMemo(() => {
    const current = exames.map((exame) => exame.ordem || 0);
    return current.length ? Math.max(...current) + 1 : 1;
  }, [exames]);

  const searchTerm = safeSearchTerm(query);

  async function addExam(exame: CatalogoExame) {
    setAddingSku(exame.sku || exame.nome);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("atendimento_exames")
      .insert({
        atendimento_id: atendimentoId,
        sku: exame.sku,
        nome: exame.nome,
        preco: exame.preco,
        preparo: exame.preparo,
        prazo_dias: exame.prazo_dias,
        jejum_horas: exame.jejum_horas,
        termo_original: query || exame.nome,
        match_por: "manual_catalogo",
        ambiguo: false,
        incluido: true,
        editado_manual: true,
        ordem: nextOrder
      })
      .select("id")
      .single();

    setAddingSku(null);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (!data) {
      setError("O exame não foi inserido no banco. Tente novamente.");
      return;
    }

    setQuery("");
    setResults([]);
    await onAdded();
  }

  return (
    <section className="section">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">Adicionar exame manualmente</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use esta busca quando a equipe quiser complementar ou corrigir o orçamento pelo catálogo oficial.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          className="field-input pl-10"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, sigla, SKU ou sinônimo"
          disabled={readOnly}
        />
      </div>

      {loading ? <p className="mt-3 text-sm text-slate-500">Buscando no catálogo...</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {results.length > 0 ? (
        <div className="mt-4 space-y-3">
          {results.map((exame) => (
            <div
              key={`${exame.sku}-${exame.nome}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-950">{exame.nome}</h3>
                    {exame.sku ? (
                      <span className="chip border-slate-200 bg-white text-slate-600">SKU {exame.sku}</span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                    <span>
                      <strong className="font-medium text-slate-900">Valor:</strong> {formatCurrency(exame.preco)}
                    </span>
                    <span>
                      <strong className="font-medium text-slate-900">Prazo:</strong> {formatDays(exame.prazo_dias)}
                    </span>
                    <span>
                      <strong className="font-medium text-slate-900">Jejum:</strong> {formatHours(exame.jejum_horas)}
                    </span>
                    <span>
                      <strong className="font-medium text-slate-900">Material:</strong> {exame.material || "Não informado"}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    <strong className="font-medium text-slate-900">Sinônimos:</strong>{" "}
                    {exame.sinonimos || "Sem sinônimos cadastrados"}
                  </p>
                </div>

                <button
                  className="btn btn-secondary"
                  onClick={() => addExam(exame)}
                  disabled={readOnly || addingSku === (exame.sku || exame.nome)}
                >
                  <Plus className="h-4 w-4" />
                  {addingSku === (exame.sku || exame.nome) ? "Adicionando..." : "Adicionar ao atendimento"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {searchTerm.length >= 2 && !loading && !error && results.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Nenhum exame encontrado para esse termo. Tente procurar pelo nome completo, sigla ou algum sinônimo mais
          específico.
        </div>
      ) : null}

      {!readOnly && results.length > 0 ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Ao adicionar, o exame entra imediatamente na lista abaixo para revisão.
        </div>
      ) : null}
    </section>
  );
}
