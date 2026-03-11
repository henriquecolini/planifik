"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const handleGoogle = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-border-default shadow-sm mb-4">
            <span className="text-2xl">💸</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Fintrack</h1>
          <p className="text-text-secondary mt-1 text-sm">Your personal finance companion</p>
        </div>

        <div className="bg-white border border-border-default rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-text-primary mb-1">{t("signIn")}</h2>
          <p className="text-text-secondary text-sm mb-5">{t("useGoogleAccount")}</p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-border-default text-text-primary font-medium py-2.5 px-4 rounded-xl hover:bg-elevated active:scale-[0.98] transition-all duration-100 disabled:opacity-60 shadow-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? t("signingIn") : t("continueWithGoogle")}
          </button>

          <p className="text-center text-text-muted text-xs mt-4">{t("agreeTerms")}</p>
        </div>
      </div>
    </div>
  );
}
