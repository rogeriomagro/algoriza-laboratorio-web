"use client";

import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarioView } from "@/components/calendario/CalendarioView";

export default function CalendarioPage() {
  return (
    <AuthGate>
      <AppShell>
        <CalendarioView />
      </AppShell>
    </AuthGate>
  );
}
