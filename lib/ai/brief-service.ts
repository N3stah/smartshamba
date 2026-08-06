import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

async function callAIProvider(prompt: string): Promise<string | null> {
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 150 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
      }
    } catch (e) {}
  }
  
  if (NVIDIA_API_KEY) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "z-ai/glm-5.2",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 150
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || null;
      }
    } catch (e) { return null; }
  }
  return null;
}

export async function generateDailyBrief(role: 'FARMER' | 'BUYER' | 'ADMIN', phone: string) {
  let context = "";
  let roleStr = role.charAt(0) + role.slice(1).toLowerCase(); // Farmer, Buyer, Admin

  try {
    if (role === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({
        where: { phone },
        include: {
          ProduceListing: { where: { status: 'ACTIVE' }, take: 3 },
          transactions: { where: { status: { in: ['PENDING', 'AGREED', 'DELIVERY_SCHEDULED', 'DELIVERED', 'SETTLING'] } }, take: 3, include: { buyer: true } }
        }
      });

      const predictions = await prisma.marketPrediction.findMany({
        where: { region: 'National', horizon: '7d' }, take: 2
      });

      context = `Active Listings: ${farmer?.ProduceListing.length || 0}. Pending Transactions: ${farmer?.transactions.length || 0}. Market Outlook: ${predictions.map(p => p.crop + ' ' + p.recommendation).join(', ')}.`;
    } else if (role === 'BUYER') {
      const buyer = await prisma.buyer.findFirst({
        where: { phone },
        include: {
          BuyerDemand: { where: { status: 'ACTIVE' }, take: 3 },
          transactions: { where: { status: { in: ['PENDING', 'AGREED', 'DELIVERY_SCHEDULED', 'DELIVERED', 'SETTLING'] } }, take: 3, include: { farmer: true } }
        }
      });

      const predictions = await prisma.marketPrediction.findMany({
        where: { region: 'National', horizon: '7d' }, take: 2
      });

      context = `Active Demands: ${buyer?.BuyerDemand.length || 0}. Pending Deliveries: ${buyer?.transactions.length || 0}. Procurement Outlook: ${predictions.map(p => p.crop + ' ' + p.recommendation).join(', ')}.`;
    } else if (role === 'ADMIN') {
      const stats = await Promise.all([
        prisma.farmer.count(),
        prisma.buyer.count(),
        prisma.transaction.count({ where: { status: 'PENDING' } }),
        prisma.dispute.count({ where: { status: 'OPEN' } })
      ]);
      context = `Platform Overview: ${stats[0]} Farmers, ${stats[1]} Buyers. Pending Transactions: ${stats[2]}. Open Disputes: ${stats[3]}.`;
    }

    const prompt = `You are SmartShamba AI. Generate a concise, encouraging morning brief (max 3 sentences) for a platform ${roleStr} based on this data: ${context}. 
    IMPORTANT: You must address the user specifically as a ${roleStr}. Do not confuse them with the data they are viewing.
    Start with a friendly greeting.`;
    
    const brief = await callAIProvider(prompt);
    return brief || "Welcome back! Check your dashboard for today's updates.";
  } catch (error) {
    console.error('[AI Brief] Error:', error);
    Sentry.captureException(error);
    return "Welcome back! Check your dashboard for today's updates.";
  }
}
