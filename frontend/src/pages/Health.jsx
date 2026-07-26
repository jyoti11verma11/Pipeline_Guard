import { useEffect, useState } from "react";
import { getHealthSummary } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Activity, AlertTriangle, ListChecks, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell,
} from "recharts";

export default function HealthPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getHealthSummary().then(setSummary);
  }, []);

  if (!summary) {
    return <div className="p-8 text-muted-foreground">Loading dashboard…</div>;
  }

  const scoreColor =
    summary.hygiene_score >= 75
      ? "text-emerald-400"
      : summary.hygiene_score >= 50
      ? "text-amber-400"
      : "text-rose-400";

  return (
    <div className="p-8 bg-grid min-h-full" data-testid="health-page">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Team Dashboard
        </div>
        <h1 className="font-display text-4xl font-bold">Pipeline Health</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          A single score for how up-to-date your CRM data really is. Reforecasting only
          works if this stays green.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <StatCard
          testId="stat-hygiene"
          icon={Activity}
          label="Pipeline hygiene score"
          value={`${summary.hygiene_score}%`}
          valueClassName={`font-mono ${scoreColor}`}
          hint={`${summary.active_deals} active deals`}
          accent="primary"
        />
        <StatCard
          testId="stat-stale"
          icon={AlertTriangle}
          label="Stale deals (>14d)"
          value={summary.stale_count}
          valueClassName="font-mono text-rose-400"
          hint="No update in over two weeks"
          accent="danger"
        />
        <StatCard
          testId="stat-missing-next"
          icon={ListChecks}
          label="Missing next step"
          value={summary.missing_next_step_count}
          valueClassName="font-mono text-amber-400"
          hint="Active deals with no follow-up"
          accent="warning"
        />
      </div>

      <Card className="p-6 border-border" data-testid="rep-leaderboard-chart">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Leaderboard
            </div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2">
              Hygiene score by rep
              <TrendingUp className="w-5 h-5 text-primary" />
            </h2>
          </div>
          <div className="text-xs text-muted-foreground">Best rep first</div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.rep_hygiene} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="rep_name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
                formatter={(v) => [`${v}%`, "Hygiene"]}
              />
              <Bar dataKey="hygiene_score" radius={[6, 6, 0, 0]}>
                {summary.rep_hygiene.map((r, i) => (
                  <Cell
                    key={i}
                    fill={
                      r.hygiene_score >= 75
                        ? "hsl(142.1 70% 45%)"
                        : r.hygiene_score >= 50
                        ? "hsl(37.7 90% 55%)"
                        : "hsl(346.8 77.2% 55%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          {summary.rep_hygiene.map((r, i) => (
            <div
              key={r.rep_id}
              data-testid={`rep-row-${r.rep_id}`}
              className="flex items-center gap-3 p-3 rounded-md border border-border bg-card/50"
            >
              <div className="text-xs font-mono text-muted-foreground w-4">
                {i + 1}
              </div>
              <Avatar className="w-9 h-9">
                <AvatarImage src={r.avatar_url} alt={r.rep_name} />
                <AvatarFallback>{r.rep_name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{r.rep_name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.deal_count} active
                </div>
              </div>
              <div className={`font-mono font-bold text-lg ${
                r.hygiene_score >= 75 ? "text-emerald-400" :
                r.hygiene_score >= 50 ? "text-amber-400" : "text-rose-400"
              }`}>
                {r.hygiene_score}%
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ testId, icon: Icon, label, value, valueClassName, hint, accent }) {
  const accentBorder = {
    primary: "border-primary/40",
    danger: "border-rose-500/40",
    warning: "border-amber-500/40",
  }[accent];
  const accentBg = {
    primary: "bg-primary/10 text-primary",
    danger: "bg-rose-500/10 text-rose-400",
    warning: "bg-amber-500/10 text-amber-400",
  }[accent];

  return (
    <Card
      data-testid={testId}
      className={`p-6 border ${accentBorder} bg-card hover:-translate-y-0.5 transition-transform duration-200`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            {label}
          </div>
          <div className={`text-4xl font-bold mt-3 font-display ${valueClassName}`}>{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${accentBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-4">{hint}</div>
    </Card>
  );
}
