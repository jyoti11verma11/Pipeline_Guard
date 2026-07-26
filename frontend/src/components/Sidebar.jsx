import { NavLink } from "react-router-dom";
import { ShieldCheck, Inbox, KanbanSquare, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/ingest", label: "Ingest", icon: Inbox, testid: "nav-ingest" },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare, testid: "nav-pipeline" },
  { to: "/health", label: "Health", icon: Activity, testid: "nav-health" },
];

export default function Sidebar() {
  return (
    <aside
      data-testid="app-sidebar"
      className="w-64 shrink-0 border-r border-border bg-card/50 flex flex-col h-screen sticky top-0"
    >
      <div className="px-6 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-none">
              PipelineGuard
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              CRM Hygiene · AI
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.testid}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium",
                  "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                  "transition-[background-color,color] duration-150",
                  isActive &&
                    "bg-primary/15 text-foreground border-l-2 border-primary pl-[14px]"
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{n.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold">AI Assist</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Paste any call or email — we suggest CRM updates instantly.
          </p>
        </div>
      </div>
    </aside>
  );
}
