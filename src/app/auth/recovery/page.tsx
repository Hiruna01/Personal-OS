import { AuthLayout } from "@/components/auth-layout";
import { AuthForm } from "@/components/auth-form";
export const dynamic = "force-dynamic";
export default function Recovery() {
  return (
    <AuthLayout>
      <AuthForm recovery />
    </AuthLayout>
  );
}
