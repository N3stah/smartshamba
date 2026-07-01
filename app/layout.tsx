import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "SmartShamba",
  description: "Pre-confirm maize buyer offers before transport",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
