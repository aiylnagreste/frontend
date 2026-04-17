import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const backend = process.env.BACKEND_URL || "http://localhost:3000";
  const body = await req.json();
  const upstream = await fetch(`${backend}/tenant/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
