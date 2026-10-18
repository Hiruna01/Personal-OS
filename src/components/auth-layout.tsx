import Link from "next/link";
import { LockKeyhole, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/shell";
import { PageEntrance } from "@/components/motion-provider";

export function AuthLayout({
  children,
  preview = false,
  setup = false,
}: {
  children: React.ReactNode;
  preview?: boolean;
  setup?: boolean;
}) {
  return (
    <main id="main-content" className="auth-layout">
      <header className="auth-topbar">
        <Link href="/login" aria-label="Personal OS">
          <Brand />
        </Link>
        <span>
          <LockKeyhole size={13} />
          Private workspace
        </span>
      </header>
      <section className="auth-entry">
        <div className="auth-entry-content">
          <PageEntrance>
            {children}
            {setup && (
              <div className="setup-note">
                <strong>Connect your workspace</strong>
                <p>
                  Add your Supabase configuration, apply the database migration,
                  and provision your owner account. Setup instructions are in
                  README.md.
                </p>
              </div>
            )}
            {preview && (
              <Link href="/preview/education/campus" className="preview-link">
                Explore the sample workspace
                <ArrowUpRight size={15} />
              </Link>
            )}
            <p className="auth-footnote">
              <LockKeyhole size={12} />
              Owner access only. Your materials stay private.
            </p>
          </PageEntrance>
        </div>
      </section>
      <footer className="auth-bottom">
        Personal OS <span>·</span> Private Study Hub
      </footer>
    </main>
  );
}
