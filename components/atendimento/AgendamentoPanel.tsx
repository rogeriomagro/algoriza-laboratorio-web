"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Atendimento, Agendamento } from "@/lib/supabase/types";
import { AGENDA_UNIDADES, agendaUnidadeLabel, formatDateOnly, normUnidade } from "@/lib/format";

interface Props {
  atendimento: Atendimento;
  readOnly: boolean;
}

// Operador cria/confirma o agendamento da coleta (Cenário B: a IA captura a
// preferência; a equipe finaliza aqui). Grava em `agendamentos` ligado ao
// atendimento → aparece no Calendário e no card.
export function AgendamentoPanel({ atendimento, readOnly }: Props) {
  const [ag, setAg] = useState<Agendamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [unidade, setUnidade] = useState<string>(
    normUnidade(atendimento.unidade_preferida) ?? AGENDA_UNIDADES[0].slug
  );
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("atendimento_id", atendimento.id)
      .in("status", ["pendente", "confirmado"])
      .order("created_at", { ascending: false })
      .limit(1);
    if (err) setError(err.message);
    setAg(((rows ?? [])[0] as Agendamento) ?? null);
    setLoading(false);
  }, [atendimento.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function agendar() {
    if (!data || !hora) {
      setError("Informe data e horário.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("agendamentos").insert({
      atendimento_id: atendimento.id,
      unidade,
      data,
      hora,
      status: "confirmado",
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setData("");
    setHora("");
    await load();
  }

  async function cancelar() {
    if (!ag) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", ag.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    await load();
  }

  return (
    <section className="section">
      <h2 className="section-title">Agendamento da coleta</h2>

      <p className="mt-2 text-sm text-slate-600">
        Preferência do paciente:{" "}
        <span className="font-medium text-slate-800">{atendimento.agendamento_desejado || "não informada"}</span>
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-slate-400">carregando…</p>
      ) : ag ? (
        <div className="mt-3 rounded-lg border border-brand-emerald/20 bg-brand-mint/30 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-brand-forest">
            <CalendarClock className="h-4 w-4" />
            {formatDateOnly(ag.data)} às {ag.hora.slice(0, 5)} — {agendaUnidadeLabel(ag.unidade)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Status: {ag.status}</p>
          {!readOnly ? (
            <button type="button" onClick={cancelar} disabled={saving} className="btn btn-secondary mt-2 text-rose-600">
              <X className="h-4 w-4" /> Cancelar agendamento
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="field-label">Data</span>
              <input
                type="date"
                className="field-input mt-1 text-sm"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={readOnly || saving}
              />
            </label>
            <label className="block">
              <span className="field-label">Horário</span>
              <input
                type="time"
                className="field-input mt-1 text-sm"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                disabled={readOnly || saving}
              />
            </label>
          </div>
          <label className="block">
            <span className="field-label">Unidade</span>
            <select
              className="field-input mt-1 text-sm"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              disabled={readOnly || saving}
            >
              {AGENDA_UNIDADES.map((u) => (
                <option key={u.slug} value={u.slug}>{u.label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={agendar} disabled={readOnly || saving} className="btn btn-primary">
            <Check className="h-4 w-4" /> Agendar coleta
          </button>
          <p className="text-xs text-slate-400">Aparece no Calendário e no card do atendimento.</p>
        </div>
      )}

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
