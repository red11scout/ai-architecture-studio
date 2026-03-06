"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

type FinancialNodeData = {
  label?: string;
  formattedTotal?: string;
  formattedProbability?: string;
  costBenefit?: string;
  revenueBenefit?: string;
  riskBenefit?: string;
  cashFlowBenefit?: string;
  color?: string;
};

export function FinancialNode({ data }: NodeProps) {
  const d = data as FinancialNodeData;
  return (
    <div
      className="rounded-lg px-4 py-3 shadow-md min-w-[140px] max-w-[200px] text-center"
      style={{ backgroundColor: d.color ?? "#36bf78" }}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/60 !w-2 !h-2" />
      <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-0.5">
        Financial Value
      </p>
      <p className="text-sm font-bold text-white leading-tight">
        {d.formattedTotal ?? d.label ?? "$0"}
      </p>
      {d.formattedProbability && (
        <p className="text-[10px] text-white/70 mt-0.5">
          P(success): {d.formattedProbability}
        </p>
      )}
      <Handle type="source" position={Position.Right} className="!bg-white/60 !w-2 !h-2" />
    </div>
  );
}
