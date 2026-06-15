"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useRealtimeAtendimentos(onChange: () => void) {
  const [state, setState] = useState("conectando");

  useEffect(() => {
    const channel = supabase
      .channel("atendimentos-kanban")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "atendimentos" },
        () => onChange()
      )
      .subscribe((status) => {
        setState(status === "SUBSCRIBED" ? "ativo" : status.toLowerCase());
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);

  return state;
}
