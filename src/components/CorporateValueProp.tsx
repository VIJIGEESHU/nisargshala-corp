'use client';

import { motion } from 'framer-motion';
import { Award, HeartHandshake, Sparkles, Gift, Sun, Users, Flame } from 'lucide-react';

export default function CorporateValueProp() {
  const valueProps = [
    {
      icon: Award,
      title: 'Star Employee Recognition',
      description: 'Replace generic plaques and cash coupons with a peaceful overnight camping retreat under starry skies.',
      tag: 'Performance Rewards',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      icon: HeartHandshake,
      title: 'Family & Milestone Celebrations',
      description: 'Reward long-service milestones (5, 10 years) with Kutuhal Family experiences for 2 Adults & 1 Child.',
      tag: 'Career Milestones',
      color: 'bg-forest-100 text-forest-800 border-forest-300',
    },
    {
      icon: Gift,
      title: 'Festive & Annual Gifting',
      description: 'Diwali and New Year corporate gifting that employees remember and cherish forever with their loved ones.',
      tag: 'Festive Gifting',
      color: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      icon: Sun,
      title: 'Child & Youth Adventure',
      description: 'Demonstrate holistic family care by gifting specialized kids outdoor adventure camps (Huppya & Sahas).',
      tag: 'Family Wellness',
      color: 'bg-forest-100 text-forest-800 border-forest-300',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-sand-50 to-sand-100 border-y border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-forest-100 text-forest-800 mb-3 border border-forest-200">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            Why Experience Gifting Beats Conventional Corporate Gifts
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-900 leading-tight">
            Memories Stay Forever. Generic Coupons Get Forgotten.
          </h2>
          <p className="mt-4 text-sm text-forest-700 leading-relaxed">
            Conventional corporate gifts sit in drawers. Nisargshala outdoor experiences recharge minds, connect families, and create lifelong stories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {valueProps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white rounded-3xl p-8 border border-forest-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3.5 bg-forest-800 text-amber-400 rounded-2xl shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.color}`}>
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-forest-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-xs text-forest-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-sand-100 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 12 Months Validity Included
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
