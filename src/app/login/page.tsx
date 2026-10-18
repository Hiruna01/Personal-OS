import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { isConfigured } from "@/lib/supabase/server";
import { demoEnabled } from "@/lib/fixtures";
export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const notice =
    query.access === "denied"
      ? "This account has no workspace access. Sign in with the provisioned owner account."
      : query.recovery === "expired"
        ? "This recovery link is unavailable or expired. Request a new one."
        : undefined;
  return (
    <AuthLayout preview={demoEnabled()} setup={!isConfigured()}>
      <AuthForm notice={notice} />
    </AuthLayout>
  );
}
