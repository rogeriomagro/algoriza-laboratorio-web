"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Unlock,
  X,
} from "lucide-react";

// ===================================================================
// Calendário de coletas — PRÉ-VISUALIZAÇÃO (somente front-end)
// Estado local em memória; nada é persistido nem conectado ao back-end.
// A equipe pode abrir/fechar dias (inclusive fora do fim de semana),
// fechar/abrir horários, ajustar capacidade e marcar feriados.
// ===================================================================

type SlotConfig = { hora: string; aberto: boolean; capacidade: number };
type DayConfig = { status: "aberto" | "fechado"; motivo: string; slots: SlotConfig[] };

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const HORAS_PADRAO = ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00"];
const MOTIVOS_RAPIDOS = ["Feriado", "Manutenção", "Sem equipe", "Evento interno"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function defaultSlots(): SlotConfig[] {
  return HORAS_PADRAO.map((hora) => ({ hora, aberto: true, capacidade: 3 }));
}

function baseConfig(date: Date): DayConfig {
  if (isWeekend(date)) return { status: "fechado", motivo: "Fim de semana", slots: [] };
  return { status: "aberto", motivo: "", slots: defaultSlots() };
}

function clone(config: DayConfig): DayConfig {
  return { status: config.status, motivo: config.motivo, slots: config.slots.map((s) => ({ ...s })) };
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);
}

