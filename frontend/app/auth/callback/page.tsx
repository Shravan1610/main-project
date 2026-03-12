"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/shared/lib";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    void (async () => {
      await supabase.auth.getSession();
      router.replace("/evidence-collection");
    })();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,rgba(7,10,14,1),rgba(9,13,18,0.96))] px-6 text-terminal-text">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        <p className="text-[10px] uppercase tracking-[0.24em] text-terminal-text-muted">Supabase Auth</p>
        <h1 className="mt-3 text-xl font-semibold text-white">Completing Google sign-in</h1>
        <p className="mt-2 text-sm text-terminal-text-dim">
          Finalizing your Supabase session and returning to the evidence workspace.
        </p>
      </div>
    </main>
  );
}
