"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { AlertCircle, CalendarClock, MoreHorizontal, Phone, XCircle } from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import { formatCurrency, formatDate, formatPhone } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface AtendimentoCardProps {
  atendimento: Atendimento;
  onChanged?: () => void | Promise<void>;
}

export function AtendimentoCard({ atendimento, onChanged }: AtendimentoCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const total = atendimento.total_validado ?? atendimento.total_bruto;
  const hasMissingTerms =
    Array.isArray(atendimento.termos_nao_encontrados) && atendimento.termos_nao_encontrados.length > 0;

  useEffect(() => {
    function handleClick(event: MouseEvent | globalThis.MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    }

    if (menuOpen) {
      window.addEventListener("click", handleClick);
    }

    return () => window.removeEventListener("click", handleClick);
  }, [menuOpen]);

  async function handleCancel(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const ok = window.confirm(
      "Cancelar este atendimento no quadro?\n\nOs dados continuam salvos no banco. Apenas o status será alterado para cancelado."
    );
    if (!ok) return;

    setCancelling(true);

    const { error } = await supabase.from("atendimentos").update({ status: "cancelado" }).eq("id", atendimento.id);

    setCancelling(false);

    if (error) {
      window.alert(`Não foi possível cancelar o atendimento: ${error.message}`);
      return;
    }

    setMenuOpen(false);
    await onChanged?.();
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition hover:border-brand-emerald/30 hover:shadow-md hover:shadow-brand-forest/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.04em] text-slate-500">{atendimento.protocolo || "Sem protocolo"}</p>
          <h3 className="mt-1 text-lg font-semibold leading-tight text-slate-950">
            {atendimento.paciente_nome || "Paciente não informado"}
          </h3>
        </div>

        <div className="flex items-start gap-2">
          <StatusBadge status={atendimento.status} />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMenuOpen((current) => !current);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-emerald/25 hover:bg-brand-mint/60 hover:text-brand-forest"
              aria-label="Abrir ações do card"
              title="Ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div className="menu-surface absolute right-0 top-11 z-20 min-w-[180px]">
                <Link
                  href={`/atendimentos/${atendimento.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  Abrir detalhes
                </Link>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" />
                  {cancelling ? "Cancelando..." : "Cancelar card"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Link href={`/atendimentos/${atendimento.id}`} className="block">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="soft-card py-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="h-4 w-4 text-brand-emerald" />
              <span>{formatPhone(atendimento.telefone)}</span>
            </div>
          </div>

          <div className="soft-card py-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarClock className="h-4 w-4 text-brand-emerald" />
              <span>{formatDate(atendimento.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-brand-emerald/10 bg-[linear-gradient(180deg,#f8fcfa_0%,#f2f8f5_100%)] px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Total atual</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-brand-forest">{formatCurrency(total)}</p>
        </div>

        {hasMissingTerms ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
            <AlertCircle className="h-3.5 w-3.5" />
            Termos não encontrados
          </div>
        ) : null}
      </Link>
    </article>
  );
}
