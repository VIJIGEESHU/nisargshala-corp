'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { LOCKED_VOUCHER_PRODUCTS } from '@/lib/pricing';
import VoucherCardPreview from './VoucherCardPreview';
import { CheckCircle2, Sparkles, Users, Compass, ShieldCheck, Plus, Minus } from 'lucide-react';

interface InteractiveProductSelectorProps {
  quantities: { individual: number; family: number; kids: number };
  onQuantityChange: (type: 'individual' | 'family' | 'kids', delta: number) => void;
}

export default function InteractiveProductSelector({
  quantities,
  onQuantityChange,
}: InteractiveProductSelectorProps) {
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'FAMILY' | 'KIDS'>('INDIVIDUAL');

  const productsData = {
    INDIVIDUAL: {
      ...LOCKED_VOUCHER_PRODUCTS.INDIVIDUAL,
      image: '/images/individual_experience.jpg',
      tagline: 'Ideal for Individual Employees & Star Performers',
      audience: '1 Adult Employee',
      bgGradient: 'from-forest-900/90 via-forest-900/80 to-transparent',
    },
    FAMILY: {
      ...LOCKED_VOUCHER_PRODUCTS.FAMILY,
      image: '/images/family_camping_retreat.jpg',
      tagline: 'Perfect for Family Recognition & Leadership Milestones',
      audience: '2 Adults + 1 Child',
      bgGradient: 'from-amber-950/90 via-forest-900/80 to-transparent',
    },
    KIDS: {
      ...LOCKED_VOUCHER_PRODUCTS.KIDS,
      image: '/images/kids_outdoor_adventure.jpg',
      tagline: 'Specialized Outdoor Camps for Employee Children',
      audience: '1 Child (Ages 6-16)',
      bgGradient: 'from-forest-950/90 via-forest-900/80 to-transparent',
    },
  };

  const currentProduct = productsData[activeTab];
  const currentQuantityKey = activeTab.toLowerCase() as 'individual' | 'family' | 'kids';
  const currentQty = quantities[currentQuantityKey];

  return (
    <div className="w-full my-12">
      {/* PRODUCT SWITCHER TABS */}
      <div className="flex justify-center mb-8">
        <div className="bg-sand-200/70 p-1.5 rounded-2xl border border-sand-300 flex items-center gap-2 max-w-xl w-full">
          <button
            onClick={() => setActiveTab('INDIVIDUAL')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-all relative ${
              activeTab === 'INDIVIDUAL'
                ? 'bg-forest-800 text-white shadow-lg'
                : 'text-forest-700 hover:text-forest-900 hover:bg-sand-100'
            }`}
          >
            Individual (₹4,000)
          </button>
          <button
            onClick={() => setActiveTab('FAMILY')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-all relative ${
              activeTab === 'FAMILY'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-forest-700 hover:text-forest-900 hover:bg-sand-100'
            }`}
          >
            Family (₹12,000)
          </button>
          <button
            onClick={() => setActiveTab('KIDS')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-all relative ${
              activeTab === 'KIDS'
                ? 'bg-forest-800 text-white shadow-lg'
                : 'text-forest-700 hover:text-forest-900 hover:bg-sand-100'
            }`}
          >
            Kids (₹7,000)
          </button>
        </div>
      </div>

      {/* DYNAMIC PRODUCT SHOWCASE CARD */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-forest-200 shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT IMAGERY & DETAILS PANEL */}
            <div className="lg:col-span-7 relative min-h-[440px] flex flex-col justify-between p-8 sm:p-10 text-white overflow-hidden rounded-t-3xl lg:rounded-tr-none lg:rounded-l-3xl">
              {/* Background Image with Gradient Overlay */}
              <Image
                src={currentProduct.image}
                alt={currentProduct.title}
                fill
                className="object-cover"
                priority
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${currentProduct.bgGradient}`} />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md border border-white/30 text-sand-50 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {currentProduct.tagline}
                </div>

                <h3 className="font-serif text-3xl sm:text-4xl font-bold text-sand-50 leading-tight">
                  {currentProduct.title}
                </h3>
                <p className="mt-2 text-sm text-sand-200 font-medium">
                  {currentProduct.subtitle} • <span className="text-amber-400 font-bold">{currentProduct.audience}</span>
                </p>
              </div>

              <div className="relative z-10 mt-8 space-y-4">
                <div className="bg-forest-950/70 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" /> Eligible Experience Modules
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-sand-100">
                    {currentProduct.optionsDescription.map((opt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{opt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div>
                    <span className="text-[11px] text-sand-300 uppercase font-semibold block">Voucher Price / Value</span>
                    <span className="font-serif text-3xl font-extrabold text-amber-400">
                      ₹{currentProduct.faceValue.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Quantity Counter Control */}
                  <div className="bg-white text-forest-900 p-2 rounded-2xl flex items-center gap-3 shadow-lg">
                    <span className="text-xs font-bold px-2">Order Quantity</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onQuantityChange(currentQuantityKey, -1)}
                        className="w-9 h-9 rounded-xl bg-sand-100 hover:bg-sand-200 border border-sand-300 flex items-center justify-center font-bold text-forest-900 transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <motion.span
                        key={currentQty}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="w-8 text-center font-bold text-base font-serif"
                      >
                        {currentQty}
                      </motion.span>
                      <button
                        onClick={() => onQuantityChange(currentQuantityKey, 1)}
                        className="w-9 h-9 rounded-xl bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center font-bold transition-all shadow-md"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT REALISTIC VOUCHER PREVIEW PANEL */}
            <div className="lg:col-span-5 bg-sand-100/70 p-6 sm:p-8 flex flex-col justify-center items-center border-t lg:border-t-0 lg:border-l border-forest-100 min-h-[480px]">
              <div className="text-center mb-2">
                <span className="text-[11px] font-bold text-forest-800 uppercase tracking-widest block">
                  Interactive Gift Voucher Certificate Preview
                </span>
                <span className="text-[10px] text-forest-600">
                  How employees will view their digital PDF voucher
                </span>
              </div>

              <VoucherCardPreview
                productCode={currentProduct.code}
                title={currentProduct.title}
                faceValue={currentProduct.faceValue}
                eligibleExperiences={currentProduct.eligibleExperiences}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
