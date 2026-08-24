'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateOrderTotal } from '@/lib/pricing';
import InteractiveProductSelector from './InteractiveProductSelector';
import StatusTimeline from './StatusTimeline';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Send,
  Sparkles,
  ShieldCheck,
  User,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';

export default function MultiStepOrderWizard() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [quantities, setQuantities] = useState({
    individual: 0,
    family: 0,
    kids: 0,
  });

  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    contact_person: '',
    designation: '',
    email: '',
    mobile: '',
    billing_address: '',
    gst_number: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // UTR submission
  const [utrForm, setUtrForm] = useState({
    utr_reference: '',
    payment_date: '',
    notes: '',
  });
  const [utrLoading, setUtrLoading] = useState(false);
  const [utrSuccess, setUtrSuccess] = useState(false);

  useEffect(() => {
    setUtrForm((prev) => ({
      ...prev,
      payment_date: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  const totals = calculateOrderTotal(quantities);

  const handleQuantityChange = (type: 'individual' | 'family' | 'kids', delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  const handleProceedToStep2 = () => {
    if (totals.total <= 0) {
      setErrorMsg('Please select at least 1 corporate voucher quantity to proceed.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.company_name || !companyForm.contact_person || !companyForm.email || !companyForm.mobile || !companyForm.billing_address) {
      setErrorMsg('Please complete all required company details (*).');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...companyForm,
          quantities,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit order.');
      }

      setActiveOrder(data.order);
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting corporate order.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrForm.utr_reference) return;

    setUtrLoading(true);
    try {
      const res = await fetch('/api/orders/submit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeOrder.id,
          ...utrForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit UTR reference.');
      }

      setUtrSuccess(true);
      setActiveOrder((prev: any) => ({
        ...prev,
        payment_status: 'AWAITING_VERIFICATION',
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUtrLoading(false);
    }
  };

  return (
    <div id="order-wizard" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* STEP INDICATOR HEADER */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[
            { num: 1, title: 'Choose Vouchers' },
            { num: 2, title: 'Company Details' },
            { num: 3, title: 'Review Order' },
            { num: 4, title: 'Payment & Delivery' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                    step === s.num
                      ? 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-md'
                      : step > s.num
                      ? 'bg-forest-800 text-white'
                      : 'bg-sand-200 text-forest-600'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : `0${s.num}`}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                    step === s.num ? 'text-forest-900 font-bold' : 'text-forest-500'
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`h-0.5 w-12 sm:w-24 mx-2 sm:mx-4 transition-all ${
                    step > s.num ? 'bg-forest-800' : 'bg-sand-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* WIZARD STEP CONTENTS */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center max-w-2xl mx-auto mb-6">
              <h2 className="font-serif text-3xl font-bold text-forest-900">
                01. Choose Your Corporate Experience Products
              </h2>
              <p className="text-xs text-forest-600 mt-2">
                Select quantities for your team members. Vouchers carry 12 months validity from payment date.
              </p>
            </div>

            <InteractiveProductSelector
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
            />

            {/* STICKY BOTTOM ORDER SUMMARY */}
            <div className="sticky bottom-4 z-40 bg-forest-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-forest-700 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto mt-8">
              <div className="flex items-center space-x-6">
                <div>
                  <span className="text-[10px] text-forest-300 uppercase tracking-widest block font-semibold">Total Selected Vouchers</span>
                  <span className="font-serif text-2xl font-bold text-amber-400">
                    {totals.breakdown.reduce((acc, curr) => acc + curr.count, 0)} Units
                  </span>
                </div>
                <div className="h-8 w-px bg-forest-700 hidden sm:block" />
                <div>
                  <span className="text-[10px] text-forest-300 uppercase tracking-widest block font-semibold">Order Subtotal</span>
                  <span className="font-serif text-2xl font-bold text-sand-50">
                    ₹{totals.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleProceedToStep2}
                disabled={totals.total <= 0}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-3.5 rounded-xl font-semibold text-xs shadow-lg hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Proceed to Company Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-3xl border border-forest-200 p-8 sm:p-10 shadow-xl">
              <div className="flex items-center justify-between pb-6 border-b border-forest-100 mb-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-forest-900">
                    02. Company & Billing Details
                  </h2>
                  <p className="text-xs text-forest-600 mt-1">
                    Provide billing address and contact information for GST invoice & voucher distribution.
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-forest-600 hover:text-forest-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>

              <form onSubmit={handleProceedToStep3} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-forest-900 font-semibold mb-1.5">Company Name *</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Technologies India"
                        value={companyForm.company_name}
                        onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                        className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-forest-900 font-semibold mb-1.5">Contact Person *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={companyForm.contact_person}
                        onChange={(e) => setCompanyForm({ ...companyForm, contact_person: e.target.value })}
                        className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-forest-900 font-semibold mb-1.5">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. HR Director / Admin Manager"
                      value={companyForm.designation}
                      onChange={(e) => setCompanyForm({ ...companyForm, designation: e.target.value })}
                      className="w-full px-3.5 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-forest-900 font-semibold mb-1.5">Corporate Email *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="hr@acme.com"
                        value={companyForm.email}
                        onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                        className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-forest-900 font-semibold mb-1.5">Mobile Phone *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={companyForm.mobile}
                        onChange={(e) => setCompanyForm({ ...companyForm, mobile: e.target.value })}
                        className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-forest-900 font-semibold mb-1.5">GST Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="27AAAAA0000A1Z5"
                      value={companyForm.gst_number}
                      onChange={(e) => setCompanyForm({ ...companyForm, gst_number: e.target.value })}
                      className="w-full px-3.5 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-900 uppercase focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-forest-900 font-semibold mb-1.5">Billing Address *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-forest-400 absolute left-3 top-3.5" />
                    <textarea
                      required
                      rows={2}
                      placeholder="Registered corporate address"
                      value={companyForm.billing_address}
                      onChange={(e) => setCompanyForm({ ...companyForm, billing_address: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 bg-sand-50 border border-forest-200 rounded-xl text-forest-900 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-forest-200 rounded-xl text-forest-800 font-semibold hover:bg-forest-50"
                  >
                    Back to Products
                  </button>

                  <button
                    type="submit"
                    className="bg-forest-800 hover:bg-forest-900 text-white px-8 py-3.5 rounded-xl font-semibold text-xs shadow-lg flex items-center gap-2"
                  >
                    Review Order
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-3xl border border-forest-200 p-8 sm:p-10 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-forest-100">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-forest-900">
                    03. Review & Confirm Corporate Order
                  </h2>
                  <p className="text-xs text-forest-600 mt-1">
                    Please review your voucher selections and company details before submitting.
                  </p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-forest-600 hover:text-forest-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit
                </button>
              </div>

              {/* ITEM SUMMARY TABLE */}
              <div className="bg-sand-50 p-6 rounded-2xl border border-sand-200 text-xs">
                <div className="font-bold text-forest-900 mb-4 uppercase text-[11px] tracking-wider">
                  Voucher Items Summary
                </div>

                <div className="space-y-3 divide-y divide-sand-200">
                  {totals.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center pt-2">
                      <div>
                        <div className="font-bold text-forest-900 text-sm">{item.title}</div>
                        <div className="text-forest-600 text-[11px]">
                          {item.count} Units × ₹{item.unitPrice.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="font-bold text-forest-900 text-base font-serif">
                        ₹{item.total.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t-2 border-sand-300 flex justify-between items-center font-bold text-base text-forest-900">
                  <span>Total Payable Amount</span>
                  <span className="text-amber-600 font-serif text-2xl">
                    ₹{totals.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* COMPANY PREVIEW */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-forest-50 p-5 rounded-2xl border border-forest-100 text-forest-800">
                <div>
                  <span className="text-forest-500 block text-[10px] uppercase">Corporate Client</span>
                  <strong>{companyForm.company_name}</strong>
                </div>
                <div>
                  <span className="text-forest-500 block text-[10px] uppercase">Contact Person</span>
                  <strong>{companyForm.contact_person} ({companyForm.email})</strong>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-forest-200 rounded-xl text-forest-800 font-semibold"
                >
                  Back
                </button>

                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-9 py-4 rounded-xl font-semibold text-sm shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Submitting Request...' : 'Submit Request & View Payment Instructions'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 4 && activeOrder && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-3xl border border-forest-200 p-8 sm:p-10 shadow-2xl space-y-8">
              {/* SUCCESS HEADLINE */}
              <div className="text-center max-w-xl mx-auto">
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-300 shadow-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-forest-900">
                  Your Experience Gifting Journey Has Begun
                </h2>
                <p className="text-xs text-forest-600 mt-2">
                  Order Reference: <strong className="font-mono text-amber-700 text-sm">{activeOrder.order_number}</strong>
                </p>
              </div>

              {/* STATUS TIMELINE */}
              <StatusTimeline currentStatus={utrSuccess ? 'AWAITING_VERIFICATION' : 'PENDING_PAYMENT'} />

              {/* BANK INSTRUCTION BOX */}
              <div className="bg-sand-50 p-6 rounded-2xl border border-sand-200 text-xs">
                <div className="font-bold text-sm text-forest-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  Nisargshala RTGS / NEFT Bank Details
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-forest-900 font-medium">
                  <div>
                    <span className="text-[10px] text-forest-500 uppercase block">Account Name</span>
                    <strong>Nisargshala</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-forest-500 uppercase block">Bank Name</span>
                    <strong>HDFC Bank</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-forest-500 uppercase block">Account Number</span>
                    <strong className="font-mono text-sm">50200012345678</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-forest-500 uppercase block">IFSC Code</span>
                    <strong className="font-mono text-sm">HDFC0001234</strong>
                  </div>
                </div>
              </div>

              {/* UTR SUBMISSION FORM */}
              {utrSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-8 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-serif text-xl font-bold">Payment Reference Submitted Successfully!</h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Nisargshala administrator is verifying your bank transaction. Once confirmed, your vouchers will be activated and ready for digital PDF download.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitUtr} className="bg-white p-6 rounded-2xl border border-forest-200 space-y-4 text-xs">
                  <h3 className="font-serif text-base font-bold text-forest-900">
                    Submit Bank Payment Reference (UTR)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-forest-900 font-semibold mb-1">Bank UTR / Ref Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFCR520260824001234"
                        value={utrForm.utr_reference}
                        onChange={(e) => setUtrForm({ ...utrForm, utr_reference: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl font-mono uppercase text-forest-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-forest-900 font-semibold mb-1">Transfer Date *</label>
                      <input
                        type="date"
                        required
                        value={utrForm.payment_date}
                        onChange={(e) => setUtrForm({ ...utrForm, payment_date: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={utrLoading || !utrForm.utr_reference}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl font-semibold text-xs shadow-lg flex items-center justify-center gap-2"
                  >
                    {utrLoading ? 'Submitting UTR...' : 'Submit Payment Reference for Verification'}
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
