"use client";

import Image from "next/image";

interface LabBrandProps {
  compact?: boolean;
}

export function LabBrand({ compact = false }: LabBrandProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-5"}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white">
          <Image
            src="/labs/penha-logo.jpg"
            alt="Laboratório Nossa Senhora da Penha"
            width={44}
            height={44}
            className="h-10 w-10 object-contain"
          />
        </div>
        <div className={compact ? "hidden xl:block" : "block"}>
          <span className="block text-[11px] uppercase tracking-[0.08em] text-slate-500">Laboratório</span>
          <span className="block text-sm font-semibold text-slate-800">Nossa Senhora da Penha</span>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-200" />

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex h-12 w-[60px] items-center justify-center overflow-hidden rounded-xl bg-white px-1">
          <Image src="/labs/alfa-logo.png" alt="Alfa Diagnóstico" width={58} height={36} className="h-8 w-auto object-contain" />
        </div>
        <div className={compact ? "hidden xl:block" : "block"}>
          <span className="block text-[11px] uppercase tracking-[0.08em] text-slate-500">Laboratório</span>
          <span className="block text-sm font-semibold text-slate-800">Alfa Diagnóstico</span>
        </div>
      </div>
    </div>
  );
}
