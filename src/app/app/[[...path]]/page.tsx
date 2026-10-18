import { loadContext } from "@/lib/data";
import { WorkspaceContent } from "@/features/campus/pages";
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const data = await loadContext(path);
  return <WorkspaceContent data={data} path={path} />;
}
