import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.BACKEND_URL || "http://localhost:3000";
  const res = await fetch(`${backend}/api/public/plans`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
