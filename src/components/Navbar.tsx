'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShoppingBag, Building2, ExternalLink, User, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 text-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center space-x-3.5 group">
            <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
              <Image
                src="/images/nisargshala-logo.png"
                alt="Nisargshala Official Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="font-serif font-bold text-xl tracking-wider text-forest-950 block leading-none">
                Nisargshala
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-forest-700 block mt-0.5">
                Corporate Vouchers
              </span>
            </div>
          </Link>

          {/* CENTER NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-gray-700">
            <Link
              href="/"
              className="hover:text-forest-800 transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-forest-800"
            >
              <ShoppingBag className="w-4 h-4 text-forest-800" />
              Corporate Products
            </Link>
            <Link
              href="/corporate"
              className="hover:text-forest-800 transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-forest-800"
            >
              <Building2 className="w-4 h-4 text-forest-800" />
              HR Dashboard
            </Link>
            <Link
              href="/redeem-guide"
              className="hover:text-forest-800 transition-colors flex items-center gap-1.5 py-2 border-b-2 border-transparent hover:border-forest-800"
            >
              <ShieldCheck className="w-4 h-4 text-forest-800" />
              Redemption Guide
            </Link>
            <a
              href="https://nisargshala.in"
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 hover:text-forest-800 transition-colors flex items-center gap-1 text-xs"
            >
              Main Retail Site <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* FUNCTIONAL TOP-RIGHT PROFILE MENU */}
          <div className="relative">
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 bg-sand-100 hover:bg-sand-200 border border-sand-300 px-3.5 py-2 rounded-xl text-xs font-semibold text-forest-950 transition-all shadow-sm"
                >
                  <div className="p-1 rounded-full bg-forest-800 text-white">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-forest-950 truncate max-w-[120px]">
                      {session.company?.company_name || 'Corporate HR'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-forest-600" />
                </button>

                {/* DROPDOWN MENU */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <div className="font-bold text-forest-950 truncate">{session.company?.company_name}</div>
                      <div className="text-gray-500 truncate text-[11px]">{session.email}</div>
                    </div>

                    <Link
                      href="/corporate"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-sand-50 text-gray-800 font-semibold"
                    >
                      <Building2 className="w-4 h-4 text-forest-800" /> HR Dashboard
                    </Link>

                    <Link
                      href="/corporate#orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-sand-50 text-gray-800 font-semibold"
                    >
                      <ShoppingBag className="w-4 h-4 text-forest-800" /> Order History
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 hover:bg-red-50 text-red-700 font-semibold border-t border-gray-100 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-red-600" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 bg-forest-800 hover:bg-forest-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                <User className="w-4 h-4" />
                <span>Corporate Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
