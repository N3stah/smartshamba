export interface TransactionConfirmationData {
  reference: string;
  buyerName: string;
  quantityBags: number;
  pricePerBag: number;
  totalValue: number;
}

export interface SettlementData {
  reference: string;
  buyerName: string;
  totalValue: number;
  mpesaRef?: string;
}

export interface WeeklyMarketReportData {
  weekEnding: string;
  entries: Array<{ buyerName: string; avgPrice: number }>;
  highestCounty?: string;
  highestPrice?: number;
}

export interface HarvestAdvisoryData {
  title: string;
  message: string;
}

export interface QualityAdvisoryData {
  message: string;
}

export interface DisputeUpdateData {
  reference: string;
  status: string;
  adminNote?: string;
}

export interface OtpData {
  code: string;
  expiresMinutes: number;
}

export interface GroupTransactionData {
  groupName: string;
  buyerName: string;
  reference: string;
  totalBags: number;
  pricePerBag: number;
  totalValue: number;
}

// ─── Template functions ──────────────────────────────────────────────────────

export function transactionConfirmationTemplate(d: TransactionConfirmationData): string {
  return (
    `SmartShamba: Offer confirmed!\n` +
    `Ref: ${d.reference}\n` +
    `Buyer: ${d.buyerName}\n` +
    `${d.quantityBags} bags @ KSh ${d.pricePerBag.toLocaleString()}/bag\n` +
    `Total: KSh ${d.totalValue.toLocaleString()}\n` +
    `The buyer will contact you to arrange delivery.`
  );
}

export function settlementTemplate(d: SettlementData): string {
  return (
    `SmartShamba: Payment received!\n` +
    `Ref: ${d.reference}\n` +
    `Buyer: ${d.buyerName}\n` +
    `Amount: KSh ${d.totalValue.toLocaleString()}` +
    (d.mpesaRef ? `\nM-PESA Ref: ${d.mpesaRef}` : '')
  );
}

export function weeklyMarketReportTemplate(d: WeeklyMarketReportData): string {
  const lines = d.entries.map((e) => `${e.buyerName}: KSh ${e.avgPrice.toLocaleString()}`).join('\n');
  const highest = d.highestCounty && d.highestPrice
    ? `\nTop region: ${d.highestCounty} @ KSh ${d.highestPrice.toLocaleString()}`
    : '';
  return `SmartShamba Weekly Report (w/e ${d.weekEnding}):\n${lines}${highest}`;
}

export function harvestAdvisoryTemplate(d: HarvestAdvisoryData): string {
  return `SmartShamba Advisory - ${d.title}:\n${d.message}`;
}

export function qualityAdvisoryTemplate(d: QualityAdvisoryData): string {
  return `SmartShamba Quality Alert:\n${d.message}`;
}

export function disputeUpdateTemplate(d: DisputeUpdateData): string {
  return (
    `SmartShamba: Dispute update\n` +
    `Ref: ${d.reference}\n` +
    `Status: ${d.status.replace('_', ' ')}` +
    (d.adminNote ? `\nNote: ${d.adminNote}` : '')
  );
}

export function otpTemplate(d: OtpData): string {
  return `SmartShamba: Your login code is ${d.code}. Valid for ${d.expiresMinutes} minutes. Do not share this code.`;
}

export function groupTransactionTemplate(d: GroupTransactionData): string {
  return (
    `SmartShamba Group: "${d.groupName}" confirmed a sale to ${d.buyerName}.\n` +
    `Ref: ${d.reference}\n` +
    `${d.totalBags} bags @ KSh ${d.pricePerBag.toLocaleString()}/bag\n` +
    `Total: KSh ${d.totalValue.toLocaleString()}\n` +
    `Admin will contact you for payment.`
  );
}