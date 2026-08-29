'use client';

import { useState } from 'react';
import Image from 'next/image';
import { LOCKED_VOUCHER_PRODUCTS } from '@/lib/pricing';
import { CheckCircle2, User, Baby, SmilePlus, Plus, Minus, Eye, Sparkles } from 'lucide-react';
import VoucherCardPreview from './VoucherCardPreview';

interface InteractiveProductSelectorProps {
  quantities: { individual: number; family: number; kids: number };
  onQuantityChange: (type: 'individual' | 'family' | 'kids', delta: number) => void;
}

export default function InteractiveProductSelector({
  quantities,
  onQuantityChange,
}: InteractiveProductSelectorProps) {
  const [previewProduct, setPreviewProduct] = useState<'INDIVIDUAL' | 'FAMILY' | 'KIDS' | null>(null);

  const products = [
    {
      key: 'individual' as const,
      code: 'INDIVIDUAL' as const,
      data: LOCKED_VOUCHER_PRODUCTS.INDIVIDUAL,
      image: '/images/individual_experience.jpg',
      icon: User,
      iconBg: 'bg-emerald-100 text-emerald-800',
      tag: 'Solo / Performance Reward',
      audience: '1 Adult Employee',
      price: 4000,
      features: [
        'Ideal for performance rewards & spot recognition',
        'Long-service milestone awards',
        'Overnight lakeside tent & outdoor meals',
      ],
    },
    {
      key: 'kids' as const,
      code: 'KIDS' as const,
      data: LOCKED_VOUCHER_PRODUCTS.KIDS,
      image: '/images/kids_outdoor_adventure.jpg',
      icon: Baby,
      iconBg: 'bg-amber-100 text-amber-800',
      tag: 'Youth Outdoor Camps',
      audience: '1 Child (Ages 6-16)',
      price: 7000,
      features: [
        'Children’s Day & family wellness programs',
        'Specialized Huppya & Sahas youth camps',
        'Outdoor obstacle courses & nature learning',
      ],
    },
    {
      key: 'family' as const,
      code: 'FAMILY' as const,
      data: LOCKED_VOUCHER_PRODUCTS.FAMILY,
      image: '/images/family_camping_retreat.jpg',
      icon: SmilePlus,
      iconBg: 'bg-emerald-100 text-emerald-900',
      tag: 'Family Engagement',
      audience: '2 Adults + 1 Child',
      price: 12000,
      features: [
        'Festive rewards & major career milestones',
        'Eligible for Kutuhal Family Camp stays',
        'Campfire, stargazing, meals & lake sports',
      ],
    },
  ];

  return (
    <div className="w-full">
      {/* 3-CARD COMPACT SELECTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => {
          const Icon = p.icon;
          const qty = quantities[p.key];
          const isSelected = qty > 0;

          return (
            <div
              key={p.key}
              className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-[#052219] ring-2 ring-[#052219]/20 shadow-lg'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Image Header */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <Image
                    src={p.image}
                    alt={p.data.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                      {p.tag}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewProduct(p.code)}
                    className="absolute top-2.5 right-2.5 bg-white/80 hover:bg-white text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-md shadow flex items-center gap-1 transition-all"
                  >
                    <Eye className="w-3 h-3 text-emerald-700" /> Preview
                  </button>

                  <div className="absolute bottom-2.5 left-3 text-white">
                    <span className="text-xs text-emerald-200 font-medium">{p.audience}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${p.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#052219] leading-tight">
                        {p.data.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="font-serif text-2xl font-bold text-[#052219]">
                      ₹{p.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">/ voucher (+ 18% GST)</span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Select Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onQuantityChange(p.key, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center font-bold text-sm font-serif text-[#052219]">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(p.key, 1)}
                    className="w-8 h-8 rounded-lg bg-[#052219] hover:bg-emerald-900 text-amber-400 font-bold flex items-center justify-center transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PREVIEW IF USER CLICKS "PREVIEW" */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="font-serif font-bold text-base text-[#052219]">
                  Digital Certificate Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <VoucherCardPreview
              productCode={previewProduct}
              title={LOCKED_VOUCHER_PRODUCTS[previewProduct].title}
              faceValue={LOCKED_VOUCHER_PRODUCTS[previewProduct].faceValue}
              eligibleExperiences={LOCKED_VOUCHER_PRODUCTS[previewProduct].eligibleExperiences}
            />

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="bg-[#052219] text-white text-xs font-bold px-6 py-2 rounded-full"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

