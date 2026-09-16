import { StaffRole } from '@prisma/client';
import { SMARTSHAMBA_AI_SCOPE } from './ai-scope';
import { getFarmerIdentity, getBuyerIdentity, getStaffIdentity, IdentityContext } from './context/identity-context';
import { getFarmerMarketContext, getBuyerMarketContext, MarketContext } from './context/market-context';
import { getFarmerTransactionContext, getBuyerTransactionContext, TransactionContext } from './context/transaction-context';
import { getTrustContext, TrustContext } from './context/trust-context';
import { getFarmerTransportContext, getBuyerTransportContext, TransportContext } from './context/transport-context';
import { getWeatherContext, WeatherContext } from './context/weather-context';
import { getCFOFinanceContext, FinanceContext } from './context/finance-context';
import { getStaffAnalyticsContext, AnalyticsContext } from './context/analytics-context';

interface AIContext {
  systemPrompt: string;
  language: string;
}

/**
 * Canonical AI Context Builder (Orchestrator).
 * Enforces strict ownership and least-privilege based on server-side authenticated identity.
 */
export async function buildSecureAIContext(
  userId: string, 
  role: 'FARMER' | 'BUYER' | 'STAFF',
  staffRole?: StaffRole
): Promise<AIContext> {
  try {
    if (role === 'FARMER') return await buildFarmerContext(userId);
    if (role === 'BUYER') return await buildBuyerContext(userId);
    if (role === 'STAFF' && staffRole) return await buildStaffContext(userId, staffRole);
    
    return { systemPrompt: "Context unavailable.", language: "en" };
  } catch (error) {
    console.error('[AI_CONTEXT] Error building context:', error);
    return { systemPrompt: "Context unavailable.", language: "en" };
  }
}

async function buildFarmerContext(farmerId: string): Promise<AIContext> {
  const identity = await getFarmerIdentity(farmerId);
  if (!identity) return { systemPrompt: "User not found.", language: "en" };

  const [market, transactions, trust, transport, weather] = await Promise.all([
    getFarmerMarketContext(farmerId),
    getFarmerTransactionContext(farmerId),
    getTrustContext(farmerId, 'FARMER'),
    getFarmerTransportContext(farmerId),
    getWeatherContext(identity.countyId)
  ]);

  const contextStr = formatFarmerContext(identity, market, transactions, trust, transport, weather);
  return { systemPrompt: `${SMARTSHAMBA_AI_SCOPE}\n---\nCONTEXT:\n${contextStr}`, language: identity.language };
}

async function buildBuyerContext(buyerId: string): Promise<AIContext> {
  const identity = await getBuyerIdentity(buyerId);
  if (!identity) return { systemPrompt: "User not found.", language: "en" };

  const [market, transactions, trust, transport, weather] = await Promise.all([
    getBuyerMarketContext(buyerId),
    getBuyerTransactionContext(buyerId),
    getTrustContext(buyerId, 'BUYER'),
    getBuyerTransportContext(buyerId),
    getWeatherContext(identity.countyId)
  ]);

  const contextStr = formatBuyerContext(identity, market, transactions, trust, transport, weather);
  return { systemPrompt: `${SMARTSHAMBA_AI_SCOPE}\n---\nCONTEXT:\n${contextStr}`, language: identity.language };
}

async function buildStaffContext(staffId: string, staffRole: StaffRole): Promise<AIContext> {
  const identity = await getStaffIdentity(staffId, staffRole);
  if (!identity) return { systemPrompt: "User not found.", language: "en" };

  const { analytics, snapshotRevenue } = await getStaffAnalyticsContext(staffRole);
  
  let finance: FinanceContext | undefined = undefined;
  if (staffRole === StaffRole.CFO) {
    finance = await getCFOFinanceContext(snapshotRevenue);
  }

  const contextStr = formatStaffContext(identity, analytics, finance);
  return { systemPrompt: `${SMARTSHAMBA_AI_SCOPE}\n---\nCONTEXT:\n${contextStr}`, language: 'en' };
}

// --- Formatting Functions ---

