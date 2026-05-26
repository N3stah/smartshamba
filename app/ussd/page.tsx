"use client";

import { useState } from "react";

export default function USSDPage() {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState("");

  const nextStep = () => {
    if (step < 5) {
      setStep(step + 1);
      setInput("");
    }
  };

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-4 py-10">

      {/* PHONE FRAME */}
      <div className="w-87.5 rounded-[40px] border-10 border-black bg-black shadow-2xl overflow-hidden">

        {/* TOP STATUS BAR */}
        <div className="bg-black text-white px-4 py-2 flex justify-between text-xs font-semibold">
          <span>Safaricom</span>
          <span>4G</span>
          <span>🔋 82%</span>
        </div>

        {/* SCREEN */}
        <div className="bg-[#d7f0d1] min-h-155 p-5 flex flex-col justify-between">

          {/* CONTENT */}
          <div>

            {/* HEADER */}
            <div className="text-center mb-8">
              <h1 className="font-bold text-3xl text-green-900">
                SmartShamba
              </h1>

              <p className="text-sm text-gray-800 mt-2 font-medium">
                USSD Pilot Demo · *123#
              </p>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-5">

                <p className="font-bold text-black text-xl">
                  Welcome to SmartShamba
                </p>

                <div className="bg-white rounded-2xl p-5 border border-gray-300 shadow-sm">

                  <div className="space-y-4 text-black text-lg font-medium">

                    <p>1. Sell Maize</p>

                    <p>2. Check Buyer Offers</p>

                    <p>3. Exit</p>

                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-5">

                <p className="font-bold text-black text-xl">
                  Enter Number of Bags
                </p>

                <div className="bg-white rounded-2xl p-5 border border-gray-300 shadow-sm text-black text-lg">
                  Example: 40
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-5">

                <p className="font-bold text-black text-xl">
                  Available Buyer Offers
                </p>

                <div className="bg-white rounded-2xl p-5 border border-gray-300 shadow-sm space-y-4 text-black">

                  <p className="font-medium text-lg">
                    1. Kitale Millers Ltd — KSh 4,200
                  </p>

                  <p className="font-medium text-lg">
                    2. Eldoret Grain Buyers — KSh 4,050
                  </p>

                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="space-y-5">

                <p className="font-bold text-black text-xl">
                  Confirm Buyer Offer
                </p>

                <div className="bg-white rounded-2xl p-5 border border-gray-300 shadow-sm space-y-3 text-black text-lg">

                  <p>
                    Buyer: Kitale Millers Ltd
                  </p>

                  <p>
                    Quantity: 40 bags
                  </p>

                  <p>
                    Offer: KSh 168,000
                  </p>

                </div>

                <p className="text-gray-800 font-medium">
                  Reply 1 to confirm
                </p>
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="space-y-5">

                <div className="bg-white rounded-2xl p-5 border border-gray-300 shadow-sm space-y-4 text-black">

                  <p className="font-bold text-green-700 text-lg">
                    Offer Recorded Successfully
                  </p>

                  <p className="font-medium">
                    Ref: SS-2026-004821
                  </p>

                  <p>
                    Delivery Date: 22 May 2026
                  </p>

                  <p>
                    Payment via M-PESA after delivery confirmation.
                  </p>

                </div>

                <p className="text-sm text-gray-700">
                  Session expires in 30 seconds
                </p>
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="mt-8">

            {step < 5 && (
              <>
                <label className="text-sm font-semibold text-black">
                  Enter option number:
                </label>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full mt-3 p-4 rounded-2xl border border-gray-400 bg-white text-black placeholder-gray-500 text-lg"
                  placeholder="Type here..."
                />

                <button
                  onClick={nextStep}
                  className="w-full mt-5 bg-green-700 hover:bg-green-800 text-white py-4 rounded-2xl font-bold text-xl transition"
                >
                  Send
                </button>
              </>
            )}

            {step === 5 && (
              <button
                onClick={() => setStep(1)}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg"
              >
                Restart Demo
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}