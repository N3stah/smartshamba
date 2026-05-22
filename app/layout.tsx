import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "SmartShamba",
  description: "Pre-confirm maize buyer offers before transport",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">

        {/* Pilot Banner */}
        <div className="bg-green-800 text-white text-center text-sm py-2">
          SmartShamba Pilot Demo · Trans Nzoia County · 2026
        </div>

        {/* Navigation */}
        <nav className="bg-white shadow-sm px-6 py-4 flex flex-wrap gap-6 items-center">
          <Link
            href="/"
            className="font-bold text-green-800 text-lg"
          >
            SmartShamba
          </Link>

          <Link
            href="/ussd"
            className="text-gray-700 hover:text-green-700 transition"
          >
            USSD Demo
          </Link>

          <Link
            href="/buyer"
            className="text-gray-700 hover:text-green-700 transition"
          >
            Verified Buyers
          </Link>

          <Link
            href="/history"
            className="text-gray-700 hover:text-green-700 transition"
          >
            Transactions
          </Link>

          <Link
            href="/market"
            className="text-gray-700 hover:text-green-700 transition"
          >
            Market Prices
          </Link>

          <Link
            href="/about"
            className="text-gray-700 hover:text-green-700 transition"
          >
            About
          </Link>
        </nav>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-green-900 text-white mt-16">
          <div className="max-w-6xl mx-auto px-6 py-10">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Company */}
              <div>
                <h3 className="text-2xl font-bold">
                  SmartShamba
                </h3>

                <p className="mt-3 text-green-100 text-sm leading-relaxed">
                  SmartShamba helps maize farmers pre-confirm buyer offers before transport through a simple USSD workflow.
                </p>
              </div>

              {/* Pilot Info */}
              <div>
                <h4 className="font-semibold text-lg">
                  Pilot Information
                </h4>

                <ul className="mt-3 space-y-2 text-sm text-green-100">
                  <li>USSD: *123#</li>
                  <li>M-PESA Settlement Workflow</li>
                  <li>Trans Nzoia County, Kenya</li>
                  <li>Pilot Deployment Stage · 2026</li>
                </ul>
              </div>

              {/* Team */}
              <div>
                <h4 className="font-semibold text-lg">
                  Startup Team
                </h4>

                <ul className="mt-3 space-y-2 text-sm text-green-100">
                  <li>CEO — Daisy Ayuma</li>
                  <li>CTO — Mark Manoti</li>
                  <li>COO — Grace Akomo</li>
                  <li>PM — Eva Chepchumba</li>
                </ul>
              </div>

            </div>

            {/* Closing Statement */}
            <div className="border-t border-green-700 mt-8 pt-6 text-center text-sm text-green-200">
              A farmer should not discover the real price after the truck is loaded.
            </div>

          </div>
        </footer>

      </body>
    </html>
  );
}