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

  if (!configured) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {authError ? (
        <p className="max-w-xs text-right text-xs text-amber-700" role="status">
          {authError}{" "}
          <button className="font-semibold underline" onClick={() => setAuthError(null)} type="button">
            Dismiss
          </button>
        </p>
      ) : null}

      {user ? (
        <button
          className="rounded-full border border-[var(--app-border)] bg-[var(--app-surface-elevated)] px-5 py-2 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)]"
          onClick={() => void signOut()}
          type="button"
        >
          Log out
        </button>
      ) : (
        <button
          className="rounded-full border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-5 py-2 text-sm font-bold text-[var(--accent-on-primary)] transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
          disabled={busy !== null}
          onClick={() => void oauth(redditP)}
          type="button"
        >
          {busy === redditP ? "Redirecting…" : "Login"}
        </button>
      )}
    </div>
  );
}
