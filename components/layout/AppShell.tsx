"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useValidatorName } from "@/hooks/useValidatorName";

interface AppShellProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  realtimeState?: string;
}

export function AppShell({ children, onRefresh, realtimeState }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { validatorName, setValidatorName } = useValidatorName();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const navItems = [
    { href: "/", label: "Kanban" },
    { href: "/sugestoes-base", label: "Sugestões da base" }
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-brand-emerald/20 bg-gradient-to-r from-brand-deep via-brand-forest to-brand-emerald text-white shadow-lg shadow-brand-forest/20">
        <div className="h-1 bg-gradient-to-r from-brand-teal via-brand-mint to-white/80" />
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white">
              <img src="/brand/brand-mark.png" alt="" className="h-9 w-9 object-contain" />
            </span>
            <span>
              <span className="block text-base font-semibold text-white">Validação de Orçamentos</span>
              <span className="block text-xs text-brand-mint">Laboratórios Nossa Senhora da Penha e Alfa Diagnóstico</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="mr-1 flex rounded-lg border border-white/15 bg-white/10 p-1 text-sm">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-md px-3 py-1.5 font-medium transition ${
                      active ? "bg-white text-brand-forest" : "text-white/85 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            {realtimeState ? (
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-brand-mint">
                Realtime: {realtimeState}
              </span>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <span className="text-white/80">Validador atual</span>
              <input
                className="w-44 rounded-md border border-white/20 bg-white px-2 py-1 text-sm text-brand-charcoal outline-none focus:border-brand-mint focus:ring-2 focus:ring-white/20"
                value={validatorName}
                onChange={(event) => setValidatorName(event.target.value)}
                placeholder="Nome"
              />
            </label>
            {onRefresh ? (
              <button className="btn border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            ) : null}
            <button className="btn border border-white/20 bg-white text-brand-forest hover:bg-brand-mint" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-5">{children}</main>
    </div>
  );
}
