"use client";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { CloudOff, RefreshCw } from "lucide-react";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main id="main-content" className="standalone-state">
      <CloudOff size={32} />
      <h1>Your workspace couldn’t connect.</h1>
      <p>Check your connection and Supabase setup, then try again.</p>
      <Button onClick={reset}>
        <RefreshCw data-icon="inline-start" />
        Try again
      </Button>
      <Link
        href="/login"
        data-slot="button"
        className={buttonVariants({ variant: "ghost" })}
      >
        Back to sign in
      </Link>
    </main>
  );
}
