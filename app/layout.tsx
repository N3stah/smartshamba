import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SmartShamba",
  description: "Secure maize buyers before transport",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-green-800 text-white px-4 py-4 flex flex-wrap gap-4 text-sm md:text-base">
          <Link href="/">Home</Link>
          <Link href="/ussd">USSD Demo</Link>
          <Link href="/buyer">Buyer Dashboard</Link>
          <Link href="/history">Transactions</Link>
          <Link href="/market">Market Prices</Link>
        </nav>

        {children}
      </body>
    </html>
  );
}