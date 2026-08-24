'use client';

import { CheckCircle2, Clock, ShieldCheck, Ticket, Send } from 'lucide-react';

interface StatusTimelineProps {
  currentStatus: 'PENDING_PAYMENT' | 'AWAITING_VERIFICATION' | 'PAID' | 'COMPLETED';
}

export default function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const steps = [
    { key: 'CREATED', label: 'Order Created', icon: CheckCircle2, done: true },
    { key: 'SUBMITTED', label: 'Payment Submitted', icon: Send, done: currentStatus !== 'PENDING_PAYMENT' },
    { key: 'VERIFICATION', label: 'Nisargshala Verification', icon: Clock, done: currentStatus === 'PAID' || currentStatus === 'COMPLETED' },
    { key: 'ACTIVATED', label: 'Vouchers Activated', icon: ShieldCheck, done: currentStatus === 'PAID' || currentStatus === 'COMPLETED' },
    { key: 'DELIVERY', label: 'Voucher PDF Delivery', icon: Ticket, done: currentStatus === 'COMPLETED' },
  ];

  return (
    <div className="w-full bg-sand-100/60 p-6 rounded-2xl border border-sand-200 my-6">
      <div className="text-xs font-bold text-forest-900 uppercase tracking-widest mb-6 text-center">
        Order & Voucher Fulfillment Timeline
      </div>

      <div className="flex items-center justify-between max-w-2xl mx-auto relative overflow-x-auto">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex flex-col items-center relative z-10 min-w-[90px]">
              <div
                className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                  s.done
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-sand-200 text-forest-400 border border-sand-300'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] font-semibold text-center mt-2 ${
                  s.done ? 'text-forest-900 font-bold' : 'text-forest-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
