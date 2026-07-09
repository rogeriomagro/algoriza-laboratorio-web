"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Lock, Unlock, Check, ChevronDown, ExternalLink, User } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { AGENDA_PERIODOS, AGENDA_UNIDADES, formatCurrency, formatPhone, horaToPeriodo, normUnidade, parseCurrency, parseSchedulePreference, totalComDesconto } from "@/lib/format";
import type { AgendaConfig, AgendaExcecao, Agendamento } from "@/lib/supabase/types";

type AgendamentoCal = Agendamento & {
  atendimentos?: {
    paciente_nome: string | null;
    protocolo: string | null;
    telefone: string | null;
    plano_convenio: string | null;
    total_validado: number | string | null;
    desconto_tipo: "percentual" | "reais" | null;
    desconto_pct: number | string | null;
    desconto_reais: number | string | null;
  } | null;
};

// Preferência de coleta informada pelo cliente (Cenário B): fica em
// atendimentos.agendamento_desejado (texto rígido ISO). Não é reserva — é um
// marcador "a confirmar" que a equipe finaliza no card do atendimento.
type PrefCal = {
  id: string;
  paciente_nome: string | null;
  protocolo: string | null;
  telefone: string | null;
  plano_convenio: string | null;
  total_validado: number | string | null;
  unidade_preferida: string | null;
  agendamento_desejado: string | null;
  status: string | null;
};

// ===================================================================
// Calendário de coletas — conectado ao banco (por unidade).
// Lê agenda_config (faixas/capacidade por dia da semana), agenda_excecoes
// (feriados/bloqueios) e agendamentos (reservas). Operador pode bloquear/
// desbloquear uma data. Configuração de horários/capacidade por dia da
// semana é feita no banco (futura tela admin); aqui é visão operacional.
// ===================================================================

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}
function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isoDow(date: Date) {
  return ((date.getDay() + 6) % 7) + 1; // 1=seg … 7=dom
}
function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(date);
}

