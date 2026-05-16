"use client";

import type { Provider } from "@supabase/auth-js";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { hasSupabaseBrowserEnv } from "@/lib/config";
import { createClientSupabaseClient } from "@/lib/supabase/client";

function redditProvider(): Provider {
  const id = process.env.NEXT_PUBLIC_SUPABASE_REDDIT_OAUTH_PROVIDER?.trim() ?? "custom:reddit";
  if (!id.startsWith("custom:")) {
    return `custom:${id}` as Provider;
  }
  return id as Provider;
}

export function AuthHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const configured = useMemo(() => hasSupabaseBrowserEnv(), []);

  useEffect(() => {
    if (!configured || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const err = params.get("auth_error");
    if (err) {
      params.delete("auth_error");
      const qs = params.toString();
      const nextUrl = `${pathname ?? "/"}${qs ? `?${qs}` : ""}`;
      queueMicrotask(() => {
        setAuthError(err);
        window.history.replaceState({}, "", nextUrl);
      });
    }
  }, [configured, pathname]);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let unsub: (() => void) | undefined;

    const run = async () => {
      try {
        const supabase = createClientSupabaseClient();
        const { data } = await supabase.auth.getSession();
        setSession(data.session);

        const { data: listener } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
          setSession(nextSession);
        });
        unsub = () => listener.subscription.unsubscribe();
      } catch {
        // Env flags true but client bootstrap failed.
      }
    };

    void run();
    return () => unsub?.();
  }, [configured]);

  const redditP = redditProvider();

  const oauth = async (provider: Provider) => {
    if (!configured) {
      return;
    }
    setBusy(provider);
    try {
      const supabase = createClientSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(pathname || "/")}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });
      if (error) {
        setAuthError(error.message);
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    if (!configured) {
      return;
    }
    try {
      const supabase = createClientSupabaseClient();
      await supabase.auth.signOut({ scope: "global" });
      setSession(null);
      router.refresh();
    } catch {
      setAuthError("Sign out failed");
    }
  };

  const user = session?.user;
  const label = user?.user_metadata?.full_name ?? user?.user_metadata?.name;
  const avatar =
    typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  if (!configured) {
    return (
      <p className="max-w-[14rem] text-right text-xs leading-4 text-slate-500">
        Set <span className="text-slate-400">NEXT_PUBLIC_SUPABASE_URL</span> and anon key to enable login.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {authError ? (
        <p className="max-w-xs text-right text-xs text-amber-300/90" role="status">
          {authError}{" "}
          <button className="underline" onClick={() => setAuthError(null)} type="button">
            Dismiss
          </button>
        </p>
      ) : null}

      {user ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 pr-2">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- external OAuth avatar URL
              <img alt="" className="h-8 w-8 rounded-full" height={32} src={avatar} width={32} />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/20 text-xs font-semibold text-cyan-100">
                {(user.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 text-right">
              <p className="truncate text-sm font-medium text-white">{label || (user.email ?? "Account")}</p>
              {label && user.email ? <p className="truncate text-xs text-slate-400">{user.email}</p> : null}
            </div>
          </div>
          <button
            className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white transition hover:border-cyan-300/30 hover:text-cyan-200"
            onClick={() => void signOut()}
            type="button"
          >
            Log out
          </button>
        </div>
      ) : (
        <details className="group relative">
          <summary className="cursor-pointer list-none rounded-full border border-cyan-400/30 bg-cyan-400/15 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/25 [&::-webkit-details-marker]:hidden">
            Login
          </summary>
          <div className="absolute right-0 z-30 mt-2 min-w-[12rem] rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-xl">
            <p className="px-2 py-1.5 text-xs text-slate-400">Continue with</p>
            <button
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => void oauth("google")}
              type="button"
            >
              {busy === "google" ? "Redirecting…" : "Google"}
            </button>
            <button
              className="w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
              disabled={busy !== null}
              onClick={() => void oauth(redditP)}
              type="button"
            >
              {busy === redditP ? "Redirecting…" : "Reddit"}
            </button>
          </div>
        </details>
      )}
    </div>
  );
}
