"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProject } from "./layout";

/**
 * Project root page — redirects to the first use case's architecture view.
 * The Overview page was removed; use cases are the primary entry point.
 */
export default function ProjectRedirectPage() {
  const { architectures, loading } = useProject();
  const router = useRouter();
  const params = useParams<{ projectId: string }>();

  useEffect(() => {
    if (loading) return;
    if (architectures.length > 0) {
      router.replace(
        `/project/${params.projectId}/use-case/${architectures[0].useCaseId}/architecture`
      );
    }
  }, [loading, architectures, params.projectId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading use cases...</p>
    </div>
  );
}
