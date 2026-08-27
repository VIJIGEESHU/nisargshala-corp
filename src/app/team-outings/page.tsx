'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TeamOutingBookingWizard from '@/components/TeamOutingBookingWizard';
import CustomExperienceModal from '@/components/CustomExperienceModal';
import { Compass, Users, MapPin, ShieldCheck, Sparkles, PhoneCall, Calendar } from 'lucide-react';
import { DEFAULT_OUTING_PACKAGES } from '@/lib/pricing';

export default function TeamOutingsPage() {
  const [selectedPkg, setSelectedPkg] = useState('WILDERNESS_BONDING');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const scrollToWizard = (pkgCode: string) => {
    setSelectedPkg(pkgCode);
    const elem = document.getElementById('booking-wizard');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F5] text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* HERO BANNER */}
      <section className="relative bg-[#062018] text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#a5f4bc_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-900/60 border border-emerald-700/60 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4" /> Official Corporate Gateway
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight leading-tight">
            Corporate Team Outings & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-300 to-amber-500">
              Nature Immersion Retreats
            </span>
          </h1>
          <p className="text-base md:text-xl text-emerald-100/90 max-w-3xl mx-auto font-light leading-relaxed">
            From wilderness team bonding and executive leadership retreats to corporate family adventure days, Nisargshala helps companies build cohesion in nature.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollToWizard('WILDERNESS_BONDING')}
              className="bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-slate-950 font-bold text-sm px-8 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Book a Team Outing
            </button>
            <button
              onClick={() => setCustomModalOpen(true)}
              className="bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-sm px-8 py-3.5 rounded-xl border border-emerald-800 transition-all"
            >
              Planning Something Different?
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED EXPERIENCE PACKAGES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-bold text-[#062018]">Curated Corporate Experiences</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Choose from our professionally facilitated outdoor programs designed for modern team bonding and strategy offsites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DEFAULT_OUTING_PACKAGES.map((pkg) => (
            <div
              key={pkg.package_code}
              className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-md hover:shadow-xl transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                    {pkg.category.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                    Min {pkg.minimum_attendees} Pax
                  </span>
                </div>

                <h3 className="text-xl font-serif font-bold text-[#062018]">{pkg.package_title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{pkg.description}</p>

                <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 font-medium">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{pkg.location}</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Professional Facilitators & Instructors Included</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1.5">
                  <span className="font-bold text-slate-800 block">Package Inclusions:</span>
                  <ul className="grid grid-cols-1 gap-1 text-slate-600">
                    {pkg.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-600">✓</span> {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-medium">Price per person:</span>
                  <span className="text-xl font-bold font-serif text-[#062018]">
                    ₹{pkg.base_price.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-slate-500">+ 18% GST</span>
                  </span>
                </div>

                <button
                  onClick={() => scrollToWizard(pkg.package_code)}
                  className="w-full bg-[#062018] hover:bg-emerald-900 text-white font-bold text-xs py-3 rounded-xl transition-all text-center"
                >
                  Select & Request Dates
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EMBEDDED 4-STEP BOOKING WIZARD */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900/5">
        <TeamOutingBookingWizard initialPackageCode={selectedPkg} />
      </section>

      {/* CUSTOM ENQUIRY BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <div className="bg-gradient-to-r from-[#062018] to-emerald-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl space-y-4 border border-emerald-800">
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-amber-400">
            Planning Something Different for Your Team?
          </h3>
          <p className="text-xs md:text-sm text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Need custom dates, specialized multi-day itineraries, large headcount accommodation, or specific adventure modules? Our corporate team will curate a tailored proposal.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setCustomModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-lg"
            >
              Submit Custom Request
            </button>
            <a
              href="tel:+919049002053"
              className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-3 rounded-xl border border-emerald-700 transition-all flex items-center gap-2"
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
