import type { Atendimento } from "@/lib/supabase/types";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import type { AtendimentoStatus } from "@/lib/supabase/types";

interface KanbanBoardProps {
  atendimentos: Atendimento[];
  onChanged?: () => void | Promise<void>;
}

const KANBAN_GROUPS: Array<{
  key: string;
  title: string;
  description: string;
  statuses: AtendimentoStatus[];
  oldestFirst?: boolean;
}> = [
  {
    key: "aguardando",
    title: "Aguardando",
    description: "Novos atendimentos enviados pelo bot",
    statuses: ["aguardando_validacao"],
    oldestFirst: true
  },
  {
    key: "em_validacao",
    title: "Em validação",
    description: "Atendimentos em revisão humana",
    statuses: ["em_validacao"]
  },
  {
    key: "finalizados",
    title: "Validados / enviados",
    description: "Orçamentos aprovados e já encaminhados ao cliente",
    statuses: ["validado", "enviado"]
  },
  {
    key: "convertido",
    title: "Convertido",
    description: "Orçamentos que viraram coleta/venda",
    statuses: ["convertido"]
  },
  {
    key: "rejeitado",
    title: "Rejeitado",
    description: "Atendimentos rejeitados",
    statuses: ["rejeitado"]
  }
];

function getTime(atendimento: Atendimento) {
  return atendimento.created_at ? new Date(atendimento.created_at).getTime() : 0;
}

export function KanbanBoard({ atendimentos, onChanged }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {KANBAN_GROUPS.map((group) => {
        const items = atendimentos
          .filter((atendimento) => group.statuses.includes(atendimento.status))
          .sort((a, b) => (group.oldestFirst ? getTime(a) - getTime(b) : getTime(b) - getTime(a)));

        return (
          <KanbanColumn
            key={group.key}
            title={group.title}
            description={group.description}
            items={items}
            onChanged={onChanged}
          />
        );
      })}
    </div>
  );
}
