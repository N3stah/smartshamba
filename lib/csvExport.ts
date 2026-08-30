export function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(fieldName => {
        let value = row[fieldName];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'string' && value.includes(',')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          value = value.toISOString();
        }
        return String(value);
      }).join(',')
    )
  ];
  return csvRows.join('\n');
}

interface TxForCSV {
  reference: string;
  createdAt: string | Date;
  farmer?: { name?: string | null; phone?: string } | null;
  buyer?: { name?: string; phone?: string | null } | null;
  quantityBags: number;
  pricePerBag: number;
  totalValue: number;
  status: string;
  mpesaRef?: string | null;
  [key: string]: unknown;
}
export function formatTransactionsForCSV(transactions: TxForCSV[]) {
  return transactions.map(tx => ({
    Reference: tx.reference,
    Date: new Date(tx.createdAt).toLocaleString('en-KE'),
    Farmer: tx.farmer?.name ?? 'Unknown',
    FarmerPhone: tx.farmer?.phone ?? 'N/A',
    Buyer: tx.buyer?.name ?? 'Unknown',
    BuyerPhone: tx.buyer?.phone ?? 'N/A',
    Bags: tx.quantityBags,
    PricePerBag: tx.pricePerBag,
    TotalValue: tx.totalValue,
    Status: tx.status,
    MpesaRef: tx.mpesaRef ?? 'N/A',
  }));
}

interface FarmerForCSV {
  id: string;
  name?: string | null;
  phone: string;
  nationalId?: string | null;
  location?: string | null;
  county?: { name: string } | null;
  ward?: { name: string } | null;
  verified?: boolean;
  createdAt: string | Date;
  [key: string]: unknown;
}
export function formatFarmersForCSV(farmers: FarmerForCSV[]) {
  return farmers.map(f => ({
    ID: f.id,
    Name: f.name ?? 'N/A',
    Phone: f.phone,
    NationalID: f.nationalId ?? 'N/A',
    Location: f.location ?? 'N/A',
    County: f.county?.name ?? 'N/A',
    Ward: f.ward?.name ?? 'N/A',
    Verified: f.verified,
    Joined: new Date(f.createdAt).toLocaleString('en-KE'),
  }));
}

interface BuyerForCSV {
  id: string;
  name: string | null;
  phone?: string | null;
  location: string | null;
  capacityBags: number;
  pricePerBag: number;
  verified?: boolean;
  active: boolean;
  createdAt: string | Date | null;
  [key: string]: unknown;
}
export function formatBuyersForCSV(buyers: BuyerForCSV[]) {
  return buyers.map(b => ({
    ID: b.id,
    Name: b.name ?? 'N/A',
    Phone: b.phone ?? 'N/A',
    Location: b.location ?? 'N/A',
    Capacity: b.capacityBags,
    PricePerBag: b.pricePerBag,
    Verified: b.verified,
    Active: b.active,
    Joined: b.createdAt ? new Date(b.createdAt).toLocaleString('en-KE') : 'N/A',
  }));
}

interface LedgerEntryForCSV {
  createdAt?: string | Date | null;
  type?: string;
  amount?: number;
  currency?: string;
  description?: string;
  reference?: string | null;
  status?: string;
  balanceAfter?: number;
}
export function formatLedgerForCSV(entries: LedgerEntryForCSV[]) {
  return entries.map(e => ({
    date: e.createdAt ? new Date(e.createdAt).toISOString() : '',
    type: e.type ?? '',
    amount: e.amount ?? '',
    currency: e.currency ?? 'KES',
    description: e.description ?? '',
    reference: e.reference ?? '',
    status: e.status ?? '',
    balance: e.balanceAfter ?? '',
  }));
}
