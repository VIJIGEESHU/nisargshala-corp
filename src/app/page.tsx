'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MultiStepOrderWizard from '@/components/MultiStepOrderWizard';
import CustomExperienceModal from '@/components/CustomExperienceModal';
import { Compass, Gift, Sparkles, ShieldCheck, ArrowRight, Trees, Users, MapPin, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const scrollToVouchers = () => {
    const element = document.getElementById('vouchers');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF9F5] text-slate-900 selection:bg-amber-100 selection:text-amber-800">
      <Navbar />

      {/* GATEWAY HERO SECTION */}
      <section className="relative min-h-[88vh] flex items-center justify-center text-white overflow-hidden bg-[#062018]">
        {/* Background Image with Overlay */}
        <Image
          src="/images/hero_nature_camping.jpg"
          alt="Nisargshala Corporate Nature Immersion"
          fill
          className="object-cover object-center opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#062018]/95 via-[#062018]/80 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24 text-center sm:text-left">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-400 mb-6"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Nisargshala Corporate Gateway
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1]"
            >
              Corporate experiences people actually remember.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-xl text-emerald-100/90 font-light leading-relaxed max-w-2xl"
            >
              From team outings and leadership retreats to employee rewards and experience gifting, Nisargshala helps companies create meaningful experiences in nature.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-4"
            >
              <Link
                href="/team-outings"
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-slate-950 px-8 py-4 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 group"
              >
                <Compass className="w-4 h-4 text-slate-950" />
                Plan a Team Outing
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={scrollToVouchers}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-sm backdrop-blur-md transition-all flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                Explore Corporate Vouchers
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-12 flex flex-wrap items-center gap-6 text-xs text-emerald-200/80 font-medium"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Mandatory Seller & Buyer GSTIN
              </span>
              <span className="flex items-center gap-2">
                <Trees className="w-4 h-4 text-amber-400" /> Western Ghats & Lakefront Sites
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Certified Outdoor Instructors
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TWO PRIMARY BUSINESS JOURNEYS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#062018]">
            Two Pillars of Corporate Experiences
          </h2>
          <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto">
            Choose between customized live team events or flexible experience gift certificates for your workforce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* JOURNEY A: TEAM OUTINGS */}
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-md hover:shadow-xl transition-all space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">Journey A</span>
              <h3 className="text-2xl font-serif font-bold text-[#062018]">Team Outings & Nature Retreats</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bring your entire department or executive leadership team into nature. Wilderness camping, river crossing, obstacle modules, strategy sessions, and family outdoor days.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Minimum 10 Participants per Booking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Western Ghats, Pawna Lake & Panchgani
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Authoritative Server Pricing & 18% GST
                </li>
              </ul>
            </div>

            <Link
              href="/team-outings"
              className="bg-[#062018] hover:bg-emerald-900 text-white font-bold text-xs py-3.5 rounded-xl transition-all text-center block"
            >
              Explore Team Outings Packages & Book →
            </Link>
          </div>

          {/* JOURNEY B: CORPORATE VOUCHERS */}
          <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-md hover:shadow-xl transition-all space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block">Journey B</span>
              <h3 className="text-2xl font-serif font-bold text-[#062018]">Corporate Experience Vouchers</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bulk experience certificates for employee rewards, festival gifts, performance milestones, and client appreciation. Valid for 12 months with digital ZIP delivery.
              </p>
              <ul className="space-y-2 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Individual, Family & Kids Adventure Modules
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> 100% Tax Invoice & Delivery Attachments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span> Easy Online Redemption at nisargshala.in/redeem
                </li>
              </ul>
            </div>

            <button
              onClick={scrollToVouchers}
              className="bg-[#062018] hover:bg-emerald-900 text-white font-bold text-xs py-3.5 rounded-xl transition-all text-center block"
            >
              Order Corporate Vouchers Below ↓
            </button>
          </div>
        </div>
      </section>

      {/* CORPORATE VOUCHERS ORDER WIZARD SECTION */}
      <section id="vouchers" className="py-12 bg-slate-900/5">
        <MultiStepOrderWizard />
      </section>

      {/* CUSTOM CORPORATE EXPERIENCE CTA BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="bg-[#062018] text-white rounded-3xl p-8 md:p-12 shadow-2xl space-y-4 border border-emerald-800">
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-amber-400">
            Have Something Specific in Mind?
          </h3>
          <p className="text-xs md:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Whether you are organizing an annual company day out or require tailored executive retreat facilities, our corporate team will curate your experience.
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setCustomModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-lg"
            >
              Plan a Custom Corporate Experience
            </button>
            <a
              href="tel:+919049002053"
              className="bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs px-6 py-3 rounded-xl border border-emerald-800 transition-all flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-amber-400" /> Call +91 90490 02053
            </a>
          </div>
        </div>
      </section>

      <CustomExperienceModal isOpen={customModalOpen} onClose={() => setCustomModalOpen(false)} />
      <Footer />
    </div>
  );
}
