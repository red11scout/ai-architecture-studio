# AI Architecture Studio (AI Solution Builder)

## Overview
BlueAlly AI Solution Builder — ingests JSON exports from aiworkflow (`flow.gofasterwithai.com`) and auto-generates per-use-case architecture diagrams, agent workflows, data pipelines, governance models, ROI dashboards, PRDs, and implementation roadmaps.

**URL**: `builder.gofasterwithai.com` (Vercel: `ai-architecture-studio.vercel.app`)
**Repo**: `red11scout/ai-architecture-studio`

## Tech Stack
- **Framework**: Next.js 16 App Router, React 19, TypeScript strict
- **Styling**: Tailwind v4 + shadcn/ui
- **Diagrams**: React Flow (@xyflow/react) + Dagre auto-layout
- **Calculations**: HyperFormula (deterministic — zero AI)
- **Charts**: Recharts
- **Database**: Drizzle ORM + Neon PostgreSQL (`sparkling-credit-40735360`, aws-us-east-2)
- **AI**: Anthropic Claude SDK (Sonnet) — PRD generation ONLY
- **Export**: ExcelJS (6-sheet branded workbook)
- **Deploy**: Vercel + GitHub Actions

## Brand
- Navy `#001278`, Blue `#02a2fd`, Green `#36bf78`
- Font: DM Sans
- NEVER use oklch() colors

## Architecture

### Database (5 tables)
- `projects` — ownerToken-scoped, stores rawImport JSONB
- `architectures` — one row per use case, 5 JSONB columns for diagram layers + financials + canvas + PRD
- `share_links` — public read-only report access (30-day expiry)
- `ai_conversations` — Claude PRD chat history
- `export_jobs` — async export tracking

### 5-Layer Diagram System
Each layer has a dedicated engine in `src/lib/diagrams/`:
1. **Business Value Map** — `business-value-engine.ts` — LR DAG (Theme → Friction → UseCase → KPIs → Financial)
2. **System Architecture** — `system-architecture-engine.ts` — TB DAG (User → Gateway → Orchestrator → Agents → Tools → Systems)
3. **Agentic Workflow** — `agentic-workflow-engine.ts` — 10 pattern-specific topologies
4. **Data Architecture** — `data-architecture-engine.ts` — LR pipeline (Sources → ETL → Storage → AI → Output)
5. **Governance & Safety** — `governance-engine.ts` — LR with observability sidebar

### Custom React Flow Nodes
8 node types in `src/components/diagrams/nodes/`: theme, use-case, agent, tool, gateway, hitl, financial, default

### Diagram Renderer
`src/components/diagrams/diagram-renderer.tsx` — shared renderer with 30+ node type mappings. Uses `useMemo` + `setNodes`/`setEdges` sync to update on prop changes (critical for layer switching).

## Key Patterns
- **Owner Token**: Anonymous `x-owner-token` header, stored in localStorage as `ai-solution-builder-token`
- **API Client**: `apiRequest(method, url, data?, timeoutMs?)` — method is FIRST param
- **JSONB columns**: All diagram data stored as JSONB, typed as `any` in frontend interfaces
- **UseCaseIds**: Case-sensitive (e.g., `UC-01` not `uc-01`) — match exactly from import data
- **All calculations are deterministic** — HyperFormula engine, zero AI involvement
- **Claude AI is PRD-only** — single endpoint `POST /api/projects/:projectId/ai/prd`

## Page Structure (22 routes)
```
app/
  page.tsx                              # Home — project list + JSON upload
  project/[projectId]/
    layout.tsx                          # Sidebar + ProjectContext provider
    page.tsx                            # Overview (summary cards + use case table)
    canvas/page.tsx                     # 9-section 3x3 grid
    use-case/[useCaseId]/
      layout.tsx                        # 7-tab navigation
      architecture/page.tsx             # 5-layer viewer with switcher
      workflow/page.tsx                 # Agentic workflow diagram
      data/page.tsx                     # Data pipeline diagram
      governance/page.tsx               # Governance + HITL diagram
      financial/page.tsx                # ROI dashboard (Recharts)
      prd/page.tsx                      # Claude PRD generator
      roadmap/page.tsx                  # 4-phase implementation timeline
    portfolio/
      dashboard/page.tsx                # Executive dashboard
      matrix/page.tsx                   # Priority matrix (2x2 scatter)
      timeline/page.tsx                 # Gantt-like phased timeline
      heatmap/page.tsx                  # System integration heat map
  shared/[code]/page.tsx                # Public shared report (SSR)
  api/projects/...                      # REST API
```

## Shared Libraries (ported from aiworkflow)
- `src/lib/engines/formulas.ts` (593 lines) — benefit, readiness, priority, NPV, IRR calculations
- `src/lib/engines/hyperformula-engine.ts` (818 lines) — HyperFormula wrapper classes
- `src/lib/engines/patterns.ts` (367 lines) — 10 agentic pattern definitions
- `src/lib/types.ts` (335 lines) — full TypeScript interfaces

## Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npx vercel --prod    # Deploy to production
npx drizzle-kit push # Push schema to Neon
```

## Known Issues / Gotchas
- Recharts Tooltip `formatter` param: use untyped `(v) =>` not `(v: number) =>`
- JSONB fields return `unknown` type — wrap in `String()` or use `!= null` checks
- React Flow `useNodesState`/`useEdgesState` don't auto-update from props — must manually sync with `setNodes`/`setEdges` in a `useMemo`
- Vercel env: only production env vars are set (no preview branch configured)
