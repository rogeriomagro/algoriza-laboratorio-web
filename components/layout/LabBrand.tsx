"use client";

import Image from "next/image";

interface LabBrandProps {
  compact?: boolean;
}

export function LabBrand({ compact = false }: LabBrandProps) {
  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-5"}`}>
      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 shadow-sm shadow-slate-900/5">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white">
          <Image
            src="/labs/penha-logo.jpg"
            alt="Laboratório Nossa Senhora da Penha"
            width={36}
            height={36}
            className="h-8 w-8 object-contain"
          />
        </div>
        <div className={compact ? "hidden lg:block" : "block"}>
          <span className="block text-[10px] uppercase tracking-[0.08em] text-slate-400">Laboratório</span>
          <span className="block text-sm font-semibold leading-tight text-slate-800">Nossa Senhora da Penha</span>
        </div>
      </div>

      <div className="h-7 w-px bg-slate-200" />

      <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 shadow-sm shadow-slate-900/5">
        <div className="flex h-10 w-[54px] items-center justify-center overflow-hidden rounded-lg bg-white px-1">
          <Image
            src="/labs/alfa-logo.png"
            alt="Alfa Diagnóstico"
            width={50}
            height={30}
            className="h-7 w-auto object-contain"
          />
        </div>
        <div className={compact ? "hidden lg:block" : "block"}>
          <span className="block text-[10px] uppercase tracking-[0.08em] text-slate-400">Laboratório</span>
          <span className="block text-sm font-semibold leading-tight text-slate-800">Alfa Diagnóstico</span>
        </div>
      </div>
    </div>
  );
}
