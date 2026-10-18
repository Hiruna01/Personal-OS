/** Explicit administrative setup only. Never import into the application. */
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;
if (!url || !secret || !email || !password || password.length < 12) {
  console.error(
    "Set the Supabase URL, admin secret, OWNER_EMAIL, and a password of at least 12 characters in .env.local.",
  );
  process.exit(1);
}
const db = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const existingWorkspace = await db
  .from("workspaces")
  .select("id,owner_user_id")
  .maybeSingle();
if (existingWorkspace.error) {
  console.error("Apply the database migrations before provisioning.");
  process.exit(1);
}
let owner = null;
for (let page = 1; page <= 100; page++) {
  const result = await db.auth.admin.listUsers({ page, perPage: 100 });
  if (result.error) {
    console.error(
      "Cannot access Auth administration. Check the project and administrative key.",
    );
    process.exit(1);
  }
  owner = result.data.users.find((u) => u.email?.toLowerCase() === email);
  if (owner || result.data.users.length < 100) break;
}
if (existingWorkspace.data) {
  if (owner?.id === existingWorkspace.data.owner_user_id) {
    console.log(
      "The owner and workspace are already provisioned. Existing passwords and data were preserved.",
    );
    process.exit(0);
  }
  console.error(
    "A workspace already belongs to a different owner. No ownership or credentials were changed.",
  );
  process.exit(1);
}
if (!owner) {
  const result = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (result.error) {
    console.error(
      "Owner creation failed. Check the Auth settings and password requirements.",
    );
    process.exit(1);
  }
  owner = result.data.user;
}
const workspace = await db.from("workspaces").insert({
  owner_user_id: owner.id,
  name: process.env.WORKSPACE_NAME || "My workspace",
  timezone: "Asia/Colombo",
});
if (workspace.error) {
  console.error(
    "The Auth user exists, but workspace creation failed. Apply migrations and rerun; the script will reuse the user.",
  );
  process.exit(1);
}
console.log(
  "Owner and private workspace provisioned. Public registration must remain disabled.",
);
