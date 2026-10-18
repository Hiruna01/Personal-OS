import { requireOwner } from "@/lib/auth";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, workspace } = await requireOwner();
  const { id } = await params;
  const asset = await db
    .from("assets")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (asset.error || !asset.data)
    return new Response("Unavailable", { status: 404 });
  const object = await db.storage
    .from("thumbnails")
    .download(asset.data.object_path);
  if (object.error) return new Response("Unavailable", { status: 404 });
  return new Response(object.data, {
    headers: {
      "Content-Type": asset.data.media_type,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
