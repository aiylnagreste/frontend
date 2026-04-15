import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const backend = process.env.BACKEND_URL || "http://localhost:3000";
  const cookie = req.headers.get("cookie") || "";
  const upstream = await fetch(`${backend}/super-admin/api/subscriptions`, {
    headers: { Cookie: cookie },
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
