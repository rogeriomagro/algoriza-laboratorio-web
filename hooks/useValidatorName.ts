"use client";

import { useMemo } from "react";
import { useSession } from "@/hooks/useSession";

function toDisplayName(email?: string | null) {
  if (!email) return "";

  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function useValidatorName() {
  const { session, loading } = useSession();

  const validatorName = useMemo(() => {
    const metadata = session?.user?.user_metadata ?? {};
    return metadata.full_name || metadata.name || toDisplayName(session?.user?.email);
  }, [session]);

  return { validatorName, loading };
}
