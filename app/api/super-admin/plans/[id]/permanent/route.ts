import { NextRequest, NextResponse } from "next/server";

const BACKEND = () => process.env.BACKEND_URL || "http://localhost:3000";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookie = req.headers.get("cookie") || "";
  const upstream = await fetch(`${BACKEND()}/super-admin/api/plans/${id}/permanent`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Cookie: cookie },
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
