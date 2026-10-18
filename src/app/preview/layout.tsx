import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { demoEnabled, fixtures } from "@/lib/fixtures";
export const dynamic = "force-dynamic";
export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!demoEnabled()) notFound();
  const data = fixtures();
  return (
    <Shell workspace={data.workspace} semesters={data.semesters} demo>
      {children}
    </Shell>
  );
}
