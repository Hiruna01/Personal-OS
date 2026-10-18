import { requireOwner } from "@/lib/auth";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { db, workspace } = await requireOwner();
  const { data: semesters } = await db
    .from("semesters")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("starts_on", { ascending: false })
    .limit(20);
  return (
    <Shell workspace={workspace} semesters={semesters ?? []}>
      {children}
    </Shell>
  );
}
