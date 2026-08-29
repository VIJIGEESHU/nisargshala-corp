import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, ExternalLink, CheckCircle2, ArrowRight, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';

export default function RedeemGuidePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAF7] text-[#1A1C1B] selection:bg-amber-100 selection:text-amber-800">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            Official Redemption Guide
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-[#052219]">
            How to Redeem Your Nisargshala Corporate Gift Voucher
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Experience bookings happen exclusively on the main Nisargshala retail website:{' '}
            <a href="https://nisargshala.in/" target="_blank" className="font-bold underline text-emerald-800 hover:text-amber-600 transition-colors">
              nisargshala.in
            </a>
            .
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-lg space-y-10 text-xs">
          {/* STEP BY STEP */}
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#052219] mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#052219] text-amber-400 font-serif text-sm flex items-center justify-center font-bold">
                1
              </span>
              Step-by-Step Employee Redemption Journey
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="w-8 h-8 rounded-xl bg-[#052219] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  01
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#052219]">Receive Your Secret Redemption Code</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Your HR team will provide your digital PDF voucher containing a secret redemption code formatted like <code className="font-mono bg-white px-2.5 py-1 rounded-md border border-slate-300 font-bold text-amber-700">NS-X7KP-4M9Q-T8ZW</code>. Keep this code confidential.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="w-8 h-8 rounded-xl bg-[#052219] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  02
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#052219]">Visit the Retail Redemption Portal</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Go to the official retail redemption page at{' '}
                    <a href="https://nisargshala.in/redeem" target="_blank" className="text-emerald-800 font-bold underline inline-flex items-center gap-1 hover:text-amber-600">
                      https://nisargshala.in/redeem <ExternalLink className="w-3.5 h-3.5" />
                    </a>{' '}
                    or scan the QR code on your digital voucher PDF.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="w-8 h-8 rounded-xl bg-[#052219] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  03
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#052219]">Select Dates &amp; Participant Details</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Choose your eligible experience (Overnight Camping, Family Camping, Kutuhal, Huppya, or Sahas Camp) and select your preferred dates on the retail website.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="w-8 h-8 rounded-xl bg-[#052219] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  04
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-[#052219]">Instant Automated Validation &amp; Checkout</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    Enter your secret redemption code during booking checkout. The system instantly verifies voucher validity, deducts the face value, and prompts you for any price difference (if applicable).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RULES SUMMARY */}
          <div className="pt-8 border-t border-slate-100">
            <h2 className="font-serif text-xl font-bold text-[#052219] mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Important Commercial Rules
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                <div className="font-serif font-bold text-amber-950 text-sm">No Cash Refunds</div>
                <p className="text-amber-900 leading-relaxed">
                  If your selected experience costs less than the voucher face value, no residual cash refund is issued. The voucher is considered fully redeemed upon booking.
                </p>
              </div>

              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                <div className="font-serif font-bold text-amber-950 text-sm">Paying Price Difference</div>
                <p className="text-amber-900 leading-relaxed">
                  If your selected experience price exceeds your voucher value (e.g. ₹14,800 Kutuhal vs ₹12,000 Family Voucher), you pay the difference smoothly at retail checkout.
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

