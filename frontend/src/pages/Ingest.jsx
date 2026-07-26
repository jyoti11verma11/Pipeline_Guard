import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { extractText, confirmUpdate, getDeals } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, CheckCircle2, X, Loader2, Users } from "lucide-react";
import { STAGE_ORDER, SENTIMENT_META } from "@/lib/freshness";
import { toast } from "sonner";

const SAMPLE = `Just wrapped a call with Diana Cross, the CFO at Globex Industries. She was excited about our platform and confirmed they want to move forward with pricing discussion this quarter. Her team is impressed with the ROI numbers. Next step is to send the redlined contract by end of week and finalize terms with their VP of Legal.`;

export default function IngestPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [dealId, setDealId] = useState("");
  const [stage, setStage] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [sentiment, setSentiment] = useState("neutral");
  const [stakeholdersText, setStakeholdersText] = useState("");
  const [deals, setDeals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getDeals().then(setDeals);
  }, []);

  async function handleAnalyze() {
    if (!text.trim()) {
      toast.error("Paste a call transcript or email first");
      return;
    }
    setLoading(true);
    try {
      const s = await extractText(text);
      setSuggestion(s);
      setStage(s.suggested_stage || "");
      setNextStep(s.suggested_next_step || "");
      setSentiment(s.suggested_sentiment || "neutral");
      setStakeholdersText((s.suggested_stakeholders || []).join(", "));
      setDealId(s.matched_deal_id || "");
      if (s.matched_deal_id) {
        toast.success("Matched an existing deal");
      } else {
        toast.info("No deal matched — pick one to attach the update");
      }
    } catch (e) {
      toast.error("Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!dealId) {
      toast.error("Select which deal this update belongs to");
      return;
    }
    if (!stage) {
      toast.error("Set a deal stage");
      return;
    }
    setConfirming(true);
    try {
      await confirmUpdate(dealId, {
        deal_id: dealId,
        raw_text: text,
        stage,
        next_step: nextStep || null,
        sentiment,
        stakeholders: stakeholdersText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success("CRM updated");
      navigate(`/deals/${dealId}`);
    } catch (e) {
      toast.error("Update failed");
    } finally {
      setConfirming(false);
    }
  }

  function clearAll() {
    setSuggestion(null);
    setStage("");
    setNextStep("");
    setSentiment("neutral");
    setStakeholdersText("");
    setDealId("");
  }

  return (
    <div className="p-8" data-testid="ingest-page">
      <header className="mb-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          AI Ingest
        </div>
        <h1 className="font-display text-4xl font-bold flex items-center gap-3">
          Log a call in five seconds
          <Sparkles className="w-7 h-7 text-primary" />
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Paste a call transcript, email, or meeting note. We suggest which CRM fields to
          update — you review and confirm in one click.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Textarea */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold">Raw transcript / email</label>
            <button
              data-testid="load-sample-btn"
              className="text-xs text-primary hover:underline"
              onClick={() => setText(SAMPLE)}
              type="button"
            >
              Load sample
            </button>
          </div>
          <Textarea
            data-testid="transcript-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the call transcript, email thread, or your meeting notes here..."
            className="min-h-[420px] bg-card border-border font-mono text-sm resize-none focus-visible:ring-primary focus-visible:ring-offset-0"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground font-mono">
              {text.length} chars
            </span>
            <Button
              data-testid="analyze-btn"
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="bg-primary hover:bg-primary/90 rounded-md"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT: AI Suggestion Card */}
        <div>
          {!suggestion ? (
            <Card className="border-dashed border-2 border-border bg-transparent min-h-[420px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div className="font-display font-semibold text-lg mb-1">
                Suggestions appear here
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                We'll extract the deal stage, next step, sentiment, and stakeholders from
                the text you paste — editable before saving.
              </p>
            </Card>
          ) : (
            <Card className="ai-glow p-6" data-testid="suggestion-card">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                    AI Suggestion
                  </span>
                </div>
                <button
                  data-testid="clear-suggestion-btn"
                  onClick={clearAll}
                  className="text-muted-foreground hover:text-foreground"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Field label="Related deal">
                <Select value={dealId} onValueChange={setDealId}>
                  <SelectTrigger data-testid="deal-select" className="bg-card border-border">
                    <SelectValue placeholder="Select an existing deal…" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.company} · ${d.value.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {suggestion.matched_deal_id && (
                  <div className="text-[11px] text-emerald-300 mt-1.5">
                    ✓ Auto-matched from transcript
                  </div>
                )}
              </Field>

              <Field label="Suggested stage">
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger data-testid="stage-select" className="bg-card border-border">
                    <SelectValue placeholder="Pick a stage…" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Next step">
                <Input
                  data-testid="next-step-input"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  placeholder="e.g., Send redlined contract by Friday"
                  className="bg-card border-border"
                />
              </Field>

              <Field label="Sentiment">
                <div className="flex gap-2" data-testid="sentiment-group">
                  {["positive", "neutral", "negative"].map((s) => {
                    const meta = SENTIMENT_META[s];
                    const active = sentiment === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        data-testid={`sentiment-${s}`}
                        onClick={() => setSentiment(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-[background-color,border-color] duration-150 ${
                          active ? meta.cls : "bg-card border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Stakeholders">
                <div className="relative">
                  <Users className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    data-testid="stakeholders-input"
                    value={stakeholdersText}
                    onChange={(e) => setStakeholdersText(e.target.value)}
                    placeholder="Comma-separated names"
                    className="bg-card border-border pl-8"
                  />
                </div>
                {stakeholdersText && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {stakeholdersText.split(",").map((s) => s.trim()).filter(Boolean).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary-foreground">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>

              <Button
                data-testid="confirm-btn"
                onClick={handleConfirm}
                disabled={confirming}
                className="w-full mt-3 bg-primary hover:bg-primary/90"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm & Update CRM
                  </>
                )}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}
