"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initializedMode: "screen" | "print" | null = null;

function initMermaid(printMode: boolean) {
  const targetMode = printMode ? "print" : "screen";
  if (initializedMode === targetMode) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    fontFamily: "DM Sans, sans-serif",
    themeVariables: {
      fontFamily: "DM Sans, sans-serif",
      primaryTextColor: "#0a0e27",
      lineColor: "#475569",
    },
    flowchart: {
      htmlLabels: true,
      useMaxWidth: !printMode,
      wrappingWidth: printMode ? 220 : undefined,
      curve: "basis",
      padding: printMode ? 12 : 8,
    },
    securityLevel: "loose",
  });
  initializedMode = targetMode;
}

interface MermaidDiagramProps {
  code: string;
  id: string;
  className?: string;
  /**
   * When true, configures Mermaid for fixed-width SVG output suitable for print.
   * Also enrolls the render Promise in window.__mermaidPending so a parent
   * print page can await Promise.all() before triggering window.print().
   */
  printMode?: boolean;
}

export function MermaidDiagram({
  code,
  id,
  className,
  printMode = false,
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    initMermaid(printMode);

    const renderPromise = (async () => {
      try {
        const elementId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(elementId, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        setError(e.message || "Failed to render diagram");
      }
    })();

    if (printMode && typeof window !== "undefined") {
      const w = window as any;
      w.__mermaidPending = w.__mermaidPending || [];
      w.__mermaidPending.push(renderPromise);
    }
  }, [code, id, printMode]);

  if (error) {
    return (
      <div className={className}>
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-64 text-gray-600 dark:text-gray-400">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`mermaid-diagram [&_svg]:max-w-full [&_svg]:h-auto ${className || ""}`}
    />
  );
}
