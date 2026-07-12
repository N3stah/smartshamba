import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FarmerDisputeForm from "./FarmerDisputeForm";

type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";

const STATUS_STYLES: Record<DisputeStatus, string> = {
  OPEN: "bg-red-100 text-red-800",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

const REASON_LABELS: Record<string, string> = {
  QUANTITY_MISMATCH: "Quantity mismatch",
  QUALITY_REJECTED: "Quality rejected",
  PAYMENT_DELAY: "Payment delayed",
  BUYER_UNRESPONSIVE: "Buyer unreachable",
  PRICE_CHANGED: "Price changed",
  OTHER: "Other",
};

export const metadata = { title: "My Disputes | SmartShamba" };

export default async function FarmerDisputesPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get("smartshamba_farmer")?.value;
  if (!phone) redirect("/dashboard/login");

  const farmer = await prisma.farmer.findUnique({
    where: { phone },
    select: { id: true },
  });
  if (!farmer) redirect("/dashboard/login");

  const [disputes, eligibleTxs] = await Promise.all([
    prisma.dispute.findMany({
      where: { farmerId: farmer.id },
      include: {
        transaction: {
          select: { reference: true, quantityBags: true, totalValue: true },
        },
        buyer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // dispute is a one-to-one optional relation — filter with dispute: null
    prisma.transaction.findMany({
      where: {
        farmerId: farmer.id,
        status: { in: ["SETTLED", "DELIVERED"] },
        dispute: null,
      },
      include: { buyer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">My Disputes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Report issues with your transactions. You can also dial{" "}
          <span className="font-mono font-medium">*384*53374#</span> and select{" "}
          <span className="font-medium">3. Report Issue</span>.
        </p>
      </div>

      {/* Open a new dispute */}
      {eligibleTxs.length > 0 && (
        <div className="mb-8">
          <FarmerDisputeForm eligibleTxs={eligibleTxs} />
        </div>
      )}

      {/* Dispute history */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Dispute History</h2>
        </div>

        {disputes.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            No disputes filed yet.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 font-medium text-gray-600">Date</th>
                <th className="px-6 py-3 font-medium text-gray-600">Transaction</th>
                <th className="px-6 py-3 font-medium text-gray-600">Buyer</th>
                <th className="px-6 py-3 font-medium text-gray-600">Reason</th>
                <th className="px-6 py-3 font-medium text-gray-600">Admin Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {disputes.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        STATUS_STYLES[d.status as DisputeStatus] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-700">
                    {d.transaction.reference}
                  </td>
                  <td className="px-6 py-4">{d.buyer.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {REASON_LABELS[d.reason] ?? d.reason.replaceAll("_", " ")}
                  </td>
                  <td className="px-6 py-4 text-gray-500 italic text-xs">
                    {d.adminNote ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6">
        <Link href="/dashboard" className="text-sm text-green-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}