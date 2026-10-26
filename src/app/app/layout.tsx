import { requireOwner } from "@/lib/auth";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { workspace } = await requireOwner();
  return <Shell workspace={workspace}>{children}</Shell>;
}
