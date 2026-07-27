import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  ShieldCheck,
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/pipeline";

  if (user && user !== false && user !== null) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back");
      } else {
        await signup(email, password, name || email.split("@")[0]);
        toast.success("Account created");
      }

      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        formatApiErrorDetail(err.response?.data?.detail) || err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-background"
      data-testid="login-page"
    >
      {/* LEFT */}
      <div className="lg:col-span-2 relative border-r border-border overflow-hidden hidden lg:flex flex-col justify-between p-12 bg-card/40">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>

          <div>
            <div className="font-display font-bold text-2xl leading-none">
              PipelineGuard
            </div>

            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">
              CRM Hygiene · AI
            </div>
          </div>
        </div>

        <div className="relative">
          <h1 className="font-display text-5xl font-bold leading-[1.05] mb-4">
            Stop typing.
            <br />
            <span className="text-primary">Start closing.</span>
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed max-w-md">
            Paste a call transcript or email. PipelineGuard suggests every CRM
            field update you need — you approve in one click and your pipeline
            stays clean.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat value="12" label="Sample deals" />
            <Stat value="5" label="Pipeline stages" />
            <Stat value="0" label="Manual entry" />
          </div>
        </div>

        <div className="relative text-[11px] text-muted-foreground font-mono">
          © {new Date().getFullYear()} PipelineGuard
        </div>
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-3 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md p-8 border-border bg-card">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {mode === "login" ? "Sign in" : "Create account"}
            </div>

            <h2 className="font-display text-3xl font-bold">
              {mode === "login" ? "Welcome back" : "Get started"}
            </h2>

            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login"
                ? "Sign in to keep your pipeline data clean."
                : "Create an account to try PipelineGuard."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Full name" icon={UserRound}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-card border-border pl-9"
                />
              </Field>
            )}

            <Field label="Email" icon={Mail}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="bg-card border-border pl-9"
              />
            </Field>

            <Field label="Password" icon={Lock}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-card border-border pl-9"
              />
            </Field>

            {error && (
              <div className="text-sm text-rose-300 border border-rose-500/30 bg-rose-500/10 px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 h-11 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "login"
                    ? "Signing in..."
                    : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1.5 font-semibold">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        )}
        {children}
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-3 py-3">
      <div className="font-display font-bold text-2xl">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}
