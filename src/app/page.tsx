"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Plus, Trash2, Building2, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ProjectSummary {
  id: string;
  name: string;
  companyName: string;
  industry: string;
  status: string;
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await apiRequest("GET", "/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const text = await file.text();
        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error("Invalid JSON file. Upload a valid workflow export.");
        }
        const res = await apiRequest("POST", "/api/projects", { rawImport: json }, 60000);
        const data = await res.json();
        router.push(`/project/${data.project.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".json")) {
        handleFile(file);
      } else {
        setError("Please drop a .json file");
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const deleteProject = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await apiRequest("DELETE", `/api/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete project");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/blueally-logo-blue.png"
              alt="BlueAlly"
              width={120}
              height={38}
              className="dark:hidden"
              priority
            />
            <Image
              src="/blueally-logo-white.png"
              alt="BlueAlly"
              width={120}
              height={38}
              className="hidden dark:block"
              priority
            />
            <div className="h-6 w-px bg-border mx-1" />
            <span className="text-sm font-semibold text-foreground">AI Solution Builder</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Build AI Architecture. Automatically.
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Import your workflow export from flow.gofasterwithai.com. The system generates
            architecture diagrams, agent workflows, data pipelines, governance models, and
            financial impact for every use case.
          </p>
        </div>

        {/* Upload zone */}
        <Card className="mb-10">
          <CardContent className="p-0">
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors",
                dragActive
                  ? "border-[#02a2fd] bg-[#02a2fd]/5"
                  : "border-border hover:border-[#02a2fd]/50",
                uploading && "opacity-60 pointer-events-none"
              )}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">
                {uploading ? "Processing..." : "Drop your workflow export here"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                JSON file from flow.gofasterwithai.com
              </p>
              <label>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileInput}
                  disabled={uploading}
                />
                <Button variant="outline" asChild>
                  <span className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {/* Projects list */}
        <h3 className="text-xl font-bold text-foreground mb-4">Your Projects</h3>
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No projects yet. Upload a workflow export to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-[#02a2fd]/50 transition-colors group"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#001278]/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[#001278]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.companyName} &middot; {project.industry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => deleteProject(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
