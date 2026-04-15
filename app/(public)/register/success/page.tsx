"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Payment successful!</h1>
        <p className="text-slate-500 text-sm mb-6">
          Your account is being set up. You&apos;ll receive a welcome email with your login credentials shortly.
        </p>
        <a
          href="/login"
          className="inline-block px-6 py-2.5 text-sm rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
