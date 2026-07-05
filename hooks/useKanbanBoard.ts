"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Atendimento } from "@/lib/supabase/types";
import {
  KANBAN_GROUPS,
  KANBAN_SELECT,
  SEARCH_COLUMNS,
  labUnidadePatterns,
  sanitizeSearch,
  type KanbanFilters,
  type KanbanGroup,
} from "@/lib/kanban";

export interface ColumnState {
  items: Atendimento[];
  total: number; // total real no servidor (com filtros), independente de quantos foram carregados
  loaded: number; // quantas linhas foram pedidas nesta coluna
  loading: boolean; // carga da página 1 (troca de filtro / primeira carga)
  loadingMore: boolean; // "Carregar mais"
  error: string | null;
}

type ColumnMap = Record<string, ColumnState>;
type FetchMode = "reset" | "more" | "refresh";

function initialColumns(): ColumnMap {
  const out: ColumnMap = {};
  for (const g of KANBAN_GROUPS) {
    out[g.key] = { items: [], total: 0, loaded: g.pageSize, loading: true, loadingMore: false, error: null };
  }
  return out;
}

async function queryColumn(group: KanbanGroup, filters: KanbanFilters, limit: number) {
  let q = supabase
    .from("atendimentos")
    .select(KANBAN_SELECT, { count: "exact" })
    .in("status", group.statuses);

  const search = sanitizeSearch(filters.query);
  if (search) {
    q = q.or(SEARCH_COLUMNS.map((c) => `${c}.ilike.%${search}%`).join(","));
  }
  if (filters.validador) {
    q = q.eq("validado_por", filters.validador);
  }
  const labPatterns = labUnidadePatterns(filters.lab);
  if (labPatterns) {
    q = q.or(labPatterns.map((p) => `unidade_preferida.ilike.${p}`).join(","));
  }

  const { data, count, error } = await q
    .order(group.orderColumn, { ascending: group.ascending })
    .order("id", { ascending: group.ascending })
    .range(0, Math.max(0, limit - 1));

  return {
    items: (data || []) as Atendimento[],
    total: count ?? 0,
    error: error ? error.message : null,
  };
}

export function useKanbanBoard(filters: KanbanFilters) {
  const [columns, setColumns] = useState<ColumnMap>(initialColumns);

  // Refs para o refresh (realtime) não capturar filtros/loaded desatualizados.
  const filtersRef = useRef(filters);
  const loadedRef = useRef<Record<string, number>>(
    Object.fromEntries(KANBAN_GROUPS.map((g) => [g.key, g.pageSize]))
  );

  const fetchColumn = useCallback(async (group: KanbanGroup, limit: number, mode: FetchMode) => {
    if (mode !== "refresh") {
      setColumns((prev) => ({
        ...prev,
        [group.key]: {
          ...prev[group.key],
          loading: mode === "reset",
          loadingMore: mode === "more",
        },
      }));
    }

    const res = await queryColumn(group, filtersRef.current, limit);
    loadedRef.current[group.key] = limit;

    setColumns((prev) => ({
      ...prev,
      [group.key]: {
        items: res.items,
        total: res.total,
        loaded: limit,
        loading: false,
        loadingMore: false,
        error: res.error,
      },
    }));
  }, []);

  // Toda mudança de filtro reinicia as colunas na página 1.
  useEffect(() => {
    filtersRef.current = filters;
    for (const g of KANBAN_GROUPS) loadedRef.current[g.key] = g.pageSize;
    KANBAN_GROUPS.forEach((g) => fetchColumn(g, g.pageSize, "reset"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query, filters.validador, filters.lab, fetchColumn]);

  const loadMore = useCallback(
    (key: string) => {
      const group = KANBAN_GROUPS.find((g) => g.key === key);
      if (!group) return;
      const next = (loadedRef.current[key] ?? group.pageSize) + group.pageSize;
      fetchColumn(group, next, "more");
    },
    [fetchColumn]
  );

  // Re-busca todas as colunas nas páginas atuais (realtime / botão Atualizar) — bounded.
  const refresh = useCallback(() => {
    KANBAN_GROUPS.forEach((g) => fetchColumn(g, loadedRef.current[g.key] ?? g.pageSize, "refresh"));
  }, [fetchColumn]);

  return { columns, loadMore, refresh };
}