export function CalendarioView() {
  const today = useMemo(() => new Date(), []);
  const [unidade, setUnidade] = useState<string>(AGENDA_UNIDADES[0].slug);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [config, setConfig] = useState<AgendaConfig[]>([]);
  const [excecoes, setExcecoes] = useState<AgendaExcecao[]>([]);
  const [ags, setAgs] = useState<AgendamentoCal[]>([]);
  const [prefs, setPrefs] = useState<PrefCal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expandedAg, setExpandedAg] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const monthStart = dateKey(year, month, 1);
    const monthEnd = dateKey(year, month, new Date(year, month + 1, 0).getDate());
    // Início do mês seguinte (chave ISO) — limite superior do range de texto ISO.
    const nextMonthStart = month === 11 ? dateKey(year + 1, 0, 1) : dateKey(year, month + 1, 1);
    const [cfgRes, excRes, agRes, prefRes] = await Promise.all([
      supabase.from("agenda_config").select("*").eq("unidade", unidade),
      supabase
        .from("agenda_excecoes")
        .select("*")
        .gte("data", monthStart)
        .lte("data", monthEnd)
        .or(`unidade.is.null,unidade.eq.${unidade}`),
      supabase
        .from("agendamentos")
        .select("id, atendimento_id, unidade, data, periodo, hora, status, expira_em, created_at, atendimentos(paciente_nome, protocolo, telefone, plano_convenio, total_validado, desconto_tipo, desconto_pct, desconto_reais)")
        .eq("unidade", unidade)
        .gte("data", monthStart)
        .lte("data", monthEnd)
        .in("status", ["confirmado", "pendente"]),
      // Preferências de coleta (texto ISO em atendimentos). O range lexicográfico
      // sobre ISO equivale ao filtro por mês; a unidade é resolvida no cliente
      // (unidade_preferida é texto livre → normUnidade).
      supabase
        .from("atendimentos")
        .select("id, paciente_nome, protocolo, telefone, plano_convenio, total_validado, unidade_preferida, agendamento_desejado, status")
        .gte("agendamento_desejado", monthStart)
        .lt("agendamento_desejado", nextMonthStart)
        .not("status", "in", "(cancelado,rejeitado)"),
    ]);
    const firstErr = cfgRes.error || excRes.error || agRes.error || prefRes.error;
    if (firstErr) {
      setError(firstErr.message);
      setConfig([]); setExcecoes([]); setAgs([]); setPrefs([]);
    } else {
      setConfig((cfgRes.data ?? []) as AgendaConfig[]);
      setExcecoes((excRes.data ?? []) as AgendaExcecao[]);
      setAgs((agRes.data ?? []) as unknown as AgendamentoCal[]);
      setPrefs((prefRes.data ?? []) as unknown as PrefCal[]);
    }
    setLoading(false);
  }, [unidade, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const configByDow = useMemo(() => {
    const map = new Map<number, AgendaConfig>();
    for (const c of config) if (c.ativo) map.set(c.dia_semana, c);
    return map;
  }, [config]);

  function agAtivo(a: AgendamentoCal) {
    return a.status === "confirmado" || (a.status === "pendente" && !!a.expira_em && new Date(a.expira_em).getTime() > Date.now());
  }

  const reservasPorDia = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of ags) if (agAtivo(a)) map.set(a.data, (map.get(a.data) ?? 0) + 1);
    return map;
  }, [ags]);

  const agsDoDia = useMemo(
    () => (selectedKey ? ags.filter((a) => a.data === selectedKey && agAtivo(a)) : []),
    [ags, selectedKey]
  );

  // Preferências por dia (só da unidade selecionada, com data ISO parseável).
  // Exclui atendimentos que JÁ têm coleta confirmada (agendamentos) — esses
  // aparecem como "agendada", não como "preferência" (evita marcador duplo).
  const prefsPorDia = useMemo(() => {
    const confirmados = new Set(ags.filter(agAtivo).map((a) => a.atendimento_id));
    const map = new Map<string, Array<{ pref: PrefCal; periodo: "manha" | "tarde" | null }>>();
    for (const p of prefs) {
      if (confirmados.has(p.id)) continue;
      if (normUnidade(p.unidade_preferida) !== unidade) continue;
      const parsed = parseSchedulePreference(p.agendamento_desejado);
      if (!parsed) continue;
      const arr = map.get(parsed.key) ?? [];
      arr.push({ pref: p, periodo: parsed.periodo });
      map.set(parsed.key, arr);
    }
    return map;
  }, [prefs, ags, unidade]);

  const prefsDoDia = selectedKey ? prefsPorDia.get(selectedKey) ?? [] : [];

  const bloqueioDe = useCallback(
    (key: string) => excecoes.find((e) => e.data === key && e.tipo === "bloqueio") ?? null,
    [excecoes]
  );

  function diaStatus(date: Date, key: string) {
    const cfg = configByDow.get(isoDow(date));
    if (!cfg) return { aberto: false, motivo: isoDow(date) > 5 ? "Fim de semana" : "Fechado", bloqueio: null as AgendaExcecao | null, cfg: null };
    const bloq = bloqueioDe(key);
    if (bloq) return { aberto: false, motivo: bloq.motivo || "Bloqueado", bloqueio: bloq, cfg };
    return { aberto: true, motivo: "", bloqueio: null as AgendaExcecao | null, cfg };
  }

  const cells = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: Array<{ day: number; key: string; date: Date } | null> = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      list.push({ day, key: dateKey(year, month, day), date: new Date(year, month, day) });
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [year, month]);

  async function bloquearDia() {
    if (!selectedKey) return;
    setWorking(true);
    const { error: err } = await supabase.from("agenda_excecoes").insert({
      unidade,
      data: selectedKey,
      tipo: "bloqueio",
      motivo: motivo.trim() || "Bloqueado",
    });
    setWorking(false);
    if (err) { showToast(`Erro: ${err.message}`); return; }
    setMotivo("");
    showToast("Dia bloqueado.");
    await load();
  }

  async function desbloquearDia(exc: AgendaExcecao) {
    if (exc.unidade === null) { showToast("Bloqueio global — remova no admin."); return; }
    setWorking(true);
    const { error: err } = await supabase.from("agenda_excecoes").delete().eq("id", exc.id);
    setWorking(false);
    if (err) { showToast(`Erro: ${err.message}`); return; }
    showToast("Dia desbloqueado.");
    await load();
  }

  const selectedDate = selectedKey ? parseKey(selectedKey) : null;
  const selectedInfo = selectedDate && selectedKey ? diaStatus(selectedDate, selectedKey) : null;
  const labMeta = AGENDA_UNIDADES.find((u) => u.slug === unidade);

  return (
    <div className="space-y-4">
      <section className="section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint/70 text-brand-forest">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-950">Calendário de coletas</h1>
              <p className="mt-1 text-sm text-slate-600">
                Agenda por unidade — atendimento por ordem de chegada, em 2 períodos. Veja as coletas de cada dia; bloqueie ou libere datas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="field-input h-9 w-[190px] text-sm"
              value={unidade}
              onChange={(e) => { setUnidade(e.target.value); setSelectedKey(null); }}
            >
              {AGENDA_UNIDADES.map((u) => (
                <option key={u.slug} value={u.slug}>{u.label}</option>
              ))}
            </select>
            <button className="btn btn-secondary px-2.5" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mês anterior">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[140px] text-center text-sm font-semibold text-slate-900">{MESES[month]} {year}</div>
            <button className="btn btn-secondary px-2.5" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Próximo mês">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button className="btn btn-secondary" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
              Hoje
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-emerald" /> Aberto</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Fechado/bloqueado</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-2 ring-brand-teal" /> Hoje</span>
          {loading ? <span className="text-slate-400">carregando…</span> : null}
          {labMeta ? <span className="ml-auto text-slate-400">Unidade: {labMeta.label}</span> : null}
        </div>
        {error ? <p className="mt-2 text-sm text-rose-700">Erro ao carregar: {error}</p> : null}
        {!loading && !error && config.length === 0 ? (
          <p className="mt-2 text-sm text-amber-700">Sem configuração de horários para esta unidade (rode/ajuste `agenda_config`).</p>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="section">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((label, i) => (
              <div key={label} className={`pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.06em] ${i >= 5 ? "text-slate-400" : "text-slate-500"}`}>
                {label}
              </div>
            ))}

            {cells.map((cell, index) => {
              if (!cell) return <div key={`e-${index}`} className="min-h-[78px] rounded-lg" />;
              const info = diaStatus(cell.date, cell.key);
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selectedKey;
              const reservas = reservasPorDia.get(cell.key) ?? 0;
              const preferencias = prefsPorDia.get(cell.key)?.length ?? 0;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => { setSelectedKey(cell.key); setMotivo(""); }}
                  className={[
                    "flex min-h-[78px] flex-col rounded-lg border p-2 text-left transition",
                    info.aberto
                      ? "border-slate-200 bg-gradient-to-br from-white to-brand-mint/25 hover:border-brand-emerald/45"
                      : "border-slate-200 bg-slate-50/80 hover:border-slate-300",
                    isSelected
                      ? "ring-2 ring-brand-emerald ring-offset-1"
                      : isToday
                        ? "ring-2 ring-brand-teal/70 ring-offset-1"
                        : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    {isToday ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-xs font-bold text-white shadow-sm shadow-brand-teal/30">
                        {cell.day}
                      </span>
                    ) : (
                      <span className={`text-sm font-semibold ${info.aberto ? "text-slate-900" : "text-slate-400"}`}>{cell.day}</span>
                    )}
                    {isToday ? (
                      <span className="rounded-full bg-brand-teal px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-sm shadow-brand-teal/30">Hoje</span>
                    ) : null}
                  </div>
                  <div className="mt-auto">
                    {info.aberto ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-forest">
                          <Unlock className="h-2.5 w-2.5" /> Aberto
                        </span>
                        {reservas > 0 ? <p className="mt-1 text-[10px] text-slate-500">{reservas} agendada{reservas === 1 ? "" : "s"}</p> : null}
                        {preferencias > 0 ? <p className="mt-0.5 text-[10px] font-medium text-amber-700">{preferencias} preferência{preferencias === 1 ? "" : "s"}</p> : null}
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          <Lock className="h-2.5 w-2.5" /> {isoDow(cell.date) > 5 ? "Fim de semana" : "Fechado"}
                        </span>
                        {info.bloqueio?.motivo ? <p className="mt-1 truncate text-[10px] text-slate-500" title={info.bloqueio.motivo}>{info.bloqueio.motivo}</p> : null}
                        {preferencias > 0 ? <p className="mt-0.5 text-[10px] font-medium text-amber-700">{preferencias} preferência{preferencias === 1 ? "" : "s"}</p> : null}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="section">
          {!selectedDate || !selectedInfo ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-700">Selecione um dia</p>
              <p className="mt-1 max-w-[240px] text-xs text-slate-500">Clique numa data para ver as coletas por período.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 pb-3">
                <p className="field-label text-brand-forest">Dia selecionado</p>
                <h2 className="mt-0.5 text-base font-semibold capitalize text-slate-950">{formatLongDate(selectedDate)}</h2>
              </div>

              {prefsDoDia.length > 0 ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                  <p className="text-xs font-semibold text-amber-800">Preferências do cliente (a confirmar)</p>
                  <ul className="mt-2 space-y-1.5">
                    {prefsDoDia.map(({ pref, periodo }) => (
                      <li key={pref.id} className="flex items-center gap-2 text-sm">
                        <User className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                        <span className="min-w-0 flex-1 truncate text-slate-800">{pref.paciente_nome || "Sem nome"}</span>
                        {periodo ? (
                          <span className="shrink-0 text-xs font-semibold text-amber-800">{periodo === "manha" ? "manhã" : "tarde"}</span>
                        ) : (
                          <span className="shrink-0 text-xs text-slate-500">sem período</span>
                        )}
                        <Link
                          href={`/atendimentos/${pref.id}`}
                          className="shrink-0 text-brand-forest hover:underline"
                          title="Abrir atendimento"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-amber-700/80">Confirme a coleta no card do atendimento.</p>
                </div>
              ) : null}

              {!selectedInfo.cfg ? (
                <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  {isoDow(selectedDate) > 5 ? "Fim de semana — não há atendimento." : "Sem horários configurados para este dia da semana nesta unidade."}
                </p>
              ) : selectedInfo.bloqueio ? (
                <div className="mt-4 space-y-3">
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Dia <strong>bloqueado</strong>{selectedInfo.bloqueio.motivo ? ` — ${selectedInfo.bloqueio.motivo}` : ""}.
                    {selectedInfo.bloqueio.unidade === null ? " (bloqueio global de todas as unidades)" : ""}
                  </p>
                  {selectedInfo.bloqueio.unidade !== null ? (
                    <button type="button" className="btn btn-secondary" disabled={working} onClick={() => desbloquearDia(selectedInfo.bloqueio!)}>
                      <Unlock className="h-4 w-4" /> Desbloquear dia
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 flex min-h-0 flex-1 flex-col">
                  <span className="field-label">Coletas por período</span>
                  <p className="mt-0.5 text-[11px] text-slate-400">Atendimento por ordem de chegada — sem horário marcado.</p>
                  <div className="mt-2 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 340 }}>
                    {AGENDA_PERIODOS.map((per) => {
                      const lista = agsDoDia.filter((a) => (a.periodo ?? horaToPeriodo(a.hora)) === per.slug);
                      return (
                        <div key={per.slug} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                          <div className="flex items-center justify-between bg-brand-mint/20 px-3 py-2">
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-slate-800">{per.label}</span>
                              <span className="ml-2 text-xs text-slate-500">{per.janela}</span>
                            </div>
                            <span className="shrink-0 text-xs font-semibold text-brand-forest">
                              {lista.length} agendada{lista.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          {lista.length > 0 ? (
                            <div className="border-t border-slate-100">
                              {lista.map((a) => {
                                const pac = a.atendimentos;
                                const aberto = expandedAg === a.id;
                                return (
                                  <div key={a.id} className="border-b border-slate-100 last:border-b-0">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedAg(aberto ? null : a.id)}
                                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-slate-50"
                                    >
                                      <User className="h-3.5 w-3.5 shrink-0 text-brand-emerald" />
                                      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                                        {pac?.paciente_nome || "Reserva sem ficha"}
                                      </span>
                                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${a.status === "confirmado" ? "bg-brand-emerald/10 text-brand-forest" : "bg-amber-100 text-amber-800"}`}>
                                        {a.status}
                                      </span>
                                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${aberto ? "rotate-180" : ""}`} />
                                    </button>
                                    {aberto ? (
                                      <div className="space-y-1 bg-slate-50/70 px-3 pb-2.5 pt-1 text-xs text-slate-600">
                                        {pac?.protocolo ? <p>Protocolo: <span className="font-medium text-slate-800">{pac.protocolo}</span></p> : null}
                                        {pac?.telefone ? <p>Telefone: {formatPhone(pac.telefone)}</p> : null}
                                        {pac?.plano_convenio ? <p>Convênio: {pac.plano_convenio}</p> : null}
                                        {pac?.total_validado != null ? <p>Total: {formatCurrency(totalComDesconto(parseCurrency(pac.total_validado), pac).final)}</p> : null}
                                        {a.atendimento_id ? (
                                          <Link href={`/atendimentos/${a.atendimento_id}`} className="mt-1 inline-flex items-center gap-1 font-medium text-brand-forest hover:underline">
                                            <ExternalLink className="h-3 w-3" /> Abrir atendimento
                                          </Link>
                                        ) : (
                                          <p className="italic text-slate-400">Sem ficha vinculada</p>
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="px-3 py-2 text-xs text-slate-400">Nenhuma coleta neste período.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
                    <label className="block">
                      <span className="field-label">Bloquear este dia (feriado/indisponível)</span>
                      <input className="field-input mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (ex.: Feriado municipal)" />
                    </label>
                    <button type="button" className="btn btn-secondary" disabled={working} onClick={bloquearDia}>
                      <Lock className="h-4 w-4" /> Bloquear dia
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-xl border border-brand-emerald/20 bg-brand-forest px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand-forest/20">
            <Check className="h-4 w-4 text-brand-mint" />
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}
