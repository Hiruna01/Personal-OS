import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
export default function NotFound() {
  return (
    <main id="main-content" className="standalone-state">
      <FolderOpen size={35} strokeWidth={1.3} />
      <h1>This page isn’t available.</h1>
      <p>It may have moved, or you may not have access.</p>
      <Link
        href="/app"
        data-slot="button"
        className={buttonVariants({ variant: "outline" })}
      >
        Back to your workspace
      </Link>
    </main>
  );
}
