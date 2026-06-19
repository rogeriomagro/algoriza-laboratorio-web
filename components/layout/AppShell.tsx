"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, RefreshCw, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useValidatorName } from "@/hooks/useValidatorName";
import { LabBrand } from "@/components/layout/LabBrand";

interface AppShellProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  realtimeState?: string;
}

export function AppShell({ children, onRefresh, realtimeState }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { validatorName } = useValidatorName();
  const [validatorMenuOpen, setValidatorMenuOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navItems = [
    { href: "/", label: "Kanban", disabled: false },
    { href: "/calendario", label: "Calendário", disabled: false },
    { href: "/usuarios", label: "Usuários", disabled: false },
    { href: "/sugestoes-base", label: "Base de exames", disabled: true },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-brand-forest/10 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex min-w-0 shrink items-center gap-3">
              <div className="shrink-0">
                <LabBrand compact />
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-[13px] font-semibold leading-tight tracking-tight text-brand-forest min-[1366px]:text-[14px]">
                  Validação de Orçamentos
                </p>
                <p className="truncate text-[11px] text-slate-600 min-[1366px]:text-xs">
                  Penha + Alfa Diagnóstico
                </p>
              </div>
            </div>

            <div className="order-3 flex w-full shrink-0 items-center gap-2 min-[1600px]:order-none min-[1600px]:w-auto">
              <nav className="flex items-center overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
                {navItems.map((item, index) => {
                  const active = pathname === item.href;
                  const edgeClass =
                    index === 0
                      ? "rounded-l-xl"
                      : index === navItems.length - 1
                        ? "rounded-r-xl"
                        : "";

                  if (item.disabled) {
                    return (
                      <span
                        key={item.href}
                        title="Em desenvolvimento"
                        className={`cursor-not-allowed border-l border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400 first:border-l-0 ${edgeClass}`}
                      >
                        {item.label}
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`border-l border-slate-200 px-3 py-2 text-sm font-medium transition first:border-l-0 ${edgeClass} ${
                        active
                          ? "bg-brand-mint/60 text-brand-forest shadow-inner shadow-brand-emerald/5"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              {realtimeState ? (
                <span className="hidden h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 sm:inline-flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Online
                </span>
              ) : null}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setValidatorMenuOpen((open) => !open)}
                  title={`Validador: ${validatorName || "Usuário sem nome"}`}
                  className="inline-flex h-9 max-w-[140px] items-center gap-2 rounded-xl border border-brand-emerald/15 bg-brand-mint/30 px-3 text-sm text-brand-forest shadow-sm shadow-slate-900/5 transition hover:bg-brand-mint/50 sm:max-w-[210px]"
                >
                  <UserRound className="h-4 w-4 shrink-0 text-brand-forest/80" />
                  <span className="truncate whitespace-nowrap font-medium">
                    Validador: {validatorName || "Usuário sem nome"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-brand-forest/60 transition ${validatorMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {validatorMenuOpen ? (
                  <>
                    <button
                      type="button"
                      aria-hidden="true"
                      tabIndex={-1}
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setValidatorMenuOpen(false)}
                    />
                    <div className="menu-surface absolute right-0 top-[calc(100%+6px)] z-50 min-w-[220px] max-w-[300px]">
                      <div className="px-3 py-2">
                        <p className="field-label">Validador</p>
                        <p className="mt-0.5 break-words text-sm font-medium text-slate-900">
                          {validatorName || "Usuário sem nome"}
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <span className="hidden whitespace-nowrap text-[11px] text-slate-400 min-[1500px]:inline">
                Powered by <span className="font-medium text-slate-500">Algoriza</span>
              </span>

              {onRefresh ? (
                <button className="btn btn-secondary h-9 px-3.5 py-0" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>
              ) : null}

              <button className="btn btn-secondary h-9 px-3.5 py-0" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4">{children}</main>
    </div>
  );
}
