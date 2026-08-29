'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TeamOutingBookingWizard from '@/components/TeamOutingBookingWizard';
import CustomExperienceModal from '@/components/CustomExperienceModal';
import { Compass, Users, MapPin, ShieldCheck, Sparkles, PhoneCall, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
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

  const packageImages: Record<string, string> = {
    WILDERNESS_BONDING: '/images/hero_nature_camping.jpg',
    LEADERSHIP_RETREAT: '/images/individual_experience.jpg',
    CORPORATE_FAMILY_DAY: '/images/family_camping_retreat.jpg',
  };

  return (
    <div className="min-h-screen bg-[#F9FAF7] text-[#1A1C1B] flex flex-col selection:bg-amber-100 selection:text-amber-800">
      <Navbar />

      {/* HERO BANNER */}
      <section className="relative bg-[#052219] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero_nature_camping.jpg"
            alt="Nisargshala Corporate Team Outings"
            fill
            className="object-cover opacity-25 mix-blend-luminosity scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#052219]/90 via-[#052219]/80 to-[#052219]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/40 bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" /> Curated Team Outings
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-tight">
            Corporate Team Outings &amp; <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
              Nature Immersion Retreats
            </span>
          </h1>
          <p className="text-base md:text-xl text-emerald-100/90 max-w-3xl mx-auto font-normal leading-relaxed">
            From wilderness team bonding and executive leadership retreats to corporate family adventure days, Nisargshala helps companies build cohesion in nature.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollToWizard('WILDERNESS_BONDING')}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm px-8 py-3.5 rounded-full shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4" /> Book a Team Outing
            </button>
            <button
              onClick={() => setCustomModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-8 py-3.5 rounded-full border border-white/25 backdrop-blur-md transition-all"
            >
              Planning Something Different?
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED EXPERIENCE PACKAGES */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-4 py-1.5 rounded-full inline-block">
            Tailored Itineraries
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#052219]">Curated Corporate Experiences</h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Choose from our professionally facilitated outdoor programs designed for modern team bonding and strategy offsites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DEFAULT_OUTING_PACKAGES.map((pkg) => (
            <div
              key={pkg.package_code}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-2xl transition-all space-y-0 flex flex-col justify-between group"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={packageImages[pkg.package_code] || '/images/hero_nature_camping.jpg'}
                  alt={pkg.package_title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-bold text-amber-300 bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                    Min {pkg.minimum_attendees} Pax
                  </span>
                </div>
                <div className="absolute bottom-3 left-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-900/80 text-emerald-100 backdrop-blur-md px-3 py-1 rounded-full">
                    {pkg.category.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-7 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xl font-serif font-bold text-[#052219]">{pkg.package_title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{pkg.description}</p>

                  <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 font-medium">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{pkg.location}</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Professional Facilitators &amp; Instructors Included</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 border border-slate-100">
                    <span className="font-bold text-slate-800 block">Package Inclusions:</span>
                    <ul className="grid grid-cols-1 gap-1.5 text-slate-600">
                      {pkg.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-medium">Price per person:</span>
                    <span className="text-2xl font-bold font-serif text-[#052219]">
                      ₹{pkg.base_price.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal font-sans text-slate-500">+ 18% GST</span>
                    </span>
                  </div>

                  <button
                    onClick={() => scrollToWizard(pkg.package_code)}
                    className="w-full bg-[#052219] hover:bg-emerald-900 text-white font-bold text-xs py-3.5 rounded-full transition-all text-center flex items-center justify-center gap-2"
                  >
                    Select &amp; Request Dates <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EMBEDDED 4-STEP BOOKING WIZARD */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FDF9F5] border-y border-slate-200">
        <TeamOutingBookingWizard initialPackageCode={selectedPkg} />
      </section>

      {/* CUSTOM ENQUIRY BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <div className="bg-[#052219] text-white rounded-3xl p-8 sm:p-12 shadow-2xl space-y-4 border border-emerald-800 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl sm:text-4xl font-serif font-bold text-amber-400">
              Planning Something Different for Your Team?
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mx-auto leading-relaxed">
              Need custom dates, specialized multi-day itineraries, large headcount accommodation, or specific adventure modules? Our corporate team will curate a tailored proposal.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setCustomModalOpen(true)}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm px-8 py-3.5 rounded-full transition-all shadow-lg transform hover:-translate-y-0.5"
              >
                Submit Custom Request
              </button>
              <a
                href="tel:+919049002053"
                className="bg-emerald-950 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-full border border-emerald-700 transition-all flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-amber-400" /> Call +91 90490 02053
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

