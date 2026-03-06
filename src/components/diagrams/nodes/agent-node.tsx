"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type AgentNodeData = {
  label?: string;
  primitives?: string[];
  agenticPattern?: string;
  color?: string;
};

export function AgentNode({ data }: NodeProps) {
  const d = data as AgentNodeData;
  return (
    <div
      className="rounded-lg px-4 py-3 shadow-md min-w-[140px] max-w-[200px] text-center"
      style={{
        background: "linear-gradient(135deg, #02a2fd 0%, #001278 100%)",
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/60 !w-2 !h-2" />
      <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-0.5">
        Agent
      </p>
      <p className="text-sm font-semibold text-white leading-tight truncate">
        {d.label ?? "Agent"}
      </p>
      {d.primitives && d.primitives.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-1.5">
          {d.primitives.slice(0, 3).map((p, i) => (
            <span
              key={i}
              className="text-[8px] font-medium bg-white/20 text-white rounded px-1.5 py-0.5"
            >
              {p}
            </span>
          ))}
          {d.primitives.length > 3 && (
            <span className="text-[8px] text-white/60">
              +{d.primitives.length - 3}
            </span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-white/60 !w-2 !h-2" />
    </div>
  );
}
