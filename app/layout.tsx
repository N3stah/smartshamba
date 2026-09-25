import { Merriweather, Plus_Jakarta_Sans } from "next/font/google";

const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-merriweather" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
import "./globals.css";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/i18n";

export const metadata = {
  title: "SmartShamba",
  description: "Pre-confirm maize buyer offers before transport",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${merriweather.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900">
        <LanguageProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
