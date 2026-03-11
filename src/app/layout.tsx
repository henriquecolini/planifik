import type { Metadata } from "next";
import { SessionProvider } from "@/components/SessionProvider";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planifik",
  description: "Controle suas finanças pessoais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans bg-base text-text-primary antialiased">
        <SessionProvider session={null}>
          <I18nProvider>
            {children}
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
