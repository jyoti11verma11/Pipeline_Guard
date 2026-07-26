import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDeal, getDealActivities, getReps } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  formatCurrency, formatDateTime, STAGE_META, SENTIMENT_META, freshnessLabel,
} from "@/lib/freshness";
import FreshnessDot from "@/components/FreshnessDot";
import { ArrowLeft, Building2, User, Activity as ActivityIcon, MessageSquareText, Sparkles } from "lucide-react";

export default function DealDetailPage() {
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [reps, setReps] = useState([]);

  useEffect(() => {
    Promise.all([getDeal(id), getDealActivities(id), getReps()]).then(([d, a, r]) => {
      setDeal(d);
      setActivities(a);
      setReps(r);
    });
  }, [id]);

  if (!deal) return <div className="p-8 text-muted-foreground">Loading deal…</div>;

  const owner = reps.find((r) => r.id === deal.owner_id);
  const stageMeta = STAGE_META[deal.stage] || {};
  const sentMeta = SENTIMENT_META[deal.sentiment] || SENTIMENT_META.neutral;

  return (
    <div className="p-8" data-testid="deal-detail-page">
      <Link
        to="/pipeline"
        data-testid="back-to-pipeline"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to pipeline
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FreshnessDot lastUpdated={deal.last_updated} />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {freshnessLabel(deal.last_updated)}
          </span>
        </div>
        <h1 className="font-display text-5xl font-bold" data-testid="deal-company">
          {deal.company}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${stageMeta.border} ${stageMeta.bg} ${stageMeta.color}`}>
            {deal.stage}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${sentMeta.cls}`}>
            {sentMeta.label} sentiment
          </span>
          <span className="font-mono text-2xl font-bold text-foreground ml-2">
            {formatCurrency(deal.value)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Metadata */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5 border-border">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Deal info
            </div>
            <MetaRow label="Owner" value={
              owner ? (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={owner.avatar_url} alt={owner.name} />
                    <AvatarFallback>{owner.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <span>{owner.name}</span>
                </div>
              ) : "—"
            } />
            <MetaRow label="Value" value={formatCurrency(deal.value)} mono />
            <MetaRow label="Stage" value={deal.stage} />
            <MetaRow label="Last updated" value={formatDateTime(deal.last_updated)} />
            <MetaRow label="Created" value={formatDateTime(deal.created_at)} />
          </Card>

          <Card className="p-5 border-border">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Stakeholders
            </div>
            {deal.stakeholders && deal.stakeholders.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {deal.stakeholders.map((s, i) => (
                  <Badge key={i} variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No stakeholders logged</div>
            )}
          </Card>

          <Card className="p-5 border-border">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <MessageSquareText className="w-3.5 h-3.5" /> Next step
            </div>
            {deal.next_step ? (
              <div className="text-sm leading-relaxed">{deal.next_step}</div>
            ) : (
              <div className="text-sm text-rose-300">⚠ No next step defined</div>
            )}
          </Card>
        </div>

        {/* RIGHT: Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-6">
              <ActivityIcon className="w-4 h-4 text-primary" />
              <h2 className="font-display text-xl font-bold">Activity timeline</h2>
              <span className="text-xs text-muted-foreground ml-1 font-mono">
                {activities.length} events
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-md">
                No activity logged yet. Head to the Ingest page to add one.
              </div>
            ) : (
              <ol className="relative border-l border-border ml-2 space-y-6" data-testid="activity-timeline">
                {activities.map((a, i) => {
                  const sMeta = SENTIMENT_META[a.extracted_sentiment] || SENTIMENT_META.neutral;
                  return (
                    <li key={a.id} className="pl-6 relative" data-testid={`activity-${a.id}`}>
                      <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-primary border-4 border-background" />
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDateTime(a.created_at)}
                        </span>
                        {a.extracted_stage && (
                          <Badge variant="outline" className="text-[10px] border-primary/40 bg-primary/10 text-primary">
                            → {a.extracted_stage}
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] ${sMeta.cls}`}>
                          {sMeta.label}
                        </Badge>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" /> AI
                        </span>
                      </div>
                      <Card className="p-4 border-border bg-card/50">
                        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                          {a.raw_text}
                        </p>
                        {(a.extracted_next_step || (a.extracted_stakeholders && a.extracted_stakeholders.length > 0)) && (
                          <div className="mt-3 pt-3 border-t border-border grid gap-2 text-xs">
                            {a.extracted_next_step && (
                              <div>
                                <span className="text-muted-foreground mr-2">Next step:</span>
                                <span>{a.extracted_next_step}</span>
                              </div>
                            )}
                            {a.extracted_stakeholders && a.extracted_stakeholders.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-muted-foreground">Mentioned:</span>
                                {a.extracted_stakeholders.map((s, j) => (
                                  <Badge key={j} variant="outline" className="text-[10px]">{s}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
