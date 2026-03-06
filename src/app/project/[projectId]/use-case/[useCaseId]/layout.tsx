"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Layers, GitBranch, ShieldCheck,
  DollarSign, FileText, CalendarDays,
  Download, Share2, FileJson, Printer, Link2, Check, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "../../layout";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Architecture", href: "/architecture", icon: Layers },
  { label: "Workflow", href: "/workflow", icon: GitBranch },
  { label: "Data & Governance", href: "/data-governance", icon: ShieldCheck },
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
  const [exportOpen, setExportOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const arch = architectures.find((a) => a.useCaseId === params.useCaseId);
  const basePath = `/project/${params.projectId}/use-case/${params.useCaseId}`;
  const isActive = (href: string) => pathname === basePath + href;

  const handleJsonExport = useCallback(async () => {
    setExportOpen(false);
    const res = await apiRequest(
      "GET",
      `/api/projects/${params.projectId}/use-case/${params.useCaseId}/export?format=json`
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(arch?.useCaseName || "use-case").replace(/[^a-zA-Z0-9]/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [params, arch]);

  const handlePdfExport = useCallback(() => {
    setExportOpen(false);
    window.open(`${basePath}/print`, "_blank");
  }, [basePath]);

  const handleShare = useCallback(async () => {
    setExportOpen(false);
    try {
      const res = await apiRequest(
        "POST",
        `/api/projects/${params.projectId}/share`,
        { scope: "use_case", scopeId: params.useCaseId }
      );
      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.url}`;
      setShareUrl(fullUrl);
    } catch {
      alert("Failed to create share link");
    }
  }, [params]);

  const copyShareUrl = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [shareUrl]);

  return (
    <div className="flex flex-col h-full">
      {/* Use case header */}
      <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {arch?.useCaseName || "Use Case"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {(arch as any)?.implementationPhase
                ? `Phase ${(arch as any).implementationPhase}`
                : ""}
            </p>
          </div>

          {/* Export dropdown */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(!exportOpen)}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-popover border border-border rounded-lg shadow-lg py-1">
                  <button
                    onClick={handleJsonExport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <FileJson className="h-4 w-4 text-[#02a2fd]" />
                    Download JSON
                  </button>
                  <button
                    onClick={handlePdfExport}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Printer className="h-4 w-4 text-[#001278]" />
                    Download PDF
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={handleShare}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Share2 className="h-4 w-4 text-[#36bf78]" />
                    Share Link
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Share URL banner */}
        {shareUrl && (
          <div className="mb-3 flex items-center gap-2 bg-[#36bf78]/10 border border-[#36bf78]/30 rounded-lg px-3 py-2">
            <Link2 className="h-4 w-4 text-[#36bf78] shrink-0" />
            <span className="text-sm text-foreground truncate flex-1">{shareUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyShareUrl}
              className="shrink-0 gap-1"
            >
              {shareCopied ? (
                <><Check className="h-3 w-3" /> Copied</>
              ) : (
                <><Copy className="h-3 w-3" /> Copy</>
              )}
            </Button>
            <button
              onClick={() => setShareUrl("")}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>
        )}

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
