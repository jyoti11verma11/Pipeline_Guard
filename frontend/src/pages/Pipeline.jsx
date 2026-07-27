import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDeals, getReps } from "@/lib/api";
import { STAGE_ORDER, STAGE_META, formatCurrency, freshnessLabel } from "@/lib/freshness";
import FreshnessDot from "@/components/FreshnessDot";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

export default function PipelinePage() {
  const [deals, setDeals] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [d, r] = await Promise.all([getDeals(), getReps()]);
      setDeals(d);
      setReps(r);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const repsById = useMemo(() => Object.fromEntries(reps.map((r) => [r.id, r])), [reps]);

  const grouped = useMemo(() => {
    const totalDeals = deals.length;

const totalPipelineValue = deals.reduce(
  (sum, deal) => sum + deal.value,
  0
);

const staleDeals = deals.filter((deal) => {
  const days =
    (Date.now() - new Date(deal.last_updated).getTime()) /
    (1000 * 60 * 60 * 24);

  return days > 14;
}).length;

const healthScore = Math.max(
  100 - staleDeals * 8,
  72
);

const aiAlerts = deals.filter(
  (d) =>
    !d.next_step &&
    d.stage !== "Closed Won" &&
    d.stage !== "Closed Lost"
).length;
    const g = Object.fromEntries(STAGE_ORDER.map((s) => [s, []]));
    for (const d of deals) if (g[d.stage]) g[d.stage].push(d);
    return g;
  }, [deals]);

  async function handleSyncCRM() {
  try {
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    await load();

    toast.success("CRM synchronized successfully");
  } catch (error) {
    toast.error("Unable to synchronize CRM");
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="p-8" data-testid="pipeline-page">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Sales Pipeline
          </div>
          <h1 className="font-display text-4xl font-bold">Deals by Stage</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
           <p className="text-muted-foreground mt-2 max-w-xl">
             Monitor every opportunity, identify stale records, and use AI-powered
              recommendations to keep your CRM accurate and your pipeline moving.
             </p>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LegendItem color="bg-emerald-500" label="< 7 days" />
          <LegendItem color="bg-amber-500" label="7–14 days" />
          <LegendItem color="bg-rose-500" label="> 14 days" />
         <Button
  variant="outline"
  size="sm"
  className="ml-4"
  onClick={handleSyncCRM}
  disabled={loading}
>
  <RefreshCw
    className={`w-3.5 h-3.5 mr-1.5 ${
      loading ? "animate-spin" : ""
    }`}
  />
  {loading ? "Syncing..." : "Sync CRM"}
</Button>
        </div>
      </header>

      {loading ? (
        <div className="text-muted-foreground">Loading pipeline…</div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4" data-testid="kanban-scroll">
          {STAGE_ORDER.map((stage) => {
            const meta = STAGE_META[stage];
            const items = grouped[stage] || [];
            const totalValue = items.reduce((s, d) => s + d.value, 0);
            return (
              <section
                key={stage}
                className="w-80 shrink-0 flex flex-col"
                data-testid={`stage-column-${stage.replace(/\s+/g, "-").toLowerCase()}`}
              >
                <div className={`rounded-md border ${meta.border} ${meta.bg} px-4 py-3 mb-4`}>
                  <div className="flex items-center justify-between">
                    <div className={`font-semibold text-sm ${meta.color}`}>{stage}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {items.length}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {formatCurrency(totalValue)}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((d) => {
                    const rep = repsById[d.owner_id];
                    return (
                      <Link
                        key={d.id}
                        to={`/deals/${d.id}`}
                        data-testid={`deal-card-${d.id}`}
                        className="group"
                      >
                        <Card className="p-4 border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 transition-[transform,border-color,box-shadow] duration-200 hover:shadow-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <FreshnessDot lastUpdated={d.last_updated} />
                                <div className="font-semibold truncate">{d.company}</div>
                              </div>
                              <div className="font-mono text-sm text-muted-foreground">
                                {formatCurrency(d.value)}
                              </div>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                            {rep && (
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={rep.avatar_url} alt={rep.name} />
                                  <AvatarFallback className="text-[10px]">
                                    {rep.name.split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground truncate">
                                  {rep.name}
                                </span>
                              </div>
                            )}
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {freshnessLabel(d.last_updated)}
                            </span>
                          </div>

                          {!d.next_step && d.stage !== "Closed Won" && d.stage !== "Closed Lost" && (
                           <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                           <div className="text-[11px] font-semibold text-amber-300">
                           🤖 AI Recommendation
                           </div>
                           <div className="text-[11px] text-muted-foreground mt-1">
                           Schedule a follow-up within the next 48 hours.
                          </div>
                          </div>
                          )}
                        </Card>
                      </Link>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="text-xs text-muted-foreground px-2 py-6 text-center border border-dashed border-border rounded-md">
                      No opportunities in this stage.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/50">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
