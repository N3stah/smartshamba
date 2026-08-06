export function convertToCSV(data: any[]): string {
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
        return value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

export function formatTransactionsForCSV(transactions: any[]) {
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

export function formatFarmersForCSV(farmers: any[]) {
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


export function formatLedgerForCSV(entries: any[]) {
  return entries.map(e => ({
    Date: new Date(e.createdAt).toLocaleString('en-KE'),
    Description: e.description,
    Type: e.entryType,
    Amount: e.amount,
    Reference: e.reference ?? 'N/A'
  }));
}

export function formatBuyersForCSV(buyers: any[]) {
  return buyers.map(b => ({
    ID: b.id,
    Name: b.name,
    Phone: b.phone ?? 'N/A',
    Location: b.location,
    Capacity: b.capacityBags,
    PricePerBag: b.pricePerBag,
    Verified: b.verified,
    Active: b.active,
    Joined: new Date(b.createdAt).toLocaleString('en-KE'),
  }));
}
