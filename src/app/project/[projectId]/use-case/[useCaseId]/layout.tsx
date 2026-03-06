"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Layers, GitBranch, Database, ShieldCheck,
  DollarSign, FileText, CalendarDays
} from "lucide-react";
import { useProject } from "../../layout";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Architecture", href: "/architecture", icon: Layers },
  { label: "Workflow", href: "/workflow", icon: GitBranch },
  { label: "Data", href: "/data", icon: Database },
  { label: "Governance", href: "/governance", icon: ShieldCheck },
  { label: "Financial", href: "/financial", icon: DollarSign },
  { label: "PRD", href: "/prd", icon: FileText },
  { label: "Roadmap", href: "/roadmap", icon: CalendarDays },
];

export default function UseCaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { architectures } = useProject();

  const arch = architectures.find((a) => a.useCaseId === params.useCaseId);
  const basePath = `/project/${params.projectId}/use-case/${params.useCaseId}`;
  const isActive = (href: string) => pathname === basePath + href;

  return (
    <div className="flex flex-col h-full">
      {/* Use case header */}
      <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">
            {arch?.useCaseName || "Use Case"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(arch as any)?.implementationPhase
              ? `Phase ${(arch as any).implementationPhase}`
              : ""}
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.href}
              onClick={() => router.push(basePath + tab.href)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                isActive(tab.href)
                  ? "border-[#02a2fd] text-[#02a2fd]"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
