"use client";
import { useState } from "react";

const STEPS = [
  {
    title: "Welcome to SmartShamba",
    content: (
      <div className="space-y-4 text-black text-lg font-medium">
        <p className="text-sm text-gray-600 mb-4">CON Welcome to SmartShamba\nTrans Nzoia Maize Platform</p>
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
          <p>1. Sell Maize</p>
          <p>2. My Transactions</p>
          <p>3. Exit</p>
        </div>
      </div>
    ),
  },
  {
    title: "Enter Quantity",
    content: (
      <div className="space-y-4">
        <p className="text-black font-bold text-lg">CON Enter number of bags to sell:</p>
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-gray-600 text-sm">
          Enter a number between 1 and 500
        </div>
      </div>
    ),
  },
  {
    title: "Select Buyer",
    content: (
      <div className="space-y-4">
        <p className="text-black font-bold text-lg">CON Select buyer offer:</p>
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3 text-black text-sm">
          <p className="font-semibold">1. Eldoret Grain</p>
          <p className="text-gray-600 ml-3">KSh 2,950/bag · Eldoret Town</p>
          <p className="font-semibold mt-2">2. Kitale Millers</p>
          <p className="text-gray-600 ml-3">KSh 2,800/bag · Kitale Town</p>
          <p className="font-semibold mt-2">3. Trans Nzoia Cereals</p>
          <p className="text-gray-600 ml-3">KSh 2,700/bag · Mois Bridge</p>
        </div>
      </div>
    ),
  },
  {
    title: "Confirm Offer",
    content: (
      <div className="space-y-4">
        <p className="text-black font-bold text-lg">CON Confirm your offer:</p>
        <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-2 text-black text-sm">
          <p><strong>Buyer:</strong> Eldoret Grain</p>
          <p><strong>Quantity:</strong> 40 bags</p>
          <p><strong>Price:</strong> KSh 2,950/bag</p>
          <p><strong>Total:</strong> KSh 118,000</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-200 text-sm">
          <p>1. Confirm</p>
          <p className="mt-2">2. Cancel</p>
        </div>
      </div>
    ),
  },
  {
    title: "Offer Confirmed ✓",
    content: (
      <div className="space-y-4">
        <p className="text-black font-bold text-lg">END Offer Recorded</p>
        <div className="bg-white rounded-xl p-4 border border-green-200 space-y-2 text-black text-sm">
          <p className="font-bold text-green-700 text-base">✓ Transaction Created</p>
          <p><strong>Ref:</strong> SS-MQOI0F74-FV93</p>
          <p><strong>Buyer:</strong> Eldoret Grain</p>
          <p><strong>Total:</strong> KSh 118,000</p>
          <p className="text-gray-500 text-xs mt-3">SMS confirmation sent to your phone. Buyer will contact you to arrange delivery.</p>
        </div>
      </div>
    ),
  },
];

export default function USSDPage() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");

  function handleSend() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setInput("");
    }
  }

  return (
    <main className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="text-center mb-8">
        <p className="text-green-700 font-semibold text-sm uppercase tracking-wider mb-2">USSD Simulator</p>
        <h1 className="text-3xl font-bold text-green-900">SmartShamba USSD Demo</h1>
        <p className="text-gray-600 mt-2">Simulating: <span className="font-mono font-bold text-green-700">*384*53374#</span> on Safaricom</p>
      </div>

      {/* Phone frame */}
      <div className="w-80 rounded-[36px] border-8 border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="bg-gray-900 text-white px-4 py-2 flex justify-between text-xs font-semibold">
          <span>Safaricom</span>
          <span className="font-mono">*384*53374#</span>
          <span>🔋 82%</span>
        </div>

        {/* Screen */}
        <div className="bg-[#d7f0d1] min-h-[480px] p-5 flex flex-col justify-between">
          <div>
            <div className="text-center mb-6">
              <h2 className="font-bold text-xl text-green-900">SmartShamba</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-green-700' : i < step ? 'w-3 bg-green-400' : 'w-3 bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            {STEPS[step].content}
          </div>

          <div className="mt-6">
            {step < STEPS.length - 1 ? (
              <>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full p-3 rounded-xl border border-gray-400 bg-white text-black placeholder-gray-400 text-base"
                  placeholder="Type option and press Send..."
                />
                <button
                  onClick={handleSend}
                  className="w-full mt-3 bg-green-700 hover:bg-green-800 text-white py-3 rounded-xl font-bold text-base transition"
                >
                  Send →
                </button>
              </>
            ) : (
              <button
                onClick={() => { setStep(0); setInput(""); }}
                className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold text-base hover:bg-black transition"
              >
                ↺ Restart Demo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center max-w-sm">
        <p className="text-xs text-gray-500">
          This is a frontend simulation of the SmartShamba USSD flow. The real USSD backend is live on Africa's Talking sandbox at <span className="font-mono font-bold">*384*53374#</span>.
        </p>
        <div className="flex gap-3 justify-center mt-4">
          <a href="/buyer" className="text-sm text-green-700 underline">View Live Buyers</a>
          <a href="/demo" className="text-sm text-green-700 underline">Full Demo</a>
        </div>
      </div>
    </main>
  );
}