export function CalendarioView() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [overrides, setOverrides] = useState<Record<string, DayConfig>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<DayConfig | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());

  function getConfig(key: string, date: Date): DayConfig {
    return overrides[key] ?? baseConfig(date);
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  // ----- Grade do mês (semana começando na segunda) -----
  const cells = useMemo(() => {
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Seg = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: Array<{ day: number; key: string; date: Date } | null> = [];
    for (let i = 0; i < firstWeekday; i++) list.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      list.push({ day, key: dayKey(year, month, day), date });
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [year, month]);

  const resumoMes = useMemo(() => {
    let abertos = 0;
    let fechados = 0;
    for (const cell of cells) {
      if (!cell) continue;
      const cfg = getConfig(cell.key, cell.date);
      if (cfg.status === "aberto") abertos += 1;
      else fechados += 1;
    }
    return { abertos, fechados };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, overrides]);

  function selectDay(key: string, date: Date) {
    setSelectedKey(key);
    setDraft(clone(getConfig(key, date)));
  }

  function patchDraft(patch: Partial<DayConfig>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  }

  function setDraftStatus(status: "aberto" | "fechado") {
    setDraft((current) => {
      if (!current) return current;
      if (status === "aberto") {
        return {
          status,
          motivo: "",
          slots: current.slots.length ? current.slots : defaultSlots(),
        };
      }
      return { ...current, status, motivo: current.motivo === "Fim de semana" ? "" : current.motivo };
    });
  }

  function patchSlot(index: number, patch: Partial<SlotConfig>) {
    setDraft((current) => {
      if (!current) return current;
      const slots = current.slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot));
      return { ...current, slots };
    });
  }

  function addSlot() {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, slots: [...current.slots, { hora: "12:00", aberto: true, capacidade: 3 }] };
    });
  }

  function removeSlot(index: number) {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, slots: current.slots.filter((_, i) => i !== index) };
    });
  }

  function saveDraft() {
    if (!selectedKey || !draft) return;
    setOverrides((current) => ({ ...current, [selectedKey]: clone(draft) }));
    showToast("Alterações salvas.");
  }

  function discardDraft() {
    if (!selectedKey) return;
    const date = parseKey(selectedKey);
    setDraft(clone(getConfig(selectedKey, date)));
  }

  function resetDay() {
    if (!selectedKey) return;
    setOverrides((current) => {
      const next = { ...current };
      delete next[selectedKey];
      return next;
    });
    const date = parseKey(selectedKey);
    setDraft(clone(baseConfig(date)));
    showToast("Dia restaurado para o padrão.");
  }

  const selectedDate = selectedKey ? parseKey(selectedKey) : null;

  return (
    <div className="space-y-4">
      {/* Cabeçalho + navegação de mês */}
      <section className="section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mint/70 text-brand-forest">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-slate-950">Calendário de coletas</h1>
              <p className="mt-1 text-sm text-slate-600">
                Defina os dias e horários de coleta. Abra ou feche dias, marque feriados e ajuste a capacidade por horário.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary px-2.5"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[150px] text-center text-sm font-semibold text-slate-900">
              {MESES[month]} {year}
            </div>
            <button
              className="btn btn-secondary px-2.5"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-emerald" /> Aberto ({resumoMes.abertos})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Fechado ({resumoMes.fechados})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-brand-teal" /> Hoje
          </span>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Grade do calendário */}
        <section className="section">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((label, i) => (
              <div
                key={label}
                className={`pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.06em] ${
                  i >= 5 ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {label}
              </div>
            ))}

            {cells.map((cell, index) => {
              if (!cell) return <div key={`empty-${index}`} className="min-h-[78px] rounded-lg" />;

              const cfg = getConfig(cell.key, cell.date);
              const aberto = cfg.status === "aberto";
              const weekend = isWeekend(cell.date);
              const isToday = cell.key === todayKey;
              const isSelected = cell.key === selectedKey;
              const slotsAbertos = cfg.slots.filter((s) => s.aberto).length;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => selectDay(cell.key, cell.date)}
                  className={[
                    "flex min-h-[78px] flex-col rounded-lg border p-2 text-left transition",
                    aberto
                      ? "border-slate-200 bg-gradient-to-br from-white to-brand-mint/25 hover:border-brand-emerald/45"
                      : "border-slate-200 bg-slate-50/80 hover:border-slate-300",
                    isSelected ? "ring-2 ring-brand-emerald ring-offset-1" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        weekend && !overrides[cell.key] ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {isToday ? (
                      <span className="rounded-full bg-brand-teal/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-teal">
                        Hoje
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto">
                    {aberto ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-forest">
                          <Unlock className="h-2.5 w-2.5" /> Aberto
                        </span>
                        <p className="mt-1 text-[10px] text-slate-500">{slotsAbertos} horários</p>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          <Lock className="h-2.5 w-2.5" /> Fechado
                        </span>
                        {cfg.motivo ? (
                          <p className="mt-1 truncate text-[10px] text-slate-500" title={cfg.motivo}>
                            {cfg.motivo}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Editor do dia */}
        <section className="section">
          {!draft || !selectedDate ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <CalendarDays className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-slate-700">Selecione um dia</p>
              <p className="mt-1 max-w-[240px] text-xs text-slate-500">
                Clique em uma data no calendário para abrir, fechar ou ajustar os horários de coleta.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 pb-3">
                <p className="field-label text-brand-forest">Editando</p>
                <h2 className="mt-0.5 text-base font-semibold capitalize text-slate-950">
                  {formatLongDate(selectedDate)}
                </h2>
              </div>

              {/* Status do dia */}
              <div className="mt-3">
                <span className="field-label">Status do dia</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftStatus("aberto")}
                    className={`btn ${draft.status === "aberto" ? "btn-primary" : "btn-secondary"}`}
                  >
                    <Unlock className="h-4 w-4" />
                    Aberto
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftStatus("fechado")}
                    className={`btn ${draft.status === "fechado" ? "btn-primary" : "btn-secondary"}`}
                  >
                    <Lock className="h-4 w-4" />
                    Fechado
                  </button>
                </div>
              </div>

              {/* Corpo conforme status */}
              {draft.status === "fechado" ? (
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="field-label">Motivo do fechamento</span>
                    <input
                      className="field-input mt-1"
                      value={draft.motivo}
                      onChange={(event) => patchDraft({ motivo: event.target.value })}
                      placeholder="Ex.: Feriado municipal"
                    />
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOTIVOS_RAPIDOS.map((motivo) => (
                      <button
                        key={motivo}
                        type="button"
                        onClick={() => patchDraft({ motivo })}
                        className={`chip transition hover:border-brand-emerald/40 hover:bg-brand-mint ${
                          draft.motivo === motivo ? "border-brand-emerald/40 bg-brand-mint text-brand-forest" : ""
                        }`}
                      >
                        {motivo}
                      </button>
                    ))}
                  </div>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    Neste dia não haverá coletas. Os clientes não conseguirão agendar horários.
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex min-h-0 flex-1 flex-col">
                  <div className="flex items-center justify-between">
                    <span className="field-label">Horários ({draft.slots.filter((s) => s.aberto).length} abertos)</span>
                    <button type="button" className="btn btn-secondary px-2.5 py-1 text-xs" onClick={addSlot}>
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </button>
                  </div>

                  <div className="mt-2 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 340 }}>
                    {draft.slots.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
                        Nenhum horário. Clique em “Adicionar”.
                      </p>
                    ) : (
                      draft.slots.map((slot, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                            slot.aberto ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70"
                          }`}
                        >
                          <input
                            type="time"
                            value={slot.hora}
                            onChange={(event) => patchSlot(index, { hora: event.target.value })}
                            className="field-input !w-[88px] px-2 py-1 text-sm"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={slot.capacidade}
                              onChange={(event) =>
                                patchSlot(index, { capacidade: Math.max(1, Number(event.target.value) || 1) })
                              }
                              className="field-input !w-[56px] px-2 py-1 text-sm"
                            />
                            <span className="text-[10px] text-slate-400">vagas</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => patchSlot(index, { aberto: !slot.aberto })}
                            title={slot.aberto ? "Fechar horário" : "Abrir horário"}
                            className={`ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                              slot.aberto
                                ? "border-brand-emerald/30 bg-brand-emerald/10 text-brand-forest hover:bg-brand-emerald/20"
                                : "border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            {slot.aberto ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSlot(index)}
                            title="Remover horário"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                <button type="button" className="btn btn-primary" onClick={saveDraft}>
                  <Save className="h-4 w-4" />
                  Salvar alterações
                </button>
                <button type="button" className="btn btn-secondary" onClick={discardDraft}>
                  Descartar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary ml-auto text-slate-500"
                  onClick={resetDay}
                  title="Voltar ao padrão (dia útil aberto / fim de semana fechado)"
                >
                  <RotateCcw className="h-4 w-4" />
                  Padrão
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Toast */}
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

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
