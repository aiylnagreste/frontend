import { NextRequest, NextResponse } from "next/server";

const BACKEND = () => process.env.BACKEND_URL || "http://localhost:3000";

async function forward(req: NextRequest, path: string, method: string, body?: unknown) {
  const cookie = req.headers.get("cookie") || "";
  const init: RequestInit = { method, headers: { "Content-Type": "application/json", Cookie: cookie } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const upstream = await fetch(`${BACKEND()}${path}`, init);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return forward(req, `/super-admin/api/plans/${id}`, "PUT", body);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forward(req, `/super-admin/api/plans/${id}`, "DELETE");
}
