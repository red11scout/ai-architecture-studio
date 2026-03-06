"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function UseCaseRedirect() {
  const params = useParams<{ projectId: string; useCaseId: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(
      `/project/${params.projectId}/use-case/${params.useCaseId}/architecture`
    );
  }, [params.projectId, params.useCaseId, router]);

  return null;
}
