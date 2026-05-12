"use client";

import { useState } from "react";

export default function USSDPage() {
  const [step, setStep] = useState(1);
  const [quantity, setQuantity] = useState("");

  return (
    <main className="min-h-screen bg-black text-green-400 flex items-center justify-center p-6">
      <div className="border border-green-500 p-6 rounded-lg w-full max-w-md font-mono">
        {step === 1 && (
          <>
            <h1 className="text-xl mb-4">*123# SmartShamba</h1>

            <p>1. Sell Maize</p>
            <p>2. Check Market Price</p>
            <p>3. My Orders</p>

            <button
              onClick={() => setStep(2)}
              className="mt-6 border border-green-500 px-4 py-2"
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-lg mb-4">Enter maize quantity (bags)</h1>

            <input
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-black border border-green-500 p-2 text-green-400"
              placeholder="50"
            />

            <button
              onClick={() => setStep(3)}
              className="mt-6 border border-green-500 px-4 py-2"
            >
              Submit
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-lg mb-4">Verified Buyer Found</h1>

            <p>Buyer: Kitale Millers Ltd</p>
            <p>Offer: KES 4,200 per bag</p>
            <p>Quantity: {quantity} bags</p>

            <button
              onClick={() => setStep(4)}
              className="mt-6 border border-green-500 px-4 py-2"
            >
              Lock Buyer
            </button>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-lg mb-4">Transaction Locked</h1>

            <div className="bg-green-900 p-4 rounded mt-4">
  <p className="font-bold">
    M-PESA PAYMENT PROTECTION ACTIVE
  </p>

  <p className="mt-2">
    Buyer funds will be released upon delivery confirmation.
  </p>
</div>
            <p className="mt-4">
              Buyer price secured before transport.
            </p>

            <div className="mt-6 border border-green-500 p-4">
              <p>Order ID: SHB-20481</p>
              <p>Status: VERIFIED</p>
            </div>
            <button
  onClick={() => setStep(5)}
  className="mt-6 border border-green-500 px-4 py-2"
>
  Confirm Delivery
</button>
          </>
        )}
        {step === 5 && (
  <>
    <h1 className="text-lg mb-4">
      M-PESA PAYMENT CONFIRMED
    </h1>

    <div className="bg-green-900 p-4 rounded">
      <p>Confirmed.</p>

      <p className="mt-3">
        KES 210,000 received from SmartShamba Escrow.
      </p>

      <p className="mt-2">
        New M-PESA balance is KES 248,540.
      </p>

      <p className="mt-2">
        Transaction ID: SHB892KPL
      </p>
    </div>

    <div className="mt-6 border border-green-500 p-4">
      <p>Delivery Status: COMPLETE</p>
      <p>Buyer Settlement: SUCCESSFUL</p>
    </div>
  </>
)}
      </div>
    </main>
  );
}