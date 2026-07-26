export function daysSince(iso) {
  if (!iso) return 999;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function freshnessLevel(iso) {
  const d = daysSince(iso);
  if (d < 7) return "green";
  if (d <= 14) return "yellow";
  return "red";
}

export function freshnessLabel(iso) {
  const d = daysSince(iso);
  if (d === 0) return "Updated today";
  if (d === 1) return "Updated yesterday";
  return `Updated ${d}d ago`;
}

export function formatCurrency(v) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v || 0);
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const STAGE_ORDER = [
  "Prospecting",
  "Qualified",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

export const STAGE_META = {
  Prospecting: { color: "text-slate-300", border: "border-slate-500/40", bg: "bg-slate-500/10" },
  Qualified: { color: "text-sky-300", border: "border-sky-500/40", bg: "bg-sky-500/10" },
  Negotiation: { color: "text-indigo-300", border: "border-indigo-500/50", bg: "bg-indigo-500/15" },
  "Closed Won": { color: "text-emerald-300", border: "border-emerald-500/40", bg: "bg-emerald-500/10" },
  "Closed Lost": { color: "text-rose-300", border: "border-rose-500/40", bg: "bg-rose-500/10" },
};

export const SENTIMENT_META = {
  positive: { label: "Positive", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  neutral: { label: "Neutral", cls: "bg-slate-500/15 text-slate-300 border-slate-500/40" },
  negative: { label: "Negative", cls: "bg-rose-500/15 text-rose-300 border-rose-500/40" },
};
