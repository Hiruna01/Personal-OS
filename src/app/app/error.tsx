"use client";
import { Button } from "@/components/ui/button";
import { RefreshCw, CloudOff } from "lucide-react";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="empty-state">
      <CloudOff size={28} />
      <h1>We couldn’t load your workspace.</h1>
      <p>
        Your saved materials are still there. Check your connection, then try
        again.
      </p>
      <Button onClick={reset}>
        <RefreshCw data-icon="inline-start" />
        Try again
      </Button>
    </div>
  );
}
