import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out from Super Admin." });
  response.cookies.delete("jewelbill_admin_session");
  return response;
}
