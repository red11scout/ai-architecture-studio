"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type HITLNodeData = {
  label?: string;
  hitlCheckpoint?: string;
  epochFlags?: string;
  color?: string;
};

/** Map epoch flag shorthand to a border-color indicator */
function epochColor(flags: string | undefined): string {
  if (!flags) return "#f59e0b"; // amber-500
  const f = flags.toLowerCase();
  if (f.includes("red") || f.includes("critical")) return "#ef4444";
  if (f.includes("yellow") || f.includes("caution")) return "#f59e0b";
  if (f.includes("green") || f.includes("safe")) return "#22c55e";
  return "#f59e0b";
}

export function HITLNode({ data }: NodeProps) {
  const d = data as HITLNodeData;
  const borderColor = epochColor(d.epochFlags);

  return (
    <div
      className="rounded-lg px-4 py-3 shadow-md min-w-[140px] max-w-[200px] text-center bg-amber-50 dark:bg-amber-950/40"
      style={{ borderWidth: 2, borderStyle: "solid", borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!bg-amber-500 !w-2 !h-2" />
      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">
        HITL Checkpoint
      </p>
      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 leading-tight truncate">
        {d.label ?? "Human Review"}
      </p>
      {d.hitlCheckpoint && (
        <p className="text-[10px] text-amber-700/70 dark:text-amber-300/70 mt-1 leading-tight line-clamp-2">
          {d.hitlCheckpoint}
        </p>
      )}
      {d.epochFlags && (
        <span
          className="inline-block mt-1.5 text-[9px] font-semibold rounded-full px-2 py-0.5 text-white"
          style={{ backgroundColor: borderColor }}
        >
          {d.epochFlags}
        </span>
      )}
      <Handle type="source" position={Position.Right} className="!bg-amber-500 !w-2 !h-2" />
    </div>
  );
}
