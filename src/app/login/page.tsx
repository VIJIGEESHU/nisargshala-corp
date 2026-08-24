'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Lock, ArrowRight, AlertCircle, Building2, ShieldCheck } from 'lucide-react';

export default function CorporateLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          login_type: 'corporate',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      router.push('/corporate');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-forest-200 p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-forest-600/30 bg-white mx-auto shadow-md">
              <Image
                src="/images/nisargshala-logo.png"
                alt="Nisargshala Logo"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <h1 className="font-serif text-2xl font-bold text-forest-950">
              Corporate HR Portal Login
            </h1>
            <p className="text-xs text-forest-700">
              Sign in to manage your company's voucher orders, payments, and employee assignments.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-forest-950 font-semibold mb-1">Corporate Work Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="hr@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-forest-950 font-semibold mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-forest-800 hover:bg-forest-900 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In to Corporate Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* DEMO / TEST CREDENTIALS HINT */}
          <div className="bg-sand-100 p-4 rounded-xl border border-sand-200 text-[11px] text-forest-800 space-y-1">
            <strong className="text-forest-950 block">Initial Corporate HR Credentials:</strong>
            <div>Email: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">hr@acme.in</code></div>
            <div>Password: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">Acme2026</code></div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
