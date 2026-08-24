import Image from 'next/image';
import Link from 'next/link';
import { Check, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A2B1B] text-white pt-16 pb-8 border-t border-[#133D29]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#1A4730]">
          {/* COLUMN 1: BRAND LOGO & STATEMENT */}
          <div className="md:col-span-5 space-y-5">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 p-1 border border-white/20">
              <Image
                src="/images/nisargshala-logo.png"
                alt="Nisargshala Logo"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-sand-200 leading-relaxed max-w-md font-normal">
              Empowering families and young explorers through masterfully curated, safe, and highly transformative nature immersion programming across spectacular wilderness spaces.
            </p>
          </div>

          {/* COLUMN 2: QUICK LINKS */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-serif font-bold text-amber-500 text-base">Quick Links</h4>
            <ul className="space-y-3 text-xs text-sand-200 font-medium">
              <li>
                <a href="https://nisargshala.in/privacy-policy" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://nisargshala.in/events" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Camp Schedules
                </a>
              </li>
              <li>
                <a href="https://nisargshala.in" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Safety Protocols
                </a>
              </li>
              <li>
                <a href="https://nisargshala.in" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Cancellation Policy
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: RESOURCES */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="font-serif font-bold text-amber-500 text-base">Resources</h4>
            <ul className="space-y-3 text-xs text-sand-200 font-medium">
              <li>
                <a href="https://nisargshala.in" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Packing Checklist
                </a>
              </li>
              <li>
                <a href="https://nisargshala.in/gallery" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Camp Gallery
                </a>
              </li>
              <li>
                <a href="https://nisargshala.in" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Parent Testimonials
                </a>
              </li>
              <li>
                <a href="https://nisargshala.in/articles" target="_blank" className="hover:text-amber-400 transition-colors flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-forest-400 shrink-0" /> Blogs & Articles
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: CONTACT US */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-serif font-bold text-amber-500 text-base">Contact Us</h4>
            <div className="space-y-2 text-xs text-sand-200">
              <p className="hover:text-amber-400 transition-colors cursor-pointer">hemant@nisargshala.in</p>
              <p className="hover:text-amber-400 transition-colors cursor-pointer">+91 90490 02053</p>
              <p className="text-sand-300">Pune, Maharashtra, India</p>
            </div>

            {/* Social Media Icons in Green Boxes */}
            <div className="flex items-center space-x-2 pt-2">
              <a href="https://facebook.com" target="_blank" className="p-2 bg-[#1A4730] hover:bg-forest-600 rounded text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" className="p-2 bg-[#1A4730] hover:bg-forest-600 rounded text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" className="p-2 bg-[#1A4730] hover:bg-forest-600 rounded text-white transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" className="p-2 bg-[#1A4730] hover:bg-forest-600 rounded text-white transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT BAR */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-sand-300 gap-4">
          <div>
            © 2026 <strong className="text-white font-bold">Nisargshala</strong>. All Rights Reserved.
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <a href="https://nisargshala.in/privacy-policy" target="_blank" className="hover:text-white flex items-center gap-1">
              <Check className="w-3 h-3 text-forest-400" /> Privacy Policy
            </a>
            <a href="https://nisargshala.in" target="_blank" className="hover:text-white flex items-center gap-1">
              <Check className="w-3 h-3 text-forest-400" /> Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
