"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type ToolNodeData = {
  label?: string;
  integrations?: string[];
  dataTypes?: string[];
  color?: string;
};

export function ToolNode({ data }: NodeProps) {
  const d = data as ToolNodeData;
  return (
    <div className="rounded-lg px-4 py-3 shadow-md min-w-[130px] max-w-[180px] text-center bg-gray-100 dark:bg-gray-800 border-2 border-[#02a2fd]">
      <Handle type="target" position={Position.Left} className="!bg-[#02a2fd] !w-2 !h-2" />
      <p className="text-[11px] font-bold text-[#02a2fd] uppercase tracking-wider mb-0.5">
        Tool
      </p>
      <p className="text-sm font-semibold text-foreground leading-tight truncate">
        {d.label ?? "Tool"}
      </p>
      {d.integrations && d.integrations.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center mt-1.5">
          {d.integrations.slice(0, 2).map((int, i) => (
            <span
              key={i}
              className="text-[8px] font-medium bg-[#02a2fd]/10 text-[#02a2fd] rounded px-1.5 py-0.5"
            >
              {int}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-[#02a2fd] !w-2 !h-2" />
    </div>
  );
}
