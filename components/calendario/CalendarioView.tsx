"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Lock, Unlock, Check } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { AGENDA_UNIDADES } from "@/lib/format";
import type { AgendaConfig, AgendaExcecao, Agendamento } from "@/lib/supabase/types";

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
function hhmm(t: string | null | undefined) {
  return (t ?? "").slice(0, 5);
}
function timeToMin(t: string) {
  const [h, m] = hhmm(t).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
function minToTime(min: number) {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}
function slotsFromConfig(cfg: AgendaConfig): string[] {
  const start = timeToMin(cfg.hora_inicio);
  const end = timeToMin(cfg.hora_fim);
  const step = Math.max(5, cfg.slot_min || 30);
  const out: string[] = [];
  for (let m = start; m < end; m += step) out.push(minToTime(m));
  return out;
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
  const [ags, setAgs] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
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
    const [cfgRes, excRes, agRes] = await Promise.all([
      supabase.from("agenda_config").select("*").eq("unidade", unidade),
      supabase
        .from("agenda_excecoes")
        .select("*")
        .gte("data", monthStart)
        .lte("data", monthEnd)
        .or(`unidade.is.null,unidade.eq.${unidade}`),
      supabase
        .from("agendamentos")
        .select("*")
        .eq("unidade", unidade)
        .gte("data", monthStart)
        .lte("data", monthEnd)
        .in("status", ["confirmado", "pendente"]),
    ]);
    const firstErr = cfgRes.error || excRes.error || agRes.error;
    if (firstErr) {
      setError(firstErr.message);
      setConfig([]); setExcecoes([]); setAgs([]);
    } else {
      setConfig((cfgRes.data ?? []) as AgendaConfig[]);
      setExcecoes((excRes.data ?? []) as AgendaExcecao[]);
      setAgs((agRes.data ?? []) as Agendamento[]);
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

  // Reservas ativas por "data|hora"
  const reservasPorSlot = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, number>();
    for (const a of ags) {
      const ativo = a.status === "confirmado" || (a.status === "pendente" && a.expira_em && new Date(a.expira_em).getTime() > now);
      if (!ativo) continue;
      const k = `${a.data}|${hhmm(a.hora)}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [ags]);

  const reservasPorDia = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, number>();
    for (const a of ags) {
      const ativo = a.status === "confirmado" || (a.status === "pendente" && a.expira_em && new Date(a.expira_em).getTime() > now);
      if (!ativo) continue;
      map.set(a.data, (map.get(a.data) ?? 0) + 1);
    }
    return map;
  }, [ags]);

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
                Agenda por unidade. Veja os horários e a ocupação de cada dia; bloqueie ou libere datas.
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
                    isSelected ? "ring-2 ring-brand-emerald ring-offset-1" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${info.aberto ? "text-slate-900" : "text-slate-400"}`}>{cell.day}</span>
                    {isToday ? (
                      <span className="rounded-full bg-brand-teal/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-teal">Hoje</span>
                    ) : null}
                  </div>
                  <div className="mt-auto">
                    {info.aberto ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-forest">
                          <Unlock className="h-2.5 w-2.5" /> Aberto
                        </span>
                        {reservas > 0 ? <p className="mt-1 text-[10px] text-slate-500">{reservas} agendada{reservas === 1 ? "" : "s"}</p> : null}
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          <Lock className="h-2.5 w-2.5" /> {isoDow(cell.date) > 5 ? "Fim de semana" : "Fechado"}
                        </span>
                        {info.bloqueio?.motivo ? <p className="mt-1 truncate text-[10px] text-slate-500" title={info.bloqueio.motivo}>{info.bloqueio.motivo}</p> : null}
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
              <p className="mt-1 max-w-[240px] text-xs text-slate-500">Clique numa data para ver os horários e a ocupação.</p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 pb-3">
                <p className="field-label text-brand-forest">Dia selecionado</p>
                <h2 className="mt-0.5 text-base font-semibold capitalize text-slate-950">{formatLongDate(selectedDate)}</h2>
              </div>

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
                  <span className="field-label">Horários e ocupação</span>
                  <div className="mt-2 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 300 }}>
                    {slotsFromConfig(selectedInfo.cfg).map((hora) => {
                      const usadas = reservasPorSlot.get(`${selectedKey}|${hora}`) ?? 0;
                      const cap = selectedInfo.cfg!.capacidade;
                      const cheio = usadas >= cap;
                      return (
                        <div key={hora} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm ${cheio ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}>
                          <span className="font-medium text-slate-800">{hora}</span>
                          <span className={cheio ? "text-rose-700" : "text-slate-600"}>{usadas}/{cap} {cheio ? "(lotado)" : "vagas"}</span>
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
