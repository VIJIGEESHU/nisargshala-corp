'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
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
          login_type: 'admin',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid admin credentials.');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing into admin portal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-forest-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
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
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Nisargshala Admin Operations Portal
          </div>
          <h1 className="font-serif text-2xl font-bold text-forest-950">
            Administrator Sign In
          </h1>
          <p className="text-xs text-forest-700">
            Enter your authorized Nisargshala administrator credentials to continue.
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
            <label className="block text-forest-950 font-semibold mb-1">Admin Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="admin@nisargshala.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-forest-950 font-semibold mb-1">Admin Password *</label>
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
            className="w-full bg-forest-900 hover:bg-forest-950 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating Admin...' : 'Authenticate & Open Control Panel'}
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </form>
      </div>
    </div>
  );
}
