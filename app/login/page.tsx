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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,122,90,0.12),_transparent_35%),linear-gradient(180deg,#f5fbf8_0%,#edf7f2_42%,#f7faf9_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