function formatFarmerContext(id: IdentityContext, m: MarketContext, t: TransactionContext, tr: TrustContext, tp: TransportContext, w: WeatherContext): string {
  return `
USER IDENTITY: Farmer ${id.name}.
ACCOUNT STATUS: ${id.isFrozen ? 'FROZEN (Cannot create new transactions)' : 'Active'}.
TRUST SCORE: ${tr.score ?? 'N/A'} (${tr.level || 'NEW'}).
ACTIVE LISTINGS: ${m.listings.map(l => `${l.quantityBags} bags ${l.product} @ KSh ${l.pricePerBag}`).join(', ') || 'None'}.
PENDING TRANSACTIONS: ${t.pendingTransactions.map(tx => `${tx.reference} (${tx.quantityBags} bags, KSh ${tx.totalValue})`).join(', ') || 'None'}.
ACTIVE TRANSPORT: ${tp.activeTransport.map(tp => `${tp.status} from ${tp.pickupLocation} to ${tp.dropoffLocation}${tp.isHalted ? ' (HALTED due to weather)' : ''}`).join(', ') || 'None'}.
WEATHER ALERTS: ${w.activeAlerts.map(a => a.message).join(', ') || 'None'}.
MARKET PREDICTIONS (7d): ${m.predictions.map(p => `${p.crop}: KSh ${p.predictedPrice} (${p.recommendation})`).join(', ') || 'None'}.
  `.trim();
}

function formatBuyerContext(id: IdentityContext, m: MarketContext, t: TransactionContext, tr: TrustContext, tp: TransportContext, w: WeatherContext): string {
  return `
USER IDENTITY: Buyer ${id.name}.
ACCOUNT STATUS: ${id.isFrozen ? 'FROZEN (Cannot create new transactions)' : 'Active'}.
TRUST SCORE: ${tr.score ?? 'N/A'} (${tr.level || 'NEW'}).
ACTIVE DEMANDS: ${m.demands.map(d => `${d.quantityBags} bags ${d.product}`).join(', ') || 'None'}.
PENDING TRANSACTIONS: ${t.pendingTransactions.map(tx => `${tx.reference} (${tx.quantityBags} bags, KSh ${tx.totalValue})`).join(', ') || 'None'}.
ACTIVE TRANSPORT: ${tp.activeTransport.map(tp => `${tp.status} from ${tp.pickupLocation} to ${tp.dropoffLocation}${tp.isHalted ? ' (HALTED due to weather)' : ''}`).join(', ') || 'None'}.
WEATHER ALERTS: ${w.activeAlerts.map(a => a.message).join(', ') || 'None'}.
MARKET PREDICTIONS (7d): ${m.predictions.map(p => `${p.crop}: KSh ${p.predictedPrice} (${p.recommendation})`).join(', ') || 'None'}.
  `.trim();
}

function formatStaffContext(id: IdentityContext, a: AnalyticsContext, f?: FinanceContext): string {
  let roleSpecific = "";
  if (id.staffRole === StaffRole.CEO) {
    roleSpecific = `
EXECUTIVE METRICS (CEO):
Total Farmers: ${a.totalFarmers}. Total Buyers: ${a.totalBuyers}.
Total Transactions: ${a.totalTxs}. Settled Transactions: ${a.settledTx}.
Historical Revenue: KSh ${f?.historicalRevenue || 0}.
Platform Success Rate: ${a.totalTxs > 0 ? ((a.settledTx / a.totalTxs) * 100).toFixed(1) : 0}%.
    `.trim();
  } else if (id.staffRole === StaffRole.CFO && f) {
    roleSpecific = `
FINANCIAL METRICS (CFO):
Historical Revenue: KSh ${f.historicalRevenue || 0}.
Platform Wallet Balance: KSh ${f.platformBalance || 0}.
Escrow Liabilities: KSh ${f.escrowBalance || 0}.
Pending Withdrawals: ${f.pendingWithdrawals || 0}.
    `.trim();
  } else if (id.staffRole === StaffRole.CTO) {
    roleSpecific = `
TECHNICAL & OPERATIONAL METRICS (CTO):
Active Weather Alerts: ${a.activeWeatherAlerts}.
Transport Weather Holds: ${a.activeTransportHolds}.
AI Market Predictions Active: ${a.aiPredictionsCount}.
Transport Success Rate: ${a.transportSuccessRate.toFixed(1)}%.
    `.trim();
  } else if (id.staffRole === StaffRole.PM) {
    roleSpecific = `
PRODUCT & MARKETPLACE METRICS (PM):
Active Produce Listings: ${a.activeListings}.
Active Buyer Demands: ${a.activeDemands}.
New Farmers Today: ${a.totalFarmers}. New Buyers Today: ${a.totalBuyers}.
    `.trim();
  }

  return `STAFF ROLE: ${id.staffRole}.\n${roleSpecific}`;
}
