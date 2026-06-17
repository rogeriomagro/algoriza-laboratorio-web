"use client";

import Image from "next/image";

interface LabBrandProps {
  compact?: boolean;
}

export function LabBrand({ compact = false }: LabBrandProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-4"}`}>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2 py-1 shadow-sm shadow-slate-900/5">
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-white">
          <Image
            src="/labs/penha-logo.jpg"
            alt="Laboratório Nossa Senhora da Penha"
            width={30}
            height={30}
            className="h-7 w-7 object-contain"
          />
        </div>
        <div className={compact ? "hidden min-[1180px]:block" : "block"}>
          <span className="block text-[9px] uppercase tracking-[0.08em] text-slate-400">Laboratório</span>
          <span className="block text-xs font-semibold leading-tight text-slate-800">Nossa Senhora da Penha</span>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2 py-1 shadow-sm shadow-slate-900/5">
        <div className="flex h-8 w-11 items-center justify-center overflow-hidden rounded-md bg-white px-1">
          <Image
            src="/labs/alfa-logo.png"
            alt="Alfa Diagnóstico"
            width={42}
            height={24}
            className="h-6 w-auto object-contain"
          />
        </div>
        <div className={compact ? "hidden min-[1180px]:block" : "block"}>
          <span className="block text-[9px] uppercase tracking-[0.08em] text-slate-400">Laboratório</span>
          <span className="block text-xs font-semibold leading-tight text-slate-800">Alfa Diagnóstico</span>
        </div>
      </div>
    </div>
  );
}
