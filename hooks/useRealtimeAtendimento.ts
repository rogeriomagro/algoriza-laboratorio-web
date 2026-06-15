"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useRealtimeAtendimento(atendimentoId: string | null, onChange: () => void) {
  const [state, setState] = useState("conectando");
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!atendimentoId) return;

    const channel = supabase
      .channel(`atendimento-${atendimentoId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "atendimentos", filter: `id=eq.${atendimentoId}` },
        () => {
          setChanged(true);
          onChange();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "atendimento_exames", filter: `atendimento_id=eq.${atendimentoId}` },
        () => {
          setChanged(true);
          onChange();
        }
      )
      .subscribe((status) => {
        setState(status === "SUBSCRIBED" ? "ativo" : status.toLowerCase());
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [atendimentoId, onChange]);

  return { state, changed, clearChanged: () => setChanged(false) };
}
