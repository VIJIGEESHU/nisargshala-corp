'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, FileText, Gift, Mountain } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Select Vouchers',
      subtitle: 'Choose from 3 locked experience denominations (Individual ₹4k, Family ₹12k, Kids ₹7k).',
      icon: ShoppingBag,
    },
    {
      num: '02',
      title: 'Submit RTGS/NEFT Request',
      subtitle: 'Submit corporate details and receive Nisargshala bank details. Transfer via RTGS/NEFT.',
      icon: FileText,
    },
    {
      num: '03',
      title: 'Receive Activated PDFs',
      subtitle: 'Nisargshala verifies payment and activates cryptographic digital voucher PDFs.',
      icon: Gift,
    },
    {
      num: '04',
      title: 'Employees Experience Nisargshala',
      subtitle: 'Employees redeem their secret codes on nisargshala.in for camping & adventure stays.',
      icon: Mountain,
    },
  ];

  return (
    <section className="py-20 bg-forest-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2">
            Seamless Corporate Process
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-sand-50">
            How The Corporate Experience Program Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-forest-800/80 p-8 rounded-3xl border border-forest-700 backdrop-blur-sm relative"
              >
                <div className="text-amber-400 font-serif text-4xl font-extrabold mb-4 opacity-80">
                  {s.num}
                </div>
                <div className="p-3 bg-forest-900 text-sand-50 rounded-xl w-fit mb-4 border border-forest-700">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-serif text-xl font-bold text-sand-50 mb-2">
                  {s.title}
                </h3>
                <p className="text-xs text-forest-200 leading-relaxed">
                  {s.subtitle}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
