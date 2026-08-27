'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Compass, Gift, ExternalLink, User, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated) {
        setSession(data.user);
      } else {
        setSession(null);
      }
    } catch (e) {
      setSession(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    setMenuOpen(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#062018] text-white border-b border-emerald-900/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-white/10 p-1 border border-emerald-700/50">
              <Image
                src="/images/nisargshala-logo.png"
                alt="Nisargshala Official Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-wider text-white block leading-none">
                Nisargshala
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mt-1">
                Corporate Gateway
              </span>
            </div>
          </Link>

          {/* CENTER NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-bold uppercase tracking-wider">
            <Link
              href="/team-outings"
              className="text-emerald-100 hover:text-amber-400 transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-amber-400"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Team Outings & Retreats
            </Link>
            <Link
              href="/#vouchers"
              className="text-emerald-100 hover:text-amber-400 transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-amber-400"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              Corporate Vouchers
            </Link>
            <Link
              href="/redeem-guide"
              className="text-emerald-100 hover:text-amber-400 transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-amber-400"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Redemption Guide
            </Link>
            <a
              href="https://nisargshala.in"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] normal-case"
            >
              Main Retail Site <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* RIGHT PROFILE MENU / AUTH */}
          <div className="relative">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 bg-[#03140F] hover:bg-emerald-950 border border-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm"
                >
                  <div className="p-1 rounded-full bg-emerald-700 text-white">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-amber-300 truncate max-w-[120px]">
                      {session.company?.company_name || 'Corporate Account'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* DROPDOWN MENU */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#062018] rounded-2xl shadow-2xl border border-emerald-800 py-3 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-emerald-900/80 mb-1">
                      <div className="font-bold text-amber-400 truncate">{session.company?.company_name}</div>
                      <div className="text-emerald-300/80 truncate text-[11px]">{session.email}</div>
                    </div>

                    <Link
                      href="/team-outings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-emerald-900/60 text-white font-semibold"
                    >
                      <Compass className="w-4 h-4 text-amber-400" /> Team Outings
                    </Link>

                    <Link
                      href="/#vouchers"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-emerald-900/60 text-white font-semibold"
                    >
                      <Gift className="w-4 h-4 text-amber-400" /> Corporate Vouchers
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 hover:bg-red-950/60 text-red-400 font-semibold border-t border-emerald-900/80 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-red-400" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-700 to-amber-600 hover:from-emerald-600 hover:to-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all"
              >
                <User className="w-4 h-4" />
                <span>Corporate Account</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
