import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (token_hash && type === "recovery") {
    const db = await createClient();
    const { error } = await db.auth.verifyOtp({ token_hash, type: "recovery" });
    if (!error)
      return NextResponse.redirect(new URL("/auth/recovery", request.url));
  }
  return NextResponse.redirect(new URL("/login?recovery=expired", request.url));
}
