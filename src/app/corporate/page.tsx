'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatSafeDate } from '@/lib/dateUtils';
import {
  Building2,
  ShoppingBag,
  Ticket,
  Clock,
  CheckCircle2,
  Download,
  UserCheck,
  CreditCard,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function CorporateHRDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'vouchers'>('orders');

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    contact_person: '',
    designation: '',
    mobile: '',
    billing_address: '',
    gst_number: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Verify session
      const authRes = await fetch('/api/auth/session');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();

      if (!authData.authenticated) {
        router.push('/login');
        return;
      }

      setSession(authData.user);

      // 2. Fetch company isolated data
      const dataRes = await fetch('/api/corporate/data');
      if (dataRes.ok) {
        const payload = await dataRes.json();
        setCompany(payload.company);
        setOrders(payload.orders || []);
        setPayments(payload.payments || []);
        setVouchers(payload.vouchers || []);
        if (payload.company) {
          setProfileForm({
            company_name: payload.company.company_name || '',
            contact_person: payload.company.contact_person || '',
            designation: payload.company.designation || '',
            mobile: payload.company.mobile || '',
            billing_address: payload.company.billing_address || '',
            gst_number: payload.company.gst_number || '',
          });
        }
        setError(null);
      } else {
        const errPayload = await dataRes.json().catch(() => null);
        setError(errPayload?.message || 'Database error loading corporate records. Please click retry or contact Nisargshala support.');
      }
    } catch (err: any) {
      console.error('Error fetching HR data:', err);
      setError('Network connection error. Failed to reach corporate portal servers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileNotice('');
    try {
      const res = await fetch('/api/corporate/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update company profile.');
      }

      setCompany(data.company);
      setProfileNotice('Profile updated successfully!');
      setTimeout(() => {
        setEditModalOpen(false);
        setProfileNotice('');
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Error saving profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-forest-800 animate-spin mx-auto" />
          <div className="text-xs font-semibold text-forest-900">Verifying Corporate HR Authentication...</div>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalOrders = orders.length;
  const totalVouchersCount = vouchers.length;
  const totalVoucherValue = vouchers.reduce((acc, curr) => acc + (curr.voucher_value || 0), 0);
  const activeVouchersCount = vouchers.filter((v) => v.status === 'ACTIVE').length;
  const redeemedVouchersCount = vouchers.filter((v) => v.status === 'REDEEMED').length;

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-forest-200 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-forest-600/30 bg-white shrink-0 shadow-sm">
              <img src="/images/nisargshala-logo.png" alt="Nisargshala Logo" className="object-contain w-full h-full p-0.5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-forest-100 text-forest-800 mb-1 border border-forest-200">
                <Building2 className="w-3.5 h-3.5" />
                Corporate HR Portal — {company?.company_name || 'My Company'}
              </div>
              <h1 className="font-serif text-3xl font-bold text-forest-950">
                Voucher Management & Order History
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" /> Edit Company Profile
            </button>
            <button
              onClick={fetchHRData}
              className="inline-flex items-center gap-2 bg-white border border-forest-200 text-forest-800 hover:bg-forest-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" /> Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold">⚠️ Connection / Database Error:</span> {error}
            </div>
            <button
              onClick={fetchHRData}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* COMPANY PROFILE CARD */}
        <div className="bg-white rounded-2xl border border-forest-200 p-6 mb-8 shadow-sm text-xs">
          <div className="flex justify-between items-center pb-4 border-b border-forest-100 mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-forest-800" />
              <h2 className="font-serif text-lg font-bold text-forest-950">
                {company?.company_name || session?.email}
              </h2>
            </div>
            <button
              onClick={() => setEditModalOpen(true)}
              className="text-amber-700 hover:text-amber-800 font-semibold underline text-[11px]"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-forest-900">
            <div>
              <span className="text-[10px] text-forest-500 uppercase block font-bold">HR / Authorized Contact</span>
              <strong>{company?.contact_person || session?.email}</strong>
              {company?.designation && <span className="block text-[11px] text-forest-600">{company.designation}</span>}
            </div>

            <div>
              <span className="text-[10px] text-forest-500 uppercase block font-bold">Corporate Email & Phone</span>
              <strong className="block">{company?.email || session?.email}</strong>
              <span className="text-[11px] text-forest-700">{company?.mobile || 'No phone added'}</span>
            </div>

            <div>
              <span className="text-[10px] text-forest-500 uppercase block font-bold">Customer GSTIN (Buyer)</span>
              <strong className="font-mono text-amber-700">{company?.gst_number || 'Not supplied'}</strong>
            </div>

            <div>
              <span className="text-[10px] text-forest-500 uppercase block font-bold">Nisargshala GSTIN (Seller)</span>
              <strong className="font-mono text-forest-950">27ARHPV2783R1ZN</strong>
            </div>
          </div>
        </div>

        {/* METRICS METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Total Corporate Orders</div>
            <div className="text-3xl font-serif font-bold text-forest-950">{totalOrders}</div>
            <div className="text-[11px] text-forest-500 mt-2 font-medium">Verified company orders</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Total Purchased Vouchers</div>
            <div className="text-3xl font-serif font-bold text-amber-600">{totalVouchersCount}</div>
            <div className="text-[11px] text-amber-600 mt-2 font-medium">Total Face Value: ₹{totalVoucherValue.toLocaleString('en-IN')}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Active Vouchers</div>
            <div className="text-3xl font-serif font-bold text-emerald-600">{activeVouchersCount}</div>
            <div className="text-[11px] text-emerald-600 mt-2 font-medium">Ready for employee redemption</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Redeemed Vouchers</div>
            <div className="text-3xl font-serif font-bold text-blue-600">{redeemedVouchersCount}</div>
            <div className="text-[11px] text-blue-600 mt-2 font-medium">Redeemed on retail portal</div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-forest-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-forest-800 text-forest-800'
                : 'border-transparent text-forest-600 hover:text-forest-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Order History ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-4 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-forest-800 text-forest-800'
                : 'border-transparent text-forest-600 hover:text-forest-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payment History ({payments.length})
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-4 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'vouchers'
                ? 'border-forest-800 text-forest-800'
                : 'border-transparent text-forest-600 hover:text-forest-900'
            }`}
          >
            <Ticket className="w-4 h-4" /> Voucher Inventory ({vouchers.length})
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-forest-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-forest-100 flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-forest-950">Company Order History</h3>
              <button
                onClick={() => router.push('/#order-wizard')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                + Order Corporate Vouchers
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-forest-700 text-xs space-y-3">
                <ShoppingBag className="w-12 h-12 text-forest-300 mx-auto" />
                <div className="font-bold text-sm text-forest-900">You haven't placed any corporate voucher orders yet.</div>
                <p className="max-w-md mx-auto text-forest-600">
                  Select outdoor tent camping, family retreats, or kids adventure camp vouchers on the homepage to place a corporate bulk order.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => router.push('/#order-wizard')}
                    className="bg-forest-800 hover:bg-forest-900 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Order Vouchers Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-100 text-forest-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Order Ref</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Order Subtotal</th>
                      <th className="px-6 py-4">GST (18%)</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Payment Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-sand-50">
                        <td className="px-6 py-4 font-mono font-bold text-forest-950">{ord.order_number}</td>
                        <td className="px-6 py-4">{formatSafeDate(ord.created_at)}</td>
                        <td className="px-6 py-4">₹{ord.subtotal_amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">₹{ord.gst_amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold text-amber-700">₹{ord.total_amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full font-semibold ${
                            ord.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            ord.payment_status === 'AWAITING_VERIFICATION' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {ord.payment_status === 'PAID' ? (
                            <a
                              href={`/api/vouchers/download?order_id=${ord.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 bg-forest-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                            >
                              <Download className="w-3 h-3" /> Download Vouchers ZIP
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[11px]">Awaiting Payment</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYMENT HISTORY */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-forest-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-forest-100">
              <h3 className="font-serif text-lg font-bold text-forest-950">RTGS/NEFT Payment Records</h3>
            </div>

            {payments.length === 0 ? (
              <div className="p-12 text-center text-forest-500 italic text-xs">
                No payment records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-100 text-forest-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Order Ref</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Method</th>
                      <th className="px-6 py-4">UTR Reference Number</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {payments.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-sand-50">
                        <td className="px-6 py-4 font-mono font-bold text-forest-950">{pmt.order_number || pmt.order_id}</td>
                        <td className="px-6 py-4 font-bold text-amber-700">₹{pmt.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-semibold">{pmt.method || 'RTGS / NEFT'}</td>
                        <td className="px-6 py-4 font-mono text-forest-900">{pmt.utr_reference || 'Pending UTR'}</td>
                        <td className="px-6 py-4">{formatSafeDate(pmt.payment_date || pmt.created_at)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full font-semibold ${
                            pmt.status === 'VERIFIED' || pmt.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {pmt.status === 'VERIFIED' || pmt.status === 'PAID' ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: VOUCHER INVENTORY */}
        {activeTab === 'vouchers' && (
          <div className="bg-white rounded-2xl border border-forest-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-forest-100 flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-forest-950">Company Voucher Inventory</h3>
                <p className="text-xs text-forest-600">Issued specifically to {company?.company_name || 'your company'}</p>
              </div>

              {vouchers.length > 0 && (
                <a
                  href={`/api/vouchers/download?company_id=${company?.id || session?.companyId}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" /> Download All Company Vouchers (ZIP)
                </a>
              )}
            </div>

            {vouchers.length === 0 ? (
              <div className="p-12 text-center text-forest-500 italic text-xs">
                No active vouchers currently issued. Vouchers will populate here immediately upon RTGS/NEFT payment verification.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-100 text-forest-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Voucher Serial Ref</th>
                      <th className="px-6 py-4">Secret Code</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Face Value</th>
                      <th className="px-6 py-4">Assigned Employee</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {vouchers.map((vch) => (
                      <tr key={vch.id} className="hover:bg-sand-50">
                        <td className="px-6 py-4 font-mono font-bold text-forest-950">{vch.human_ref}</td>
                        <td className="px-6 py-4 font-mono font-bold text-amber-700 tracking-wider">{vch.redemption_code}</td>
                        <td className="px-6 py-4 font-semibold">{vch.product_code}</td>
                        <td className="px-6 py-4 font-bold text-forest-950">₹{vch.voucher_value?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                          {vch.assigned_employee_name ? (
                            <span className="font-semibold text-forest-900">{vch.assigned_employee_name}</span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">{formatSafeDate(vch.expiry_date)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full font-semibold ${
                            vch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {vch.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`/api/vouchers/download?voucher_id=${vch.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-forest-800 font-semibold hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* EDIT PROFILE MODAL */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-forest-200 p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center pb-4 border-b border-forest-100">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-forest-800" />
                  <h3 className="font-serif text-xl font-bold text-forest-950">Edit Corporate Profile</h3>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {profileNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{profileNotice}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-forest-950 font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-forest-950 font-semibold mb-1">HR Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.contact_person}
                      onChange={(e) => setProfileForm({ ...profileForm, contact_person: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-forest-950 font-semibold mb-1">Designation</label>
                    <input
                      type="text"
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-forest-950 font-semibold mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-forest-950 font-semibold mb-1">Customer GSTIN</label>
                    <input
                      type="text"
                      placeholder="27AAAAA0000A1Z5"
                      value={profileForm.gst_number}
                      onChange={(e) => setProfileForm({ ...profileForm, gst_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 uppercase font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-forest-950 font-semibold mb-1">Billing Address *</label>
                  <textarea
                    required
                    rows={3}
                    value={profileForm.billing_address}
                    onChange={(e) => setProfileForm({ ...profileForm, billing_address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-sand-50 border border-forest-200 rounded-xl text-forest-950 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-5 py-2.5 border border-forest-200 rounded-xl text-forest-700 font-semibold hover:bg-forest-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

