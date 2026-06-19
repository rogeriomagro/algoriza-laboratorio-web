"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CalendarClock, MoreHorizontal, Phone, XCircle } from "lucide-react";
import type { Atendimento } from "@/lib/supabase/types";
import { LAB_META, formatCurrency, formatDate, formatPhone, labFromUnidade, parseCurrency } from "@/lib/format";
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

  const grossTotal = atendimento.total_validado ?? atendimento.total_bruto;
  const descontoPct = Number(atendimento.desconto_pct ?? 0) || 0;
  const grossNum = parseCurrency(grossTotal);
  const total = grossNum === null ? grossTotal : grossNum * (1 - descontoPct / 100);
  const labMeta = labFromUnidade(atendimento.unidade_preferida);
  const missingCount = Array.isArray(atendimento.termos_nao_encontrados)
    ? atendimento.termos_nao_encontrados.length
    : 0;

  useEffect(() => {
    function handleClick(event: MouseEvent | globalThis.MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    }

    if (menuOpen) window.addEventListener("click", handleClick);
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
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 transition hover:border-brand-emerald/30 hover:shadow-md hover:shadow-brand-forest/10">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Link href={`/atendimentos/${atendimento.id}`} className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium tracking-[0.03em] text-slate-500">
            {atendimento.protocolo || "Sem protocolo"}
          </p>
          <h3 className="mt-0.5 truncate text-sm font-semibold leading-tight text-slate-950">
            {atendimento.paciente_nome || "Paciente não informado"}
          </h3>
          {labMeta ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5">
              <Image
                src={LAB_META[labMeta].logo}
                alt={LAB_META[labMeta].nome}
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain"
              />
              <span className="text-[10px] font-medium text-slate-600">
                {labMeta === "alfa" ? "Alfa Labs" : "N. S. da Penha"}
              </span>
            </span>
          ) : null}
        </Link>

        <div className="flex shrink-0 items-start gap-1.5">
          <StatusBadge status={atendimento.status} />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMenuOpen((current) => !current);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-brand-emerald/25 hover:bg-brand-mint/60 hover:text-brand-forest"
              aria-label="Abrir ações do card"
              title="Ações"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div className="menu-surface absolute right-0 top-8 z-20 min-w-[170px]">
                <Link
                  href={`/atendimentos/${atendimento.id}`}
                  className="block rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                >
                  Abrir detalhes
                </Link>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
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
        <div className="grid gap-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-brand-emerald" />
            <span className="truncate">{formatPhone(atendimento.telefone)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-brand-emerald" />
            <span className="truncate">{formatDate(atendimento.created_at)}</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-brand-emerald/10 bg-[linear-gradient(180deg,#f8fcfa_0%,#f2f8f5_100%)] px-3 py-2">
          <span className="text-xs font-medium text-slate-500">Total</span>
          <span className="text-sm font-semibold tracking-tight text-brand-forest">{formatCurrency(total)}</span>
        </div>

        {missingCount > 0 ? (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
            <AlertCircle className="h-3 w-3" />
            {missingCount} termo{missingCount === 1 ? "" : "s"} pendente{missingCount === 1 ? "" : "s"}
          </div>
        ) : null}
      </Link>
    </article>
  );
}
