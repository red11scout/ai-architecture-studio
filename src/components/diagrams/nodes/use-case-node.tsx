"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type UseCaseNodeData = {
  label?: string;
  description?: string;
  agenticPattern?: string;
  primaryPattern?: string;
  priorityTier?: string;
  color?: string;
};

export function UseCaseNode({ data }: NodeProps) {
  const d = data as UseCaseNodeData;
  return (
    <div
      className="rounded-lg px-4 py-3 shadow-md min-w-[140px] max-w-[220px] text-center"
      style={{ backgroundColor: d.color ?? "#02a2fd" }}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/60 !w-2 !h-2" />
      <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-0.5">
        Use Case
      </p>
      <p className="text-sm font-semibold text-white leading-tight truncate">
        {d.label ?? "Use Case"}
      </p>
      {d.description && (
        <p className="text-[10px] text-white/70 mt-1 leading-tight line-clamp-2">
          {d.description}
        </p>
      )}
      {d.priorityTier && (
        <span className="inline-block mt-1.5 text-[9px] font-medium bg-white/20 text-white rounded-full px-2 py-0.5">
          {d.priorityTier}
        </span>
      )}
      <Handle type="source" position={Position.Right} className="!bg-white/60 !w-2 !h-2" />
    </div>
  );
}
