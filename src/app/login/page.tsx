'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Lock, ArrowRight, AlertCircle, Building2, User, Phone, CheckCircle2, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function CorporateLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regForm, setRegForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    mobile: '',
    password: '',
  });

  // Forgot Password State
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create corporate account.');
      }

      setSuccessMsg('Corporate HR account created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/corporate');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_otp',
          email: resetEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send verification code.');
      }

      setSuccessMsg(data.message || 'Verification code sent to email!');
      setResetStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error requesting verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          email: resetEmail,
          otp_code: otpCode,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Verification failed. Invalid code.');
      }

      setSuccessMsg(data.message || 'Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        setActiveTab('login');
        setEmail(resetEmail);
        setPassword(newPassword);
        setResetStep(1);
        setOtpCode('');
        setNewPassword('');
        setSuccessMsg('Password updated! Click "Sign In" below to log in.');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
              Corporate HR Portal
            </h1>
            <p className="text-xs text-forest-700">
              {activeTab === 'forgot'
                ? 'Verify 6-digit OTP code sent to your registered email to reset password.'
                : 'Sign in or create a corporate account to bulk purchase experience vouchers.'}
            </p>
          </div>

          {/* TAB TOGGLE: Sign In / Create Account */}
          {activeTab !== 'forgot' && (
            <div className="flex bg-sand-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-forest-950 shadow-sm'
                    : 'text-forest-600 hover:text-forest-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-forest-950 shadow-sm'
                    : 'text-forest-600 hover:text-forest-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORM 1: SIGN IN */}
          {activeTab === 'login' && (
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
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-forest-950 font-semibold">Password *</label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setResetStep(1); setErrorMsg(''); setSuccessMsg(''); setResetEmail(email); }}
                    className="text-amber-700 hover:text-amber-800 font-semibold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
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
          )}

          {/* FORM 2: CREATE CORPORATE ACCOUNT */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-forest-950 font-semibold mb-1">Company Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Infosys Ltd / Acme Corp"
                    value={regForm.company_name}
                    onChange={(e) => setRegForm({ ...regForm, company_name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-forest-950 font-semibold mb-1">HR / Contact Person Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={regForm.contact_person}
                    onChange={(e) => setRegForm({ ...regForm, contact_person: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-forest-950 font-semibold mb-1">Work Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="hr@company.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-forest-950 font-semibold mb-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regForm.mobile}
                    onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-forest-950 font-semibold mb-1">Account Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-forest-800 hover:bg-forest-900 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Register & Enter Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* FORM 3: FORGOT PASSWORD (2-STEP SECURE OTP FLOW) */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 text-xs">
              {resetStep === 1 ? (
                /* STEP 1: Enter Registered Email */
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <div>
                    <label className="block text-forest-950 font-semibold mb-1">Registered Work Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="hr@company.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-forest-800 hover:bg-forest-900 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Sending Code...' : 'Send 6-Digit Verification Code'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* STEP 2: Verify 6-Digit OTP Code & Set New Password */
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-900 flex items-center justify-between">
                    <span>Email: <strong>{resetEmail}</strong></span>
                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="text-amber-800 underline font-semibold hover:text-amber-950"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="block text-forest-950 font-semibold mb-1">6-Digit Verification Code (OTP) *</label>
                    <div className="relative">
                      <ShieldCheck className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 492817"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 tracking-widest font-mono text-sm focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-forest-950 font-semibold mb-1">New Account Password *</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                      <input
                        type="password"
                        required
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-forest-800 hover:bg-forest-900 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Verifying Code...' : 'Verify Code & Set New Password'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); setResetStep(1); }}
                className="w-full py-2.5 text-center text-forest-700 hover:text-forest-950 font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
