// app/api/stripe/verify-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { session_id, is_upgrade, tenant_id } = await req.json();
    
    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const backend = process.env.BACKEND_URL || "http://localhost:3000";
    
    // Pass tenant_id to the backend if it's an upgrade
    const response = await fetch(`${backend}/api/stripe/verify-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        session_id, 
        is_upgrade,
        tenant_id: is_upgrade ? tenant_id : undefined // Only send tenant_id for upgrades
      }),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (err) {
    console.error("[verify-subscription] Error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error" 
    }, { status: 500 });
  }
}