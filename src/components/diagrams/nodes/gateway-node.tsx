"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type GatewayNodeData = {
  label?: string;
  color?: string;
};

export function GatewayNode({ data }: NodeProps) {
  const d = data as GatewayNodeData;
  return (
    <div className="flex items-center justify-center" style={{ width: 90, height: 90 }}>
      <Handle type="target" position={Position.Left} className="!bg-[#02a2fd] !w-2 !h-2" />
      <div
        className="flex items-center justify-center shadow-md border-2 border-[#02a2fd] bg-white dark:bg-gray-900"
        style={{
          width: 64,
          height: 64,
          transform: "rotate(45deg)",
          borderRadius: 6,
        }}
      >
        <span
          className="text-[10px] font-bold text-[#02a2fd] text-center leading-tight"
          style={{ transform: "rotate(-45deg)", maxWidth: 50 }}
        >
          {d.label ?? "Gateway"}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-[#02a2fd] !w-2 !h-2" />
    </div>
  );
}
