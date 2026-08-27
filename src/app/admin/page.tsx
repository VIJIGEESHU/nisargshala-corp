'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatSafeDate } from '@/lib/dateUtils';
import {
  Compass,
  ShoppingBag,
  Ticket,
  Sliders,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Edit,
  FileText,
  LogOut,
  Mail,
  HelpCircle,
  PhoneCall
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'outings' | 'orders' | 'enquiries' | 'vouchers' | 'catalogue' | 'settings'>('outings');

  // Data state
  const [orders, setOrders] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [outings, setOutings] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Bank & Validity Settings State
  const [bankSettings, setBankSettings] = useState({
    account_holder: 'NISARGSHALA',
    bank_name: 'HDFC Bank',
    account_number: '5020097103825',
    ifsc_code: 'HDFC0002493',
    validity_months: 12,
    gst_rate: 18,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Experience Price Edit State
  const [editingExpCode, setEditingExpCode] = useState<string | null>(null);
  const [editingExpPrice, setEditingExpPrice] = useState<number>(0);

  useEffect(() => {
    checkAdminAuthAndFetch();
    fetchBankSettings();
  }, []);

  const fetchBankSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setBankSettings(data.settings);
        }
      }
    } catch (e) {
      console.warn('Error fetching bank settings:', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankSettings),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save bank settings.');
      }

      setSettingsMsg('Bank payment details & validity settings saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const checkAdminAuthAndFetch = async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/session');
      if (!authRes.ok) {
        router.push('/admin/login');
        return;
      }
      const authData = await authRes.json();

      if (!authData.authenticated || (authData.userType !== 'ADMIN' && authData.user?.role !== 'SUPER_ADMIN' && authData.user?.role !== 'ADMIN')) {
        router.push('/admin/login');
        return;
      }

      setSession(authData.user);

      const dataRes = await fetch('/api/admin/data');
      if (dataRes.ok) {
        const payload = await dataRes.json();
        setOrders(payload.orders || []);
        setVouchers(payload.vouchers || []);
        setOutings(payload.outings || []);
        setEnquiries(payload.enquiries || []);
        setExperiences(payload.experiences || []);
        setAuditLogs(payload.auditLogs || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVoucherPayment = async (orderId: string) => {
    if (!confirm('Verify payment for this voucher order? This will generate distinct vouchers and dispatch the confirmation email with Tax Invoice.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, admin_id: session?.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to confirm payment.');
      }

      alert(`Success! ${data.vouchers_count} distinct vouchers generated & email dispatched.`);
      checkAdminAuthAndFetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendVoucherEmail = async (orderId: string) => {
    if (!confirm('Resend the voucher package email to the customer? This reuses existing vouchers without creating duplicates.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/resend-vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend voucher email.');
      }

      alert(data.message || 'Voucher email resent successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmOutingPayment = async (bookingId: string) => {
    if (!confirm('Verify payment for this Team Outing booking? This will generate the Tax Invoice and dispatch the retreat confirmation email.')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/confirm-outing-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to confirm outing payment.');
      }

      alert(data.message || 'Team Outing payment verified & confirmation email dispatched successfully!');
      checkAdminAuthAndFetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendOutingInvoice = async (bookingId: string) => {
    if (!confirm('Resend Tax Invoice & Confirmation email for this Team Outing booking?')) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/resend-outing-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to resend outing invoice.');
      }

      alert(data.message || 'Team Outing Tax Invoice email resent successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF9F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <div className="text-xs font-semibold text-emerald-950">Verifying Admin Session & Loading Portal Data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F5] text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* HEADER BAR */}
        <div className="bg-[#062018] text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-emerald-900">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <ShieldCheck className="w-4 h-4" /> Nisargshala Corporate Gateway Operational Console
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white mt-1">Master Operations & Finance Admin</h1>
            <p className="text-xs text-emerald-200/80 mt-1">
              Logged in as: <strong className="text-white">{session?.email || 'Master Administrator'}</strong>
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" /> Admin Logout
          </button>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Outing Bookings</span>
            <div className="text-2xl font-bold font-serif text-[#062018]">{outings.length}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              {outings.filter((b) => b.payment_status === 'AWAITING_VERIFICATION').length} Awaiting Verification
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Voucher Orders</span>
            <div className="text-2xl font-bold font-serif text-[#062018]">{orders.length}</div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              {orders.filter((o) => o.payment_status === 'AWAITING_VERIFICATION').length} Awaiting Verification
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Custom Enquiries</span>
            <div className="text-2xl font-bold font-serif text-[#062018]">{enquiries.length}</div>
            <div className="text-[11px] text-amber-600 font-semibold">
              {enquiries.filter((e) => e.status === 'NEW').length} New Enquiries
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Voucher Inventory</span>
            <div className="text-2xl font-bold font-serif text-[#062018]">{vouchers.length}</div>
            <div className="text-[11px] text-slate-500 font-medium">Issued across all corporate accounts</div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 space-x-4 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('outings')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'outings'
                ? 'border-[#062018] text-[#062018]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" /> Team Outing Bookings ({outings.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-[#062018] text-[#062018]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Voucher Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'enquiries'
                ? 'border-[#062018] text-[#062018]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Custom Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'vouchers'
                ? 'border-[#062018] text-[#062018]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" /> Voucher Inventory ({vouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-[#062018] text-[#062018]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" /> Bank & Tax Settings
          </button>
        </div>

        {/* TAB 1: TEAM OUTINGS */}
        {activeTab === 'outings' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#062018]">Corporate Team Outings & Retreats</h3>
                <p className="text-xs text-slate-500">Manage outing bookings, verify bank UTRs, generate Tax Invoices, and send emails.</p>
              </div>
              <button
                onClick={checkAdminAuthAndFetch}
                className="p-2 text-slate-600 hover:text-[#062018] rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh Outings"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-4">Booking Ref</th>
                    <th className="p-4">Company & Contact</th>
                    <th className="p-4">Event Date & Location</th>
                    <th className="p-4">Attendees</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Bank UTR</th>
                    <th className="p-4">Payment & Booking Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                        No team outing bookings found yet.
                      </td>
                    </tr>
                  ) : (
                    outings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#062018]">{b.booking_number}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{b.company?.company_name || 'Corporate Partner'}</div>
                          <div className="text-slate-500">{b.company?.contact_person || b.company?.email}</div>
                          <div className="text-[11px] font-mono text-amber-700 font-semibold">GST: {b.buyer_gstin || b.company?.gst_number || 'Missing'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{b.event_date}</div>
                          <div className="text-slate-500 text-[11px]">{b.location}</div>
                        </td>
                        <td className="p-4 font-bold">{b.attendees_count} Pax</td>
                        <td className="p-4 font-bold text-emerald-800 font-serif">₹{b.total_amount?.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-mono font-bold text-amber-600">{b.utr_reference || 'Not Submitted'}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              b.payment_status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.payment_status === 'AWAITING_VERIFICATION'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {b.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {b.payment_status === 'AWAITING_VERIFICATION' || b.payment_status === 'PENDING_PAYMENT' ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleConfirmOutingPayment(b.id)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg transition-all text-[11px]"
                            >
                              Verify Payment & Dispatch Invoice
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleResendOutingInvoice(b.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition-all text-[11px]"
                            >
                              Resend Invoice Email
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: VOUCHER ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#062018]">Corporate Voucher Bulk Orders</h3>
                <p className="text-xs text-slate-500">Verify payments, issue distinct voucher certificates, and resend ZIP packages.</p>
              </div>
              <button
                onClick={checkAdminAuthAndFetch}
                className="p-2 text-slate-600 hover:text-[#062018] rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh Orders"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Company</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Bank UTR</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                        No voucher orders found yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#062018]">{o.order_number}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{o.company?.company_name || 'Corporate Partner'}</div>
                          <div className="text-slate-500">{o.company?.contact_person || o.company?.email}</div>
                          <div className="text-[11px] font-mono text-amber-700 font-semibold">GST: {o.company?.gst_number || 'Missing'}</div>
                        </td>
                        <td className="p-4 text-slate-600">{formatSafeDate(o.created_at)}</td>
                        <td className="p-4 font-bold text-emerald-800 font-serif">₹{o.total_amount?.toLocaleString('en-IN')}</td>
                        <td className="p-4 font-mono font-bold text-amber-600">{o.utr_reference || 'Not Submitted'}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.payment_status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.payment_status === 'AWAITING_VERIFICATION'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {o.payment_status === 'AWAITING_VERIFICATION' || o.payment_status === 'PENDING_PAYMENT' ? (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleConfirmVoucherPayment(o.id)}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg transition-all text-[11px]"
                            >
                              Verify Payment & Issue Vouchers
                            </button>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleResendVoucherEmail(o.id)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 transition-all text-[11px]"
                            >
                              Resend Vouchers Email
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-serif font-bold text-lg text-[#062018]">Custom Corporate Experience Enquiries</h3>
              <p className="text-xs text-slate-500">Inbound requests submitted via "Planning Something Different?".</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-4">Enquiry Ref</th>
                    <th className="p-4">Company & Contact</th>
                    <th className="p-4">Team Size</th>
                    <th className="p-4">Preferred Location & Date</th>
                    <th className="p-4">Special Requirements</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                        No custom enquiries submitted yet.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#062018]">{e.enquiry_number}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{e.company_name}</div>
                          <div className="text-slate-500">{e.contact_person} ({e.email})</div>
                          <div className="text-emerald-700 font-semibold">{e.mobile}</div>
                        </td>
                        <td className="p-4 font-bold">{e.team_size} Pax</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{e.preferred_location || 'Flexible'}</div>
                          <div className="text-slate-500 text-[11px]">{e.preferred_date || 'Date TBD'}</div>
                        </td>
                        <td className="p-4 max-w-xs truncate text-slate-600">{e.special_requirements || 'Standard Program'}</td>
                        <td className="p-4">
                          <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: VOUCHERS INVENTORY */}
        {activeTab === 'vouchers' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-serif font-bold text-lg text-[#062018]">Issued Vouchers Master Directory</h3>
              <p className="text-xs text-slate-500">Directory of all distinct vouchers generated across corporate orders.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-4">Voucher Ref</th>
                    <th className="p-4">Secret Code</th>
                    <th className="p-4">Product Category</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#062018]">{v.human_ref}</td>
                      <td className="p-4 font-mono font-bold text-amber-700">{v.redemption_code}</td>
                      <td className="p-4 font-semibold">{v.product_code}</td>
                      <td className="p-4 font-bold text-emerald-800">₹{v.voucher_value?.toLocaleString('en-IN')}</td>
                      <td className="p-4 text-slate-600">{v.expiry_date}</td>
                      <td className="p-4">
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BANK & TAX SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-2xl shadow-sm space-y-6">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#062018]">Bank Payment Details & GST Rate</h3>
              <p className="text-xs text-slate-500">Configure RTGS/NEFT payment recipient details and active tax rates.</p>
            </div>

            {settingsMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                ✓ {settingsMsg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seller GSTIN (Nisargshala)</label>
                <input
                  type="text"
                  disabled
                  value="27ARHPV2783R1ZN"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankSettings.bank_name}
                  onChange={(e) => setBankSettings({ ...bankSettings, bank_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  value={bankSettings.account_holder}
                  onChange={(e) => setBankSettings({ ...bankSettings, account_holder: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    required
                    value={bankSettings.account_number}
                    onChange={(e) => setBankSettings({ ...bankSettings, account_number: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={bankSettings.ifsc_code}
                    onChange={(e) => setBankSettings({ ...bankSettings, ifsc_code: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Configured GST Rate (%)</label>
                  <input
                    type="number"
                    required
                    value={bankSettings.gst_rate}
                    onChange={(e) => setBankSettings({ ...bankSettings, gst_rate: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Voucher Validity (Months)</label>
                  <input
                    type="number"
                    required
                    value={bankSettings.validity_months}
                    onChange={(e) => setBankSettings({ ...bankSettings, validity_months: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="bg-[#062018] hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md"
              >
                {settingsLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
