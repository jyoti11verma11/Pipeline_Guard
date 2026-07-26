import { freshnessLevel, freshnessLabel } from "@/lib/freshness";
import { cn } from "@/lib/utils";

const CLS = {
  green: "bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.4)]",
  yellow: "bg-amber-500 shadow-[0_0_10px_2px_rgba(245,158,11,0.4)]",
  red: "bg-rose-500 shadow-[0_0_10px_2px_rgba(244,63,94,0.5)] animate-pulse",
};

export default function FreshnessDot({ lastUpdated, withLabel = false, testId }) {
  const level = freshnessLevel(lastUpdated);
  return (
    <div className="inline-flex items-center gap-2" data-testid={testId}>
      <span
        className={cn("inline-block w-2.5 h-2.5 rounded-full", CLS[level])}
        aria-label={`freshness-${level}`}
      />
      {withLabel && (
        <span className="text-xs text-muted-foreground">
          {freshnessLabel(lastUpdated)}
        </span>
      )}
    </div>
  );
}
