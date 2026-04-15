import { NextRequest, NextResponse } from "next/server";

const BACKEND = () => process.env.BACKEND_URL || "http://localhost:3000";

async function forwardWithCookies(req: NextRequest, path: string, method: string, body?: unknown) {
  const cookie = req.headers.get("cookie") || "";
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const upstream = await fetch(`${BACKEND()}${path}`, init);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function GET(req: NextRequest) {
  return forwardWithCookies(req, "/super-admin/api/plans", "GET");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return forwardWithCookies(req, "/super-admin/api/plans", "POST", body);
}
