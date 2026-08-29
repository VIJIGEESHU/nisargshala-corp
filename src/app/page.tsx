'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MultiStepOrderWizard from '@/components/MultiStepOrderWizard';
import CustomExperienceModal from '@/components/CustomExperienceModal';
import {
  Compass,
  Gift,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Trees,
  Users,
  MapPin,
  PhoneCall,
  CheckCircle2,
  Calendar,
  Mail,
  ShoppingBag,
  Package,
  Armchair,
  Tent,
  UserCheck,
  MessageSquare,
  Handshake,
  HeartHandshake,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToVouchers = () => {
    const element = document.getElementById('vouchers');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Can we order vouchers in bulk?',
      a: 'Yes, we support bulk orders for corporate teams of all sizes. The automated corporate gateway accommodates single or multi-denomination batches with unified GST invoicing and cryptographic ZIP voucher delivery.',
    },
    {
      q: 'Can employees choose their own dates?',
      a: 'Absolutely. Vouchers are valid for 12 months from the date of issue, and employees can choose any available weekend date that suits them best via our official redemption portal at nisargshala.in/redeem.',
    },
    {
      q: 'Do you provide GST invoices?',
      a: 'Yes, we provide 100% tax-compliant B2B GST invoices (18% SAC code 9984) for all corporate team bookings and voucher purchases with authoritative buyer & seller GSTIN validation.',
    },
    {
      q: 'What safety standards and instructor certifications are maintained?',
      a: 'All Nisargshala campsites and outdoor programs are led by certified mountaineering instructors, outdoor wilderness first responders, and trained safety personnel equipped with comprehensive emergency protocols.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAF7] text-[#1A1C1B] selection:bg-amber-100 selection:text-amber-800 text-sm">
      <Navbar />

      {/* 1. HERO SECTION - Balanced & Airy */}
      <section className="relative min-h-[75vh] flex items-center justify-center pt-16 pb-16 overflow-hidden bg-[#052219]">
        {/* Nature Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero_nature_camping.jpg"
            alt="Corporate team camping in nature"
            fill
            className="object-cover object-center opacity-35 mix-blend-luminosity scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#052219]/90 via-[#052219]/80 to-[#052219]" />
        </div>

        <div className="relative z-20 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-400/40 bg-white/10 text-amber-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Nisargshala Corporate Gateway
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-4xl mx-auto tracking-tight leading-tight drop-shadow-md"
          >
            Corporate experiences people actually remember.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-sm sm:text-base text-emerald-100/90 max-w-2xl mx-auto mb-8 font-normal leading-relaxed"
          >
            From team outings and leadership retreats to employee rewards and experience gifting, Nisargshala helps companies create meaningful experiences in nature.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Link
              href="/team-outings"
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold px-7 py-3 rounded-full text-xs shadow-lg transition-all flex items-center justify-center gap-2 group transform hover:-translate-y-0.5"
            >
              <Compass className="w-4 h-4 text-slate-950" />
              Plan a Team Outing
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={scrollToVouchers}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/25 px-7 py-3 rounded-full font-semibold text-xs backdrop-blur-md transition-all flex items-center justify-center gap-2 hover:border-amber-400/50"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              Explore Corporate Vouchers
            </button>
          </motion.div>

          {/* Trust Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 inline-flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-white/90 text-xs font-medium bg-black/40 backdrop-blur-md py-3 px-6 rounded-full border border-white/10"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>GST-compliant billing &amp; documentation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Certified outdoor instructors &amp; safety first</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Curated locations in Western Ghats &amp; Lakefronts</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. TWO PILLARS SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-block">
            Corporate Solutions
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#052219] tracking-tight">
            One partner. Multiple employee-engagement needs.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Choose between customized live team events or flexible experience gift certificates for your workforce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Team Outings */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="h-48 overflow-hidden relative">
                <Image
                  src="/images/family_camping_retreat.jpg"
                  alt="Team Outing & Nature Retreat"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-full p-2 flex items-center justify-center text-[#052219] shadow-sm">
                  <Compass className="w-4 h-4 text-emerald-800" />
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                    Live Facilitated Offsites
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="font-serif text-xl font-bold text-[#052219]">
                  Team Outings &amp; Nature Retreats
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bring your entire department or executive leadership team into nature. Wilderness camping, river crossing, obstacle modules, strategy sessions, and family outdoor days.
                </p>

                <ul className="space-y-2 text-xs text-slate-700 font-medium pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Team building &amp; adventure activities</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Leadership retreats &amp; strategy offsites</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Family days &amp; employee engagement events</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Custom programmes tailored for your team</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link
                href="/team-outings"
                className="w-full bg-[#052219] hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-full transition-all text-center flex items-center justify-center gap-2 group/btn shadow"
              >
                Explore Team Outings Packages &amp; Book
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Pillar 2: Corporate Vouchers */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 hover:border-amber-400/50 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="h-48 overflow-hidden relative bg-[#052219] flex items-center justify-center p-6">
                <Image
                  src="/images/hero_nature_camping.jpg"
                  alt="Voucher Background"
                  fill
                  className="object-cover opacity-20 mix-blend-overlay"
                />
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center text-white w-full max-w-xs shadow">
                  <Gift className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                  <div className="font-mono text-xs font-bold tracking-widest text-amber-300 mb-0.5">
                    NS-CORP-VOUCHER
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                    Authentic Corporate Experience Voucher
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="font-serif text-xl font-bold text-[#052219]">
                  Corporate Experience Vouchers
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bulk experience certificates for employee rewards, festival gifts, performance milestones, and client appreciation. Valid for 12 months with digital delivery.
                </p>

                <ul className="space-y-2 text-xs text-slate-700 font-medium pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Reward &amp; recognise performance with nature escapes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Engage families with shared camping experiences</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Valid for 12 months with flexible online redemption</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>100% Tax Invoice &amp; Automated Delivery Attachments</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={scrollToVouchers}
                className="w-full bg-[#052219] hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-full transition-all text-center flex items-center justify-center gap-2 group/btn shadow"
              >
                Order Corporate Vouchers Below ↓
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VOUCHER ORDER WIZARD SECTION (Integrated & Clean) */}
      <section id="vouchers" className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-100/60 border-y border-slate-200">
        <MultiStepOrderWizard />
      </section>

      {/* 4. HOW IT WORKS 5-STEP VISUAL JOURNEY */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full inline-block">
            Seamless Workflow
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#052219]">
            How Corporate Vouchers Work
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            From seamless corporate issuance to memorable employee experiences in nature.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm flex flex-col items-center group hover:border-amber-400 transition-all">
            <div className="w-10 h-10 bg-[#052219] text-amber-400 rounded-full flex items-center justify-center mb-3 shadow font-serif font-bold text-sm">
              1
            </div>
            <ShoppingBag className="w-5 h-5 text-emerald-800 mb-1.5" />
            <h4 className="font-serif font-bold text-[#052219] text-sm mb-1">Place Order</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select quantities and enter corporate details above.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm flex flex-col items-center group hover:border-amber-400 transition-all">
            <div className="w-10 h-10 bg-[#052219] text-amber-400 rounded-full flex items-center justify-center mb-3 shadow font-serif font-bold text-sm">
              2
            </div>
            <Package className="w-5 h-5 text-emerald-800 mb-1.5" />
            <h4 className="font-serif font-bold text-[#052219] text-sm mb-1">Voucher Issuance</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Branded PDF vouchers with secret codes &amp; tax invoice.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm flex flex-col items-center group hover:border-amber-400 transition-all">
            <div className="w-10 h-10 bg-[#052219] text-amber-400 rounded-full flex items-center justify-center mb-3 shadow font-serif font-bold text-sm">
              3
            </div>
            <Armchair className="w-5 h-5 text-emerald-800 mb-1.5" />
            <h4 className="font-serif font-bold text-[#052219] text-sm mb-1">Redeem Online</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Staff visit nisargshala.in/redeem and choose dates.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm flex flex-col items-center group hover:border-amber-400 transition-all">
            <div className="w-10 h-10 bg-[#052219] text-amber-400 rounded-full flex items-center justify-center mb-3 shadow font-serif font-bold text-sm">
              4
            </div>
            <Tent className="w-5 h-5 text-emerald-800 mb-1.5" />
            <h4 className="font-serif font-bold text-[#052219] text-sm mb-1">Experience Nature</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Wilderness camping hosted by certified outdoor mentors.
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm flex flex-col items-center group hover:border-amber-400 transition-all">
            <div className="w-10 h-10 bg-[#052219] text-amber-400 rounded-full flex items-center justify-center mb-3 shadow font-serif font-bold text-sm">
              5
            </div>
            <UserCheck className="w-5 h-5 text-emerald-800 mb-1.5" />
            <h4 className="font-serif font-bold text-[#052219] text-sm mb-1">Lasting Impact</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Teams return bonded, re-energized, and inspired.
            </p>
          </div>
        </div>
      </section>

      {/* 5. VALUE PROPOSITION & CLIENT REVIEWS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Left: 4 Outdoor Pillars */}
          <div className="lg:w-1/2 flex flex-col justify-center space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full">
                The Nature Advantage
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#052219] mt-2">
                Why take employee engagement outdoors?
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Nature creates an environment away from screen fatigue, routine desks, and corporate hierarchies. It opens the door to authentic human connection:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-1">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg w-fit">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#052219]">Better Communication</span>
                <span className="text-[11px] text-slate-500">Unfiltered conversations by campfire</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-1">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg w-fit">
                  <Handshake className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#052219]">Stronger Collaboration</span>
                <span className="text-[11px] text-slate-500">Problem-solving outdoor challenges</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-1">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg w-fit">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#052219]">Deeper Connections</span>
                <span className="text-[11px] text-slate-500">Bonding among colleagues &amp; families</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col space-y-1">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg w-fit">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#052219]">More Clarity &amp; Focus</span>
                <span className="text-[11px] text-slate-500">Fresh perspective for strategic thinking</span>
              </div>
            </div>
          </div>

          {/* Right: Testimonial Card featuring Abhiyanta Pvt Ltd & Catalyst Solution Pvt Ltd */}
          <div className="lg:w-1/2 bg-[#052219] text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col justify-between border border-emerald-800/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-amber-400 border border-white/15">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Verified Corporate Testimonials
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Trusted by companies that value authentic experiences
              </h3>

              {/* Review 1: Abhiyanta Pvt Ltd */}
              <div className="border-l-2 border-amber-400 pl-3.5 py-0.5 space-y-1">
                <p className="text-xs sm:text-sm text-emerald-100/95 italic leading-relaxed">
                  &ldquo;We were looking for something different from the usual employee rewards. Nisargshala gave our employees an experience they genuinely appreciated. The team outing was extremely well organised. Our team came back more connected and energised.&rdquo;
                </p>
                <p className="text-[11px] font-bold text-amber-300">
                  — HR Manager, Abhiyanta Pvt Ltd
                </p>
              </div>

              {/* Review 2: Catalyst Solution Pvt Ltd */}
              <div className="border-l-2 border-amber-400 pl-3.5 py-0.5 space-y-1 pt-1">
                <p className="text-xs sm:text-sm text-emerald-100/95 italic leading-relaxed">
                  &ldquo;Our family day at Nisargshala was a huge hit. The kids had a fantastic time and so did the parents.&rdquo;
                </p>
                <p className="text-[11px] font-bold text-amber-300">
                  — HR Head, Catalyst Solution Pvt Ltd
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-4 mt-4 border-t border-emerald-800/80 flex items-center justify-between text-[11px] text-emerald-200/80">
              <span>Western Ghats • Pawna Lake • Panchgani</span>
              <span className="font-bold text-amber-400">100% Verified Outcomes</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQS FOR HR ACCORDION SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full inline-block">
            Frequently Asked Questions
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#052219]">
            FAQs for HR &amp; Corporate Leaders
          </h2>
          <p className="text-xs text-slate-600">
            Everything you need to know about booking team outings and issuing gift vouchers.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center text-left font-serif font-bold text-sm sm:text-base p-4 sm:p-5 text-[#052219] hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-300 shrink-0 ml-3 ${
                      isOpen ? 'rotate-180 text-amber-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. CUSTOM CORPORATE PROPOSAL CTA BANNER */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center w-full mb-12">
        <div className="bg-[#052219] text-white rounded-2xl p-6 sm:p-10 shadow-xl space-y-4 border border-emerald-800 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <h3 className="text-xl sm:text-3xl font-serif font-bold text-amber-400">
              Have Something Specific in Mind?
            </h3>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Whether you are organizing an annual company day out, large headcount multi-day itinerary, or executive retreat facilities, our corporate team will curate your experience.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setCustomModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-full transition-all shadow transform hover:-translate-y-0.5"
              >
                Plan a Custom Corporate Experience
              </button>
              <a
                href="tel:+919049002053"
                className="bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs px-5 py-2.5 rounded-full border border-emerald-700 transition-all flex items-center gap-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" /> Call +91 90490 02053
              </a>
            </div>
          </div>
        </div>
      </section>

      <CustomExperienceModal isOpen={customModalOpen} onClose={() => setCustomModalOpen(false)} />
      <Footer />
    </div>
  );
}


