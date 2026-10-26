import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient, isConfigured } from "./supabase/server";
import { measureServer } from "./performance";
export const requireOwner = cache(async () => {
  if (!isConfigured()) redirect("/login?setup=1");
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await measureServer("auth.user", () => db.auth.getUser());
  if (error || !user) redirect("/login");
  const { data: workspace, error: workspaceError } = await measureServer(
    "auth.workspace",
    () =>
      db
        .from("workspaces")
        .select("*")
        .eq("owner_user_id", user.id)
        .maybeSingle(),
  );
  if (workspaceError)
    throw new Error(
      "Your workspace could not be loaded. Check the database connection and migrations.",
    );
  if (!workspace) redirect("/login?access=denied");
  return { db, user, workspace };
});
