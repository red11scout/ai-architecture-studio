"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type ThemeNodeData = {
  label?: string;
  targetState?: string;
  currentState?: string;
  primaryDriverImpact?: string;
  color?: string;
};

export function ThemeNode({ data }: NodeProps) {
  const d = data as ThemeNodeData;
  return (
    <div
      className="rounded-lg px-4 py-3 shadow-md min-w-[140px] max-w-[200px] text-center"
      style={{ backgroundColor: d.color ?? "#001278" }}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/60 !w-2 !h-2" />
      <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-0.5">
        Strategic Theme
      </p>
      <p className="text-sm font-semibold text-white leading-tight truncate">
        {d.label ?? "Theme"}
      </p>
      {d.targetState && (
        <p className="text-[10px] text-white/70 mt-1 leading-tight line-clamp-2">
          {d.targetState}
        </p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-white/60 !w-2 !h-2" />
    </div>
  );
}
