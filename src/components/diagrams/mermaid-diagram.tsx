"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;

function initMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    fontFamily: "DM Sans, sans-serif",
    flowchart: {
      htmlLabels: true,
      useMaxWidth: true,
      curve: "basis",
    },
    securityLevel: "loose",
  });
  initialized = true;
}

interface MermaidDiagramProps {
  code: string;
  id: string;
  className?: string;
}

export function MermaidDiagram({ code, id, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !containerRef.current) return;

    initMermaid();

    const render = async () => {
      try {
        // Use a unique element ID to avoid collisions
        const elementId = `mermaid-${id}-${Date.now()}`;
        const { svg } = await mermaid.render(elementId, code);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        setError(e.message || "Failed to render diagram");
      }
    };

    render();
  }, [code, id]);

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
