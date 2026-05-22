"use client";

import { useState } from "react";

export default function USSDPage() {
  const [step, setStep] = useState(1);
  const [bags, setBags] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState("");

  const buyers = [
    {
      name: "Kitale Millers Ltd",
      price: "KSh 4,200",
    },
    {
      name: "Eldoret Grain Buyers",
      price: "KSh 4,050",
    },
    {
      name: "Kitale Co-op",
      price: "KSh 3,980",
    },
  ];

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl bg-black text-green-400 p-6 shadow-2xl font-mono">

        <div className="mb-4 text-center border-b border-green-700 pb-2">
          <h1 className="text-lg font-bold">
            SmartShamba *123#
          </h1>

          <p className="text-xs text-green-500 mt-1">
            Pilot Demo · Trans Nzoia County · 2026
          </p>
        </div>

        {/* SCREEN 1 */}
        {step === 1 && (
          <div>
            <p>Welcome to SmartShamba</p>

            <div className="mt-4 space-y-2">
              <p>1. Sell Maize</p>
              <p>2. Market Prices</p>
              <p>3. My Transactions</p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="mt-6 w-full rounded bg-green-600 py-2 text-white"
            >
              Send
            </button>
          </div>
        )}

        {/* SCREEN 2 */}
        {step === 2 && (
          <div>
            <p>Enter number of bags:</p>

            <input
              type="number"
              value={bags}
              onChange={(e) => setBags(e.target.value)}
              placeholder="e.g 40"
              className="mt-4 w-full rounded bg-black border border-green-500 p-2 text-green-400"
            />

            <button
              onClick={() => setStep(3)}
              className="mt-6 w-full rounded bg-green-600 py-2 text-white"
            >
              Send
            </button>
          </div>
        )}

        {/* SCREEN 3 */}
        {step === 3 && (
          <div>
            <p className="mb-4">Buyer Offers</p>

            <div className="space-y-4">
              {buyers.map((buyer, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedBuyer(buyer.name);
                    setStep(4);
                  }}
                  className="w-full rounded border border-green-600 p-3 text-left hover:bg-green-900"
                >
                  <p>{index + 1}. {buyer.name}</p>
                  <p className="text-sm text-green-500">
                    {buyer.price} per bag
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 4 */}
        {step === 4 && (
          <div>
            <p className="mb-4">Confirm Offer</p>

            <div className="space-y-3 text-sm">
              <p>
                Buyer:
                <br />
                {selectedBuyer}
              </p>

              <p>
                Quantity:
                <br />
                {bags} bags
              </p>

              <p>
                Estimated Value:
                <br />
                KSh {Number(bags || 0) * 4200}
              </p>

              <p>
                Delivery Date:
                <br />
                22 May 2026
              </p>
            </div>

            <button
              onClick={() => setStep(5)}
              className="mt-6 w-full rounded bg-green-600 py-2 text-white"
            >
              Confirm
            </button>
          </div>
        )}

        {/* SCREEN 5 */}
        {step === 5 && (
          <div>
            <p className="text-lg font-bold">
              Offer Recorded
            </p>

            <div className="mt-4 text-sm space-y-3">
              <p>
                Ref:
                <br />
                SS-2026-004821
              </p>

              <p>
                Payment via M-PESA upon delivery confirmation.
              </p>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setBags("");
                setSelectedBuyer("");
              }}
              className="mt-6 w-full rounded bg-green-600 py-2 text-white"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </main>
  );
}