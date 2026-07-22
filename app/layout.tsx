import "./globals.css";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";

export const metadata = {
  title: "SmartShamba",
  description: "Pre-confirm maize buyer offers before transport",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <LanguageProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
