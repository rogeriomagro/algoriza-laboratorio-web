"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FlaskConical,
  Pencil,
  Save,
  Search,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { AtendimentoExame, CatalogoExame } from "@/lib/supabase/types";
import { asString, describeMatch, formatCurrency, formatDays, formatHours, parseCurrency } from "@/lib/format";

function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

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

interface ExamRowProps {
  exame: AtendimentoExame;
  readOnly: boolean;
  saving: boolean;
  onSave: (id: string, patch: Partial<AtendimentoExame>) => Promise<void>;
}

export function ExamRow({ exame, readOnly, saving, onSave }: ExamRowProps) {
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [preco, setPreco] = useState("");
  const [prazoDias, setPrazoDias] = useState("");
  const [jejumHoras, setJejumHoras] = useState("");
  const [preparo, setPreparo] = useState("");
  const [termoOriginal, setTermoOriginal] = useState("");
  const [matchPor, setMatchPor] = useState<string | null>(null);
  const [incluido, setIncluido] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [catalogResults, setCatalogResults] = useState<CatalogoExame[]>([]);
  const [searchingCatalog, setSearchingCatalog] = useState(false);
  const [searchingOpen, setSearchingOpen] = useState(false);

  useEffect(() => {
    setNome(asString(exame.nome));
    setSku(asString(exame.sku));
    setPreco(parseCurrency(exame.preco)?.toString().replace(".", ",") || "");
    setPrazoDias(asString(exame.prazo_dias));
    setJejumHoras(asString(exame.jejum_horas));
    setPreparo(asString(exame.preparo));
    setTermoOriginal(asString(exame.termo_original));
    setMatchPor(exame.match_por);
    setIncluido(exame.incluido !== false);
    setError(null);
    setIsEditing(false);
    setCatalogResults([]);
    setSearchingOpen(false);
  }, [exame]);

  const helperText = useMemo(() => describeMatch(matchPor), [matchPor]);
  const fieldsDisabled = readOnly || !isEditing || saving;
  const searchTerm = safeSearchTerm(nome);

  useEffect(() => {
    if (!isEditing) return;

    if (searchTerm.length < 2) {
      setCatalogResults([]);
      setSearchingOpen(false);
      setSearchingCatalog(false);
      return;
    }

    let active = true;

    const timeout = window.setTimeout(async () => {
      setSearchingCatalog(true);
      setError(null);

      const filter = `nome.ilike.*${searchTerm}*,sku.ilike.*${searchTerm}*,sinonimos.ilike.*${searchTerm}*`;

      const [matchResponse, catalogResponse] = await Promise.all([
        supabase.rpc("match_termos_exames", { termos: [searchTerm] }),
        supabase
          .from("catalogo_exames")
          .select("sku,nome,sinonimos,preco,material,metodo,preparo,prazo_dias,jejum_horas")
          .or(filter)
          .order("nome", { ascending: true })
          .limit(8),
      ]);

      if (!active) return;

      const searchError = matchResponse.error || catalogResponse.error;

      if (searchError) {
        setCatalogResults([]);
        setSearchingOpen(false);
        setError(searchError.message);
      } else {
        const matched = ((matchResponse.data || []) as CatalogoExame[]).filter((item) => item.nome);
        const catalog = (catalogResponse.data || []) as CatalogoExame[];
        const merged = dedupeCatalogResults([...matched, ...catalog]).slice(0, 8);
        setCatalogResults(merged);
        setSearchingOpen(merged.length > 0);
      }

      setSearchingCatalog(false);
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [isEditing, searchTerm]);

  function resetDraft() {
    setNome(asString(exame.nome));
    setSku(asString(exame.sku));
    setPreco(parseCurrency(exame.preco)?.toString().replace(".", ",") || "");
    setPrazoDias(asString(exame.prazo_dias));
    setJejumHoras(asString(exame.jejum_horas));
    setPreparo(asString(exame.preparo));
    setTermoOriginal(asString(exame.termo_original));
    setMatchPor(exame.match_por);
    setCatalogResults([]);
    setSearchingOpen(false);
    setError(null);
  }

  function applyCatalogMatch(item: CatalogoExame) {
    setNome(item.nome);
    setSku(asString(item.sku));
    setPreco(item.preco === null || item.preco === undefined ? "" : String(item.preco).replace(".", ","));
    setPrazoDias(item.prazo_dias === null || item.prazo_dias === undefined ? "" : String(item.prazo_dias));
    setJejumHoras(item.jejum_horas === null || item.jejum_horas === undefined ? "" : String(item.jejum_horas));
    setPreparo(asString(item.preparo));
    setTermoOriginal(searchTerm || item.nome);
    setMatchPor("manual_catalogo");
    setCatalogResults([]);
    setSearchingOpen(false);
    setError(null);
  }

  async function save() {
    setError(null);

    const nomeNormalizado = nome.trim();
    const skuNormalizado = sku.trim();
    const precoNumber = toNumberOrNull(preco);
    const prazoNumber = toNumberOrNull(prazoDias);
    const jejumNumber = toNumberOrNull(jejumHoras);

    if (!nomeNormalizado) return setError("Informe o nome do exame.");
    if (precoNumber !== null && precoNumber < 0) return setError("O valor nao pode ser negativo.");
    if (prazoNumber !== null && prazoNumber < 0) return setError("O prazo nao pode ser negativo.");
    if (jejumNumber !== null && jejumNumber < 0) return setError("O jejum nao pode ser negativo.");

    await onSave(exame.id, {
      nome: nomeNormalizado,
      sku: skuNormalizado || null,
      preco: precoNumber,
      prazo_dias: prazoNumber,
      jejum_horas: jejumNumber,
      preparo,
      termo_original: termoOriginal || nomeNormalizado,
      match_por: matchPor || exame.match_por,
      incluido,
      editado_manual: true,
    });

    setIsEditing(false);
  }

  async function toggleIncluded(nextValue: boolean) {
    setIncluido(nextValue);
    await onSave(exame.id, {
      incluido: nextValue,
      editado_manual: true,
    });
  }

  const precoNumber = toNumberOrNull(preco);
  const precoFmt = preco.trim() ? formatCurrency(precoNumber) : "Não informado";
  const metaParts = [
    sku.trim() ? `SKU ${sku.trim()}` : "Sem SKU",
    `Prazo ${prazoDias.trim() ? formatDays(toNumberOrNull(prazoDias)) : "—"}`,
    `Jejum ${jejumHoras.trim() ? formatHours(toNumberOrNull(jejumHoras)) : "—"}`,
  ];

  return (
    <article
      className={`rounded-lg border px-3 py-2.5 transition ${
        incluido
          ? "border-slate-200 bg-gradient-to-br from-white to-brand-mint/20 shadow-sm shadow-slate-900/5"
          : "border-slate-200 bg-slate-50/80 opacity-80"
      }`}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-1.5">
              {isEditing && !readOnly ? (
                <div className="relative min-w-[280px] flex-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="field-input h-9 w-full rounded-lg border-slate-300 bg-white !pl-9 pr-3 text-sm font-semibold text-slate-950"
                      value={nome}
                      onChange={(event) => {
                        setNome(event.target.value);
                        setSearchingOpen(true);
                      }}
                      onFocus={() => {
                        if (catalogResults.length > 0) setSearchingOpen(true);
                      }}
                      placeholder="Editar nome e buscar no catalogo"
                      disabled={saving}
                    />
                  </div>

                  {searchingOpen && (catalogResults.length > 0 || searchingCatalog) ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/10">
                      {searchingCatalog ? <div className="px-3 py-2 text-xs text-slate-500">Buscando exames...</div> : null}

                      {!searchingCatalog ? (
                        <div className="max-h-56 overflow-y-auto py-1">
                          {catalogResults.map((item) => (
                            <button
                              key={`${item.sku || "sem-sku"}-${item.nome}`}
                              type="button"
                              className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition hover:bg-brand-mint/30"
                              onClick={() => applyCatalogMatch(item)}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">{item.nome}</p>
                                <p className="truncate text-xs text-slate-500">
                                  {item.sku ? `SKU ${item.sku}` : "Sem SKU"} • {formatCurrency(item.preco)}
                                </p>
                              </div>
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-emerald" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <h3 className={`text-sm font-semibold ${incluido ? "text-slate-950" : "text-slate-500 line-through"}`}>
                  {nome || "Exame sem nome"}
                </h3>
              )}

              {exame.editado_manual ? (
                <span className="chip border-brand-teal/20 bg-brand-teal/10 text-brand-forest">Editado</span>
              ) : null}

              {exame.ambiguo ? (
                <span className="chip border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Revisar
                </span>
              ) : null}

              {!incluido ? <span className="chip border-slate-200 bg-slate-100 text-slate-600">Fora do total</span> : null}
            </div>

            <p className="mt-1 text-[12px] leading-5 text-slate-600">
              {termoOriginal ? `Termo: ${termoOriginal} • ${helperText}` : helperText}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {!isEditing ? (
              <span className={`text-base font-semibold ${incluido ? "text-brand-forest" : "text-slate-400 line-through"}`}>
                {precoFmt}
              </span>
            ) : null}
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1 text-xs text-slate-700">
              <span>Incluído</span>
              <input
                type="checkbox"
                checked={incluido}
                disabled={readOnly || saving}
                onChange={(event) => toggleIncluded(event.target.checked)}
              />
            </label>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-1">
            <p className="text-xs text-slate-600">{metaParts.join(" · ")}</p>
            <p className="line-clamp-2 text-[12px] leading-5 text-slate-600">
              <span className="font-medium text-slate-700">Preparo:</span> {preparo.trim() || "Sem preparo informado"}
            </p>
          </div>
        ) : (
        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-2 md:grid-cols-3">
            <label className="block">
              <span className="field-label">SKU</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block">
              <span className="field-label">Preco</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={preco}
                onChange={(event) => setPreco(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block">
              <span className="field-label">Prazo dias</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={prazoDias}
                onChange={(event) => setPrazoDias(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block md:col-span-3 lg:md:col-span-1">
              <span className="field-label">Jejum horas</span>
              <input
                className="field-input mt-1 px-3 py-1.5 text-sm"
                value={jejumHoras}
                onChange={(event) => setJejumHoras(event.target.value)}
                disabled={fieldsDisabled}
              />
            </label>

            <label className="block md:col-span-3">
              <span className="field-label">Preparo</span>
              <textarea
                className="field-input mt-1 min-h-[74px] px-3 py-2 text-sm leading-5"
                value={preparo}
                onChange={(event) => setPreparo(event.target.value)}
                disabled={fieldsDisabled}
                placeholder="Sem preparo informado"
              />
            </label>
          </div>

          <div className="rounded-lg border border-brand-teal/15 bg-white/85 px-3 py-2 shadow-sm shadow-slate-900/5">
            <p className="field-label text-brand-forest">Resumo</p>
            <div className="mt-1.5 space-y-1 text-xs leading-5 text-slate-700">
              <p><strong className="font-medium text-slate-900">Nome:</strong> {nome || "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">SKU:</strong> {sku || "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">Valor:</strong> {preco.trim() ? formatCurrency(toNumberOrNull(preco)) : "Nao informado"}</p>
              <p><strong className="font-medium text-slate-900">Prazo:</strong> {formatDays(toNumberOrNull(prazoDias))}</p>
              <p><strong className="font-medium text-slate-900">Jejum:</strong> {formatHours(toNumberOrNull(jejumHoras))}</p>
            </div>
          </div>
        </div>
        )}

        {error ? <p className="text-xs text-rose-700">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          {!isEditing && !readOnly ? (
            <button className="btn btn-secondary px-3 py-1.5" onClick={() => setIsEditing(true)} disabled={saving}>
              <Pencil className="h-4 w-4" />
              Editar
            </button>
          ) : null}

          {isEditing && !readOnly ? (
            <>
              <button className="btn btn-primary px-3 py-1.5" onClick={save} disabled={saving}>
                <Save className="h-4 w-4" />
                Salvar
              </button>

              <button
                type="button"
                className="btn btn-secondary px-3 py-1.5"
                onClick={() => {
                  resetDraft();
                  setIsEditing(false);
                }}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </>
          ) : null}

          <button type="button" className="btn btn-secondary px-3 py-1.5" onClick={() => setExpanded((current) => !current)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {expanded ? "Ocultar detalhes" : "Detalhes tecnicos"}
          </button>
        </div>

        {expanded ? (
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ClipboardList className="h-4 w-4 text-brand-emerald" />
                Origem do match
              </div>
              <div className="space-y-1 text-sm leading-5 text-slate-600">
                <p><strong className="font-medium text-slate-900">Termo:</strong> {termoOriginal || "Nao informado"}</p>
                <p><strong className="font-medium text-slate-900">Tipo:</strong> {helperText}</p>
                <p><strong className="font-medium text-slate-900">Score:</strong> {asString(exame.score) || "Nao informado"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FlaskConical className="h-4 w-4 text-brand-emerald" />
                Situacao do exame
              </div>
              <p className="text-sm leading-5 text-slate-600">
                {incluido
                  ? "Incluido normalmente no total validado."
                  : "Mantido no atendimento, mas fora do total enquanto estiver desmarcado."}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
