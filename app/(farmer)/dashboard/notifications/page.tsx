import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PreferenceToggle from "./PreferenceToggle";
import Link from "next/link";

export const metadata = { title: "Notification Settings | SmartShamba" };

export default async function NotificationSettingsPage() {
  const cookieStore = await cookies();
  const phone = cookieStore.get("smartshamba_farmer")?.value;
  if (!phone) redirect("/dashboard/login");

  const farmer = await prisma.farmer.findUnique({
    where: { phone },
    select: { id: true },
  });
  if (!farmer) redirect("/dashboard/login");

  const prefs = await prisma.notificationPreference.findUnique({
    where: { farmerId: farmer.id },
  });

  const current = {
    transactionSms:     prefs?.transactionSms     ?? true,
    weeklyMarketReport: prefs?.weeklyMarketReport  ?? true,
    harvestTips:        prefs?.harvestTips         ?? true,
    qualityAlerts:      prefs?.qualityAlerts       ?? true,
    disputeUpdates:     prefs?.disputeUpdates      ?? true,
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-green-800">Notification Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose which SMS messages you want to receive. Login codes are always sent.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 max-w-xl">
        <PreferenceToggle
          label="Transaction confirmations"
          description="SMS when you confirm a sale or receive payment."
          field="transactionSms"
          initialValue={current.transactionSms}
        />
        <PreferenceToggle
          label="Weekly market report"
          description="Sunday morning SMS with average maize prices by buyer."
          field="weeklyMarketReport"
          initialValue={current.weeklyMarketReport}
        />
        <PreferenceToggle
          label="Harvest tips & advisories"
          description="Seasonal advice on drying, storage, and aflatoxin prevention."
          field="harvestTips"
          initialValue={current.harvestTips}
        />
        <PreferenceToggle
          label="Quality alerts"
          description="Notifications about maize quality standards from buyers."
          field="qualityAlerts"
          initialValue={current.qualityAlerts}
        />
        <PreferenceToggle
          label="Dispute updates"
          description="SMS when the status of your dispute changes."
          field="disputeUpdates"
          initialValue={current.disputeUpdates}
        />
      </div>

      <p className="text-xs text-gray-400 mt-4 max-w-xl">
        Login codes (OTP) are always sent regardless of these settings.
      </p>

      <div className="mt-6">
        <Link href="/dashboard" className="text-sm text-green-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
