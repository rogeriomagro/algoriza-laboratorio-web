import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { KANBAN_GROUPS } from "@/lib/kanban";
import type { ColumnState } from "@/hooks/useKanbanBoard";

interface KanbanBoardProps {
  columns: Record<string, ColumnState>;
  onLoadMore: (key: string) => void;
  onChanged?: () => void | Promise<void>;
}

export function KanbanBoard({ columns, onLoadMore, onChanged }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {KANBAN_GROUPS.map((group) => {
        const state = columns[group.key];
        return (
          <KanbanColumn
            key={group.key}
            title={group.title}
            description={group.description}
            items={state?.items ?? []}
            total={state?.total ?? 0}
            loading={state?.loading ?? true}
            loadingMore={state?.loadingMore ?? false}
            error={state?.error}
            onLoadMore={() => onLoadMore(group.key)}
            onChanged={onChanged}
          />
        );
      })}
    </div>
  );
}
