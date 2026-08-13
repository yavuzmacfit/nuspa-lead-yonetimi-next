import type { Metadata } from "next";
import "./globals.css";
import { AppDataProvider } from "@/lib/AppDataContext";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Olympus — NuSpa Lead Yönetimi (Prototip)",
  description: "NuSpa Lead Yönetimi prototipi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <AppDataProvider>
          <Shell>{children}</Shell>
        </AppDataProvider>
      </body>
    </html>
  );
}
