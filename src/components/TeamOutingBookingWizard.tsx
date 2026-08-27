'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_OUTING_PACKAGES } from '@/lib/pricing';

interface TeamOutingBookingWizardProps {
  initialPackageCode?: string;
}

export default function TeamOutingBookingWizard({ initialPackageCode }: TeamOutingBookingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Package & Booking State
  const [selectedPkgCode, setSelectedPkgCode] = useState(initialPackageCode || 'WILDERNESS_BONDING');
  const [eventDate, setEventDate] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(15);
  const [specialReqs, setSpecialReqs] = useState('');

  // Auth / Corporate Info State
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [companyDetails, setCompanyDetails] = useState({
    company_name: '',
    contact_person: '',
    designation: 'HR Manager',
    email: '',
    mobile: '',
    billing_address: '',
    gst_number: '',
  });

  // Created Booking & Payment State
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [utrReference, setUtrReference] = useState('');
  const [utrSubmitted, setUtrSubmitted] = useState(false);

  const selectedPkg = DEFAULT_OUTING_PACKAGES.find((p) => p.package_code === selectedPkgCode) || DEFAULT_OUTING_PACKAGES[0];

  // Fetch Session on Mount
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setSessionUser(data.user);
          const comp = data.user.company || {};
          setCompanyDetails({
            company_name: comp.company_name || data.user.company_name || '',
            contact_person: comp.contact_person || data.user.full_name || '',
            designation: 'Corporate HR',
            email: data.user.email || '',
            mobile: comp.mobile || '',
            billing_address: comp.billing_address || '',
            gst_number: comp.gst_number || '',
          });
        }
      }
    } catch (e) {}
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate) {
      setError('Please select a preferred event date.');
      return;
    }
    if (attendeesCount < (selectedPkg.minimum_attendees || 10)) {
      setError(`Minimum group size for ${selectedPkg.package_title} is ${selectedPkg.minimum_attendees} participants.`);
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleStep2Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // GSTIN format check
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!companyDetails.gst_number || !gstinRegex.test(companyDetails.gst_number.trim().toUpperCase())) {
      setError('A valid 15-character corporate GSTIN is mandatory (e.g. 27AAAAA0000A1Z5).');
      return;
    }

    setLoading(true);
    try {
      // If user is not authenticated yet, ask them to sign in or register
      if (!sessionUser) {
        setError('Please sign in or register your corporate account to complete the booking.');
        setLoading(false);
        return;
      }

      // Create Booking on Server
      const res = await fetch('/api/outings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_code: selectedPkg.package_code,
          event_date: eventDate,
          attendees_count: attendeesCount,
          special_requirements: specialReqs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create outing booking.');
      }

      setBookingResult(data.booking);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to proceed to booking review.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Confirm = () => {
    setStep(4);
  };

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrReference || utrReference.trim().length < 6) {
      setError('Please enter a valid Bank UTR / Transaction Reference Number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/outings/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingResult.id,
          utr_reference: utrReference,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit payment UTR reference.');
      }

      setUtrSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit UTR reference.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const unitPrice = selectedPkg.base_price;
  const subtotal = unitPrice * attendeesCount;
  const gstAmount = Math.round((subtotal * 18) / 100);
  const totalAmount = subtotal + gstAmount;

  return (
    <div id="booking-wizard" className="w-full bg-[#062018] text-white rounded-3xl p-6 md:p-10 shadow-2xl border border-emerald-900/60 max-w-4xl mx-auto">
      {/* Wizard Header Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-3">
          <span className={step >= 1 ? 'text-amber-400 font-bold' : ''}>1. Select Experience</span>
          <span className={step >= 2 ? 'text-amber-400 font-bold' : ''}>2. Corporate Info</span>
          <span className={step >= 3 ? 'text-amber-400 font-bold' : ''}>3. Review & Tax</span>
          <span className={step >= 4 ? 'text-amber-400 font-bold' : ''}>4. Payment & UTR</span>
        </div>
        <div className="w-full h-2 bg-emerald-950 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/80 border border-red-800 text-red-200 rounded-2xl text-xs font-medium flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* STEP 1: Select Experience */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-amber-400 mb-1">Step 1: Choose Experience & Date</h3>
            <p className="text-xs text-emerald-200/80">Select your preferred corporate outing package, location, and group size.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-emerald-200 uppercase mb-2">Outing Package *</label>
              <select
                value={selectedPkgCode}
                onChange={(e) => setSelectedPkgCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#03140F] border border-emerald-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {DEFAULT_OUTING_PACKAGES.map((pkg) => (
                  <option key={pkg.package_code} value={pkg.package_code}>
                    {pkg.package_title} — ₹{pkg.base_price.toLocaleString('en-IN')}/person ({pkg.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 uppercase mb-2">Requested Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#03140F] border border-emerald-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-200 uppercase mb-2">Number of Participants * (Min {selectedPkg.minimum_attendees})</label>
              <input
                type="number"
                min={selectedPkg.minimum_attendees || 10}
                required
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 10)}
                className="w-full px-4 py-3 rounded-xl bg-[#03140F] border border-emerald-800 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="bg-[#03140F] p-5 rounded-2xl border border-emerald-900/60 space-y-2 text-xs">
            <div className="flex justify-between font-semibold text-emerald-300">
              <span>Location:</span>
              <span className="text-white">{selectedPkg.location}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-300">
              <span>Package Inclusions:</span>
              <span className="text-white">{selectedPkg.inclusions.join(' • ')}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-400 pt-2 border-t border-emerald-900">
              <span>Estimated Subtotal ({attendeesCount} pax @ ₹{unitPrice}):</span>
              <span>₹{subtotal.toLocaleString('en-IN')} + 18% GST</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              Continue to Corporate Details →
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Corporate Details */}
      {step === 2 && (
        <form onSubmit={handleStep2Next} className="space-y-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-amber-400 mb-1">Step 2: Corporate Account Details</h3>
            <p className="text-xs text-emerald-200/80">
              {!sessionUser
                ? 'Please sign in or register your corporate account to associate this booking.'
                : 'Confirm corporate billing details and mandatory GSTIN.'}
            </p>
          </div>

          {!sessionUser ? (
            <div className="bg-[#03140F] p-6 rounded-2xl border border-amber-500/30 text-center space-y-4">
              <p className="text-sm text-emerald-200">
                You are currently browsing as a guest. Please log in to your corporate account to auto-fill GSTIN and company billing details.
              </p>
              <a
                href={`/login?redirect=/team-outings#booking-wizard`}
                className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all text-xs"
              >
                Sign In / Register Corporate Account
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">Company Legal Name</label>
                  <input
                    type="text"
                    disabled
                    value={companyDetails.company_name}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#03140F] border border-emerald-900 text-sm text-emerald-100 opacity-80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">Authorized Contact Name</label>
                  <input
                    type="text"
                    disabled
                    value={companyDetails.contact_person}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#03140F] border border-emerald-900 text-sm text-emerald-100 opacity-80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">Work Email</label>
                  <input
                    type="email"
                    disabled
                    value={companyDetails.email}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#03140F] border border-emerald-900 text-sm text-emerald-100 opacity-80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-emerald-300 mb-1">Buyer Corporate GSTIN * (Mandatory)</label>
                  <input
                    type="text"
                    required
                    value={companyDetails.gst_number}
                    onChange={(e) => setCompanyDetails({ ...companyDetails, gst_number: e.target.value })}
                    placeholder="27AAAAA0000A1Z5"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#03140F] border border-amber-500/50 text-sm font-mono text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">Special Operational Requirements / Dietary Notes</label>
                <textarea
                  rows={2}
                  value={specialReqs}
                  onChange={(e) => setSpecialReqs(e.target.value)}
                  placeholder="e.g. Vegetarian catering preferred, projector requirement for strategy session..."
                  className="w-full px-4 py-2 rounded-xl bg-[#03140F] border border-emerald-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-2.5 rounded-xl border border-emerald-800 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 transition-colors"
            >
              ← Back
            </button>
            {sessionUser && (
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Creating Booking...' : 'Proceed to Tax Review →'}
              </button>
            )}
          </div>
        </form>
      )}

      {/* STEP 3: Review & Pricing */}
      {step === 3 && bookingResult && (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-amber-400 mb-1">Step 3: Review Booking & Tax Breakdown</h3>
            <p className="text-xs text-emerald-200/80">Authoritative server-side pricing and tax calculations for Booking #{bookingResult.booking_number}.</p>
          </div>

          <div className="bg-[#03140F] p-6 rounded-2xl border border-emerald-800 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-emerald-900">
              <div>
                <span className="text-emerald-400 block font-semibold">Seller GSTIN (Nisargshala):</span>
                <span className="text-white font-mono font-bold text-sm">27ARHPV2783R1ZN</span>
              </div>
              <div>
                <span className="text-emerald-400 block font-semibold">Buyer GSTIN ({companyDetails.company_name}):</span>
                <span className="text-amber-300 font-mono font-bold text-sm">{bookingResult.buyer_gstin}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-200">{bookingResult.package_title} ({bookingResult.attendees_count} Attendees @ ₹{bookingResult.unit_price}):</span>
                <span className="font-semibold">₹{bookingResult.subtotal_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">GST @ {bookingResult.gst_rate}%:</span>
                <span className="font-semibold">₹{bookingResult.gst_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-amber-400 pt-2 border-t border-emerald-900">
                <span>Total Amount Due:</span>
                <span>₹{bookingResult.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl border border-emerald-800 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40"
            >
              ← Edit Details
            </button>
            <button
              onClick={handleStep3Confirm}
              className="bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-slate-950 font-bold text-xs px-8 py-3 rounded-xl transition-all shadow-lg"
            >
              Proceed to RTGS/NEFT Payment →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Payment & UTR */}
      {step === 4 && bookingResult && (
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-serif font-bold text-amber-400 mb-1">Step 4: Bank Payment & UTR Submission</h3>
            <p className="text-xs text-emerald-200/80">Transfer total amount via RTGS / NEFT and submit your UTR reference number.</p>
          </div>

          <div className="bg-[#03140F] p-6 rounded-2xl border border-emerald-800 space-y-4">
            <div className="p-4 bg-emerald-950/60 rounded-xl border border-emerald-800/80 space-y-1 text-xs">
              <div className="font-bold text-amber-400 text-sm">HDFC Bank — Nisargshala Corporate Account</div>
              <div>Account Name: <strong className="text-white">NISARGSHALA</strong></div>
              <div>Account Number: <strong className="text-white font-mono">5020097103825</strong></div>
              <div>IFSC Code: <strong className="text-white font-mono">HDFC0002493</strong></div>
              <div>Payment Reference: <strong className="text-amber-300 font-mono">{bookingResult.booking_number}</strong></div>
              <div>Total Amount: <strong className="text-white">₹{bookingResult.total_amount.toLocaleString('en-IN')}</strong></div>
            </div>

            {utrSubmitted ? (
              <div className="p-6 bg-emerald-900/40 border border-emerald-500/50 rounded-2xl text-center space-y-3">
                <div className="text-3xl">🎉</div>
                <h4 className="text-xl font-bold font-serif text-amber-400">Payment UTR Submitted Successfully!</h4>
                <p className="text-xs text-emerald-100 max-w-md mx-auto">
                  Your UTR reference <strong>{utrReference}</strong> for Booking <strong>#{bookingResult.booking_number}</strong> has been logged. Nisargshala accounts will verify payment and dispatch your Tax Invoice & Confirmation Email.
                </p>
                <div className="pt-3 p-4 bg-[#062018] rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-emerald-300">Need Immediate Confirmation Assistance?</div>
                  <div>📞 Call Support: <a href="tel:+919049002053" className="text-white underline">+91 90490 02053</a></div>
                  <div>💬 WhatsApp Support: <a href="https://wa.me/918698969892" className="text-amber-400 underline">+91 86989 69892</a></div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUtrSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-200 uppercase mb-2">Enter RTGS / NEFT UTR Transaction Reference *</label>
                  <input
                    type="text"
                    required
                    value={utrReference}
                    onChange={(e) => setUtrReference(e.target.value)}
                    placeholder="e.g. UTR123456789012"
                    className="w-full px-4 py-3 rounded-xl bg-[#062018] border border-amber-500/60 font-mono text-base font-bold text-amber-300 uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-bold text-sm py-3.5 rounded-xl transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? 'Submitting UTR...' : 'Submit Payment UTR & Complete Booking'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
