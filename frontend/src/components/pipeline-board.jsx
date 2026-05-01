import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { pipelineStages } from "@/lib/constants";
import { stageLabel } from "@/lib/format";

function PipelineBoard({ board, isSaving, onMove }) {
  const [dragging, setDragging] = useState(null);
  const orderedBoard = useMemo(
    () =>
      pipelineStages.map((stage) => ({
        stage,
        items: board?.[stage] || []
      })),
    [board]
  );

  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="grid min-w-[980px] gap-4 px-1 xl:min-w-0 xl:grid-cols-7">
      {orderedBoard.map((column) => (
        <div
          key={column.stage}
          className="rounded-[28px] border border-border/80 bg-secondary/35 p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (dragging && dragging.stage !== column.stage) {
              onMove(dragging, column.stage);
            }
            setDragging(null);
          }}
        >
          <div className="mb-3 flex items-center justify-between px-2 pt-2">
            <div className="text-sm font-semibold text-foreground">{stageLabel(column.stage)}</div>
            <Badge tone="default">{column.items.length}</Badge>
          </div>
          <div className="grid gap-3">
            {column.items.map((item) => (
              <Card
                key={item._id}
                draggable
                onDragStart={() => setDragging({ id: item._id, stage: item.stage, item })}
                onDragEnd={() => setDragging(null)}
                className="cursor-grab p-4 active:cursor-grabbing"
              >
                <div className="text-sm font-semibold text-foreground">
                  {item.candidate?.firstName} {item.candidate?.lastName}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {item.job?.title || "Role unavailable"}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge tone="primary">{item.score ?? "--"} fit</Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.owner?.firstName || "Unassigned"}
                  </span>
                </div>
              </Card>
            ))}
            {!column.items.length ? (
              <div className="rounded-[24px] border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                Drop candidates here
              </div>
            ) : null}
          </div>
        </div>
      ))}
      {isSaving ? <div className="xl:col-span-7 text-sm text-muted-foreground">Saving pipeline changes...</div> : null}
      </div>
    </div>
  );
}

export default PipelineBoard;
