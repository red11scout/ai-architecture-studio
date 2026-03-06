"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type DefaultNodeData = {
  label?: string;
  items?: string[];
  description?: string;
  color?: string;
};

export function DefaultDiagramNode({ data }: NodeProps) {
  const d = data as DefaultNodeData;
  return (
    <div className="rounded-lg px-4 py-3 shadow-md min-w-[130px] max-w-[200px] text-center bg-background border border-border">
      <Handle type="target" position={Position.Left} className="!bg-border !w-2 !h-2" />
      <p className="text-sm font-semibold text-foreground leading-tight truncate">
        {d.label ?? "Node"}
      </p>
      {d.description && (
        <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">
          {d.description}
        </p>
      )}
      {d.items && d.items.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-1.5">
          {d.items.slice(0, 3).map((item, i) => (
            <span
              key={i}
              className="text-[8px] font-medium bg-muted text-muted-foreground rounded px-1.5 py-0.5"
            >
              {item}
            </span>
          ))}
          {d.items.length > 3 && (
            <span className="text-[8px] text-muted-foreground">
              +{d.items.length - 3}
            </span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-border !w-2 !h-2" />
    </div>
  );
}
