"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient, isConfigured } from "./supabase/server";
export async function signIn(input: { email: string; password: string }) {
  if (!isConfigured())
    return {
      error:
        "Connect Supabase first. Follow the setup instructions in README.md.",
    };
  const v = z
    .object({ email: z.email(), password: z.string().min(1) })
    .safeParse(input);
  if (!v.success) return { error: "Enter a valid email address and password." };
  const db = await createClient();
  const { error } = await db.auth.signInWithPassword(v.data);
  if (error)
    return {
      error:
        "We could not sign you in. Check your email and password and try again.",
    };
  const {
    data: { user },
  } = await db.auth.getUser();
  const workspace = await db
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user!.id)
    .maybeSingle();
  if (!workspace.data) {
    await db.auth.signOut();
    return { error: "This account is not the provisioned workspace owner." };
  }
  redirect("/app");
}
export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/login");
}
export async function recoverPassword(email: string) {
  if (!isConfigured())
    return { error: "Connect Supabase before requesting a password reset." };
  if (!z.email().safeParse(email).success)
    return { error: "Enter a valid email address." };
  const db = await createClient();
  const origin = process.env.APP_URL || "http://localhost:3000";
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/recovery`,
  });
  if (error)
    return { error: "The reset request could not be sent. Try again shortly." };
  return {
    message:
      "If this email belongs to the owner, a password reset link is on its way. Check your inbox.",
  };
}
export async function updatePassword(password: string) {
  if (!z.string().min(12).max(128).safeParse(password).success)
    return { error: "Use a password between 12 and 128 characters." };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return { error: "This recovery link has expired. Request a new one." };
  const owner = await db
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (!owner.data)
    return { error: "This account is not the provisioned workspace owner." };
  const { error } = await db.auth.updateUser({ password });
  if (error)
    return {
      error:
        "Your password could not be changed. Request a fresh recovery link and try again.",
    };
  await db.auth.signOut();
  return { message: "Password updated. Sign in with your new password." };
}
