import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, ExternalLink, CheckCircle2, ArrowRight, AlertCircle, HelpCircle } from 'lucide-react';

export default function RedeemGuidePage() {
  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-forest-100 text-forest-800 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            Official Redemption Guide
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest-900">
            How to Redeem Your Nisargshala Corporate Gift Voucher
          </h1>
          <p className="mt-3 text-sm text-forest-700 max-w-2xl mx-auto">
            Experience bookings happen exclusively on the main Nisargshala retail website: <a href="https://nisargshala.in/" target="_blank" className="font-semibold underline text-amber-700">nisargshala.in</a>.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-forest-200 p-8 shadow-sm space-y-8 text-xs">
          {/* STEP BY STEP */}
          <div>
            <h2 className="font-serif text-xl font-bold text-forest-900 mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-sans text-xs flex items-center justify-center font-bold">1</span>
              Step-by-Step Employee Redemption Journey
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl border border-sand-200">
                <div className="p-2.5 bg-forest-800 text-white rounded-lg font-bold shrink-0">1</div>
                <div>
                  <h3 className="font-bold text-sm text-forest-900">Receive Your Secret Redemption Code</h3>
                  <p className="text-forest-700 mt-1">
                    Your HR team will provide your digital PDF voucher containing a secret redemption code formatted like <code className="font-mono bg-white px-2 py-0.5 rounded border border-sand-300 font-bold text-amber-700">NS-X7KP-4M9Q-T8ZW</code>. Keep this code confidential.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl border border-sand-200">
                <div className="p-2.5 bg-forest-800 text-white rounded-lg font-bold shrink-0">2</div>
                <div>
                  <h3 className="font-bold text-sm text-forest-900">Visit the Retail Redemption Portal</h3>
                  <p className="text-forest-700 mt-1">
                    Go to the official retail redemption page at <a href="https://nisargshala.in/redeem" target="_blank" className="text-amber-700 font-bold underline inline-flex items-center gap-1">https://nisargshala.in/redeem <ExternalLink className="w-3 h-3" /></a> or scan the QR code on your digital voucher PDF.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl border border-sand-200">
                <div className="p-2.5 bg-forest-800 text-white rounded-lg font-bold shrink-0">3</div>
                <div>
                  <h3 className="font-bold text-sm text-forest-900">Select Dates & Participant Details</h3>
                  <p className="text-forest-700 mt-1">
                    Choose your eligible experience (Overnight Camping, Family Camping, Kutuhal, Huppya, or Sahas Camp) and select your preferred dates on the retail website.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-sand-50 rounded-xl border border-sand-200">
                <div className="p-2.5 bg-forest-800 text-white rounded-lg font-bold shrink-0">4</div>
                <div>
                  <h3 className="font-bold text-sm text-forest-900">Instant Automated Validation & Checkout</h3>
                  <p className="text-forest-700 mt-1">
                    Enter your secret redemption code during booking checkout. The system instantly verifies voucher validity, deducts the face value, and prompts you for any price difference (if applicable).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RULES SUMMARY */}
          <div className="pt-6 border-t border-forest-100">
            <h2 className="font-serif text-lg font-bold text-forest-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Important Commercial Rules
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900">No Cash Refunds</div>
                <p className="text-amber-800">
                  If your selected experience costs less than the voucher face value, no residual cash refund is issued. The voucher is considered fully redeemed upon booking.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900">Paying Price Difference</div>
                <p className="text-amber-800">
                  If your selected experience price exceeds your voucher value (e.g. ₹14,800 Kutuhal vs ₹12,000 Family Voucher), you pay the ₹2,800 difference at retail checkout.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
