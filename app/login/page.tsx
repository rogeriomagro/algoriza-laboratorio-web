"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useSession } from "@/hooks/useSession";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && session) router.replace("/");
  }, [loading, router, session]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7f6ef_0%,#e8f4ee_46%,#cfe7df_100%)] p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-lg border border-brand-forest/10 bg-white shadow-2xl shadow-brand-forest/15 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex items-center justify-center p-5 sm:p-8">
            <LoginForm />
          </div>
          <aside className="hidden min-h-[560px] border-l border-brand-forest/10 bg-brand-forest lg:block">
            <div
              className="h-full bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(4,47,40,0.42), rgba(0,122,90,0.10)), url('/brand/brand-identity.jpg')"
              }}
              aria-hidden="true"
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
