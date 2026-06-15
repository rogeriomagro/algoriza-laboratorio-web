"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && !session && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, pathname, router, session]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Carregando sessão...</div>;
  }

  if (!session && pathname !== "/login") return null;

  return <>{children}</>;
}
