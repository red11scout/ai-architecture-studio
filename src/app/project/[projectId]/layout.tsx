"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Box, ArrowLeft, ChevronDown, Building2
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Architecture {
  id: string;
  useCaseId: string;
  useCaseName: string;
  implementationPhase: string | null;
  estimatedWeeks: number | null;
  financialImpact: any;
  dataArchitecture: any;
  systemArchitecture: any;
  agenticWorkflow: any;
  businessValueMap: any;
  governanceModel: any;
  canvasData: any;
  prdContent: any;
  maturityLevel: number;
}

interface Project {
  id: string;
  name: string;
  companyName: string;
  industry: string;
  description: string;
  status: string;
  rawImport: any;
}

interface ProjectContextValue {
  project: Project | null;
  architectures: Architecture[];
  loading: boolean;
  refetch: () => void;
}

const ProjectContext = createContext<ProjectContextValue>({
  project: null,
  architectures: [],
  loading: true,
  refetch: () => {},
});

export function useProject() {
  return useContext(ProjectContext);
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);
  const [architectures, setArchitectures] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [useCasesExpanded, setUseCasesExpanded] = useState(true);

  const fetchProject = async () => {
    try {
      const res = await apiRequest("GET", `/api/projects/${params.projectId}`);
      const data = await res.json();
      setProject(data.project);
      setArchitectures(data.architectures);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [params.projectId]);

  const basePath = `/project/${params.projectId}`;
  const isUseCaseActive = (useCaseId: string) =>
    pathname.includes(`/use-case/${useCaseId}`);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    );
  }

  return (
    <ProjectContext.Provider
      value={{ project, architectures, loading, refetch: fetchProject }}
    >
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b border-border">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">All Projects</span>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#001278] flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-foreground truncate">
                  {project?.companyName}
                </p>
                <p className="text-xs text-muted-foreground">{project?.industry}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {/* Use Cases section */}
            <div className="pt-3">
              <button
                onClick={() => setUseCasesExpanded(!useCasesExpanded)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    !useCasesExpanded && "-rotate-90"
                  )}
                />
                Use Cases ({architectures.length})
              </button>
              {useCasesExpanded && (
                <div className="space-y-0.5">
                  {architectures.map((arch) => (
                    <button
                      key={arch.id}
                      onClick={() =>
                        router.push(
                          `${basePath}/use-case/${arch.useCaseId}/architecture`
                        )
                      }
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors text-left",
                        isUseCaseActive(arch.useCaseId)
                          ? "bg-[#02a2fd]/10 text-[#02a2fd] font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Box className="h-3 w-3 shrink-0" />
                      <span className="truncate text-xs">{arch.useCaseName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <Image
              src="/blueally-logo-blue.png"
              alt="BlueAlly"
              width={80}
              height={25}
              className="dark:hidden"
            />
            <Image
              src="/blueally-logo-white.png"
              alt="BlueAlly"
              width={80}
              height={25}
              className="hidden dark:block"
            />
            <ThemeToggle />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ProjectContext.Provider>
  );
}
