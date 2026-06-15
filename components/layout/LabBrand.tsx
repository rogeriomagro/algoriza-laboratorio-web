"use client";

import Image from "next/image";

interface LabBrandProps {
  compact?: boolean;
}

export function LabBrand({ compact = false }: LabBrandProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-3" : "gap-4"}`}>
      <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Image src="/labs/penha-logo.jpg" alt="Laboratório Nossa Senhora da Penha" width={42} height={42} className="h-9 w-9 object-contain" />
        </div>
        {!compact ? <span className="text-sm font-semibold text-slate-800">Nossa Senhora da Penha</span> : null}
      </div>

      <div className="h-8 w-px bg-white/20" />

      <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-2 shadow-sm">
        <div className="flex h-11 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white px-1">
          <Image src="/labs/alfa-logo.png" alt="Alfa Diagnóstico" width={56} height={36} className="h-8 w-auto object-contain" />
        </div>
        {!compact ? <span className="text-sm font-semibold text-slate-800">Alfa Diagnóstico</span> : null}
      </div>
    </div>
  );
}
