'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sparkles, QrCode, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoucherPreviewProps {
  productCode: 'INDIVIDUAL' | 'FAMILY' | 'KIDS';
  title: string;
  faceValue: number;
  eligibleExperiences: string[];
  companyName?: string;
  recipientName?: string;
}

export default function VoucherCardPreview({
  productCode,
  title,
  faceValue,
  eligibleExperiences,
  companyName = 'Acme Technologies Ltd',
  recipientName = 'Valued Team Member',
}: VoucherPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const formattedValue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(faceValue);

  return (
    <div className="w-full max-w-md mx-auto my-2">
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer transition-all duration-300 select-none group"
      >
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            /* ========================================================= */
            /* FRONT SIDE OF VOUCHER CERTIFICATE                        */
            /* ========================================================= */
            <motion.div
              key="front"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.4 }}
              className="w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-forest-600/30 bg-gradient-to-br from-sand-50 via-white to-forest-50 p-6 flex flex-col justify-between min-h-[460px] relative"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 right-0 left-0 h-2.5 bg-gradient-to-r from-forest-800 via-amber-500 to-forest-800" />

              {/* Header: Official Nisargshala Logo & Authentic Badge */}
              <div className="flex justify-between items-start gap-2 pt-2">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-forest-600/30 bg-white shadow-md shrink-0">
                    <Image
                      src="/images/nisargshala-logo.png"
                      alt="Nisargshala Official Logo"
                      fill
                      className="object-contain p-0.5"
                      priority
                    />
                  </div>
                  <div>
                    <span className="font-serif font-extrabold text-lg tracking-wider text-forest-950 block leading-tight">
                      NISARGSHALA
                    </span>
                    <span className="text-[9px] font-bold text-forest-700 uppercase tracking-widest block">
                      Experience Gift Voucher
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Authentic Certificate
                </div>
              </div>

              {/* Voucher Body Content */}
              <div className="my-3 space-y-3">
                <div className="text-[10px] font-bold text-forest-800 uppercase tracking-widest">
                  {productCode} EXPERIENCE VOUCHER
                </div>

                <div className="flex justify-between items-baseline">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-forest-950">
                    {title}
                  </h3>
                  <div className="text-2xl sm:text-3xl font-serif font-extrabold text-amber-600">
                    {formattedValue}
                  </div>
                </div>

                {/* Secret Redemption Code Box */}
                <div className="bg-forest-950 text-sand-50 p-4 rounded-xl shadow-lg border border-forest-800 text-center relative overflow-hidden">
                  <div className="text-[9px] font-bold text-forest-300 uppercase tracking-widest mb-1 flex justify-between">
                    <span>Secret Redemption Code</span>
                    <span className="text-amber-400 font-mono text-[8px]">HIGH SECURITY CRYPTO</span>
                  </div>
                  <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-amber-400 py-0.5">
                    NS-7R2F-K9XM-P4QD
                  </div>
                  <div className="text-[9px] text-forest-300 mt-0.5">
                    Redeemable exclusively at <strong className="text-sand-100 underline">nisargshala.in/redeem</strong>
                  </div>
                </div>

                {/* Recipient & Corporate Sponsor Metadata */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-sand-100 p-2.5 rounded-lg border border-sand-200">
                  <div>
                    <span className="text-forest-600 block text-[9px] uppercase font-semibold">Corporate Sponsor</span>
                    <strong className="text-forest-950 truncate block">{companyName}</strong>
                  </div>
                  <div>
                    <span className="text-forest-600 block text-[9px] uppercase font-semibold">Recipient</span>
                    <strong className="text-forest-950 truncate block">{recipientName}</strong>
                  </div>
                </div>
              </div>

              {/* Footer Metadata & Interactive Flip Trigger */}
              <div className="pt-2 border-t border-sand-200">
                <div className="flex items-center justify-between text-[10px] text-forest-700">
                  <div>
                    <span className="block text-[8px] uppercase font-bold text-forest-500">Voucher Serial Ref</span>
                    <span className="font-mono font-bold text-forest-950">NS-CORP-2026-0084</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] uppercase font-bold text-forest-500">Validity</span>
                    <span className="font-bold text-forest-950">12 Months from Issue</span>
                  </div>
                </div>

                <div className="mt-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold text-center py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Click Card to Flip & View Redemption QR Code
                </div>
              </div>
            </motion.div>
          ) : (
            /* ========================================================= */
            /* BACK SIDE OF VOUCHER CERTIFICATE (QR CODE & TERMS)       */
            /* ========================================================= */
            <motion.div
              key="back"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.4 }}
              className="w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-forest-600/30 bg-forest-950 text-white p-6 flex flex-col justify-between min-h-[460px] relative"
            >
              <div className="flex items-center justify-between border-b border-forest-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white shrink-0">
                    <Image
                      src="/images/nisargshala-logo.png"
                      alt="Nisargshala Logo"
                      fill
                      className="object-contain p-0.5"
                    />
                  </div>
                  <span className="font-serif font-bold text-sm text-sand-50">Redemption QR & Terms</span>
                </div>
                <span className="text-[9px] bg-amber-600 px-2.5 py-1 rounded text-white font-bold uppercase tracking-wider">
                  Back Side
                </span>
              </div>

              <div className="my-3 flex flex-col sm:flex-row items-center gap-4">
                {/* QR Code Box */}
                <div className="bg-white p-3 rounded-xl shrink-0 shadow-lg text-center">
                  <div className="w-24 h-24 relative bg-forest-900 rounded-lg flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-white" />
                  </div>
                  <span className="text-[8px] font-bold text-forest-950 block mt-1">SCAN TO REDEEM</span>
                </div>

                <div className="text-[11px] space-y-1.5 text-forest-200">
                  <div className="font-bold text-amber-400 uppercase text-[9px] tracking-wider">
                    Redemption Instructions:
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-sand-100">
                    <li>Visit <strong className="text-amber-400">nisargshala.in/redeem</strong> or scan QR code.</li>
                    <li>Select your experience dates.</li>
                    <li>Enter code <strong className="font-mono text-amber-400">NS-7R2F-K9XM-P4QD</strong>.</li>
                  </ol>
                </div>
              </div>

              <div>
                <div className="bg-forest-900/80 p-3 rounded-xl border border-forest-800 text-[10px] text-forest-200 space-y-1 mb-3">
                  <div className="font-bold text-amber-400 uppercase tracking-widest text-[9px]">
                    Terms & Conditions Summary:
                  </div>
                  <p>• Valid for 12 months from payment confirmation.</p>
                  <p>• Single-use voucher. Balance payable if retail experience price exceeds voucher value.</p>
                  <p>• Non-refundable for cash & redeemable exclusively on nisargshala.in.</p>
                </div>

                <div className="bg-forest-800 hover:bg-forest-700 text-white text-[11px] font-bold text-center py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Click Card to Flip Back to Front
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
