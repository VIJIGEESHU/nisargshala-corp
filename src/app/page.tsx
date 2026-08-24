'use client';

import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MultiStepOrderWizard from '@/components/MultiStepOrderWizard';
import CorporateValueProp from '@/components/CorporateValueProp';
import HowItWorksSection from '@/components/HowItWorksSection';
import { Sparkles, ShieldCheck, ArrowDown, Trees, Lock, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const scrollToWizard = () => {
    const element = document.getElementById('order-wizard');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-amber-100 selection:text-amber-800">
      <Navbar />

      {/* CINEMATIC HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-white overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <Image
          src="/images/hero_nature_camping.jpg"
          alt="Nisargshala Luxury Outdoor Camping"
          fill
          className="object-cover object-center transform scale-105 transition-transform duration-10000 ease-out"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 via-forest-950/75 to-forest-900/60" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 text-center sm:text-left">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-400 mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Official Nisargshala Corporate Gift Voucher Program
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold text-sand-50 leading-[1.1]"
            >
              Reward People With Experiences They'll Remember.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-base sm:text-xl text-sand-200 font-normal leading-relaxed max-w-2xl"
            >
              Enable corporate HR and Admin teams to bulk-purchase outdoor tent camping, family retreats, and specialized kids adventure camp vouchers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4"
            >
              <button
                onClick={scrollToWizard}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group"
              >
                Order Corporate Vouchers
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </button>

              <a
                href="/redeem-guide"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-sm backdrop-blur-md transition-all text-center"
              >
                View Redemption Guide
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-12 flex flex-wrap items-center gap-6 text-xs text-sand-300 font-medium"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> 12 Months Expiry
              </span>
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" /> RTGS / NEFT Workflow
              </span>
              <span className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" /> Digital PDF Delivery
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CORPORATE VALUE PROPOSITION SECTION */}
      <CorporateValueProp />

      {/* INTERACTIVE MULTI-STEP ORDER WIZARD SECTION */}
      <section className="py-12">
        <MultiStepOrderWizard />
      </section>

      {/* HOW IT WORKS STORYTELLING SECTION */}
      <HowItWorksSection />

      <Footer />
    </div>
  );
}
