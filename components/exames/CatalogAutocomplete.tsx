"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { AtendimentoExame, CatalogoExame } from "@/lib/supabase/types";
import { formatCurrency } from "@/lib/format";

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

    const { data, error: insertError } = await supabase.from("atendimento_exames").insert({
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
    }).select("id").single();

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
      <h2 className="text-base font-semibold text-slate-950">Adicionar exame pelo catálogo</h2>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          className="field-input pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, SKU ou sinônimo"
          disabled={readOnly}
        />
      </div>
      {loading ? <p className="mt-2 text-sm text-slate-500">Buscando...</p> : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      {results.length > 0 ? (
        <div className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {results.map((exame) => (
            <div key={`${exame.sku}-${exame.nome}`} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{exame.nome}</p>
                <p className="text-xs text-slate-500">
                  SKU: {exame.sku || "-"} · {formatCurrency(exame.preco)} · {exame.sinonimos || "sem sinônimos"}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => addExam(exame)}
                disabled={readOnly || addingSku === (exame.sku || exame.nome)}
              >
                <Plus className="h-4 w-4" />
                {addingSku === (exame.sku || exame.nome) ? "Adicionando..." : "Adicionar"}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {searchTerm.length >= 2 && !loading && !error && results.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Nenhum exame encontrado para esse termo.</p>
      ) : null}
    </section>
  );
}
