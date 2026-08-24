'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatSafeDate } from '@/lib/dateUtils';
import {
  LayoutDashboard,
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
  LogOut
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'vouchers' | 'catalogue' | 'settings' | 'audit'>('orders');
  
  // Data state
  const [orders, setOrders] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAdminAuthAndFetch();
  }, []);

  const checkAdminAuthAndFetch = async () => {
    setLoading(true);
    try {
      // Check admin session
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

      // Fetch real data from backend API
      const dataRes = await fetch('/api/admin/data');
      if (dataRes.ok) {
        const payload = await dataRes.json();
        setOrders(payload.orders || []);
        setVouchers(payload.vouchers || []);
        setExperiences(payload.experiences || []);
        setAuditLogs(payload.auditLogs || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    if (!confirm('Are you sure you want to confirm payment for this order? This will generate and activate the distinct voucher instruments.')) {
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

      alert(`Success! ${data.vouchers_count} distinct individual vouchers generated & activated.`);
      checkAdminAuthAndFetch();
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
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-forest-800 animate-spin mx-auto" />
          <div className="text-xs font-semibold text-forest-900">Verifying Admin Session & Loading Portal Data...</div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalSales = orders.filter((o) => o.payment_status === 'PAID').reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const activeVouchersCount = vouchers.filter((v) => v.status === 'ACTIVE').length;
  const redeemedVouchersCount = vouchers.filter((v) => v.status === 'REDEEMED').length;
  const pendingVerificationCount = orders.filter((o) => o.payment_status === 'AWAITING_VERIFICATION').length;

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 border-b border-forest-200 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-forest-600/30 bg-white shrink-0">
              <img src="/images/nisargshala-logo.png" alt="Nisargshala Logo" className="object-contain w-full h-full p-0.5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Nisargshala Admin Operations Portal
              </div>
              <h1 className="font-serif text-3xl font-bold text-forest-950">
                Corporate Voucher Operations
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={checkAdminAuthAndFetch}
              className="inline-flex items-center gap-2 bg-white border border-forest-200 text-forest-800 hover:bg-forest-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600" />
              Admin Logout
            </button>
          </div>
        </div>

        {/* METRICS STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Verified Corporate Sales</div>
            <div className="text-3xl font-serif font-bold text-forest-950">₹{totalSales.toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-emerald-600 mt-2 font-medium">✓ Verified RTGS/NEFT Collections</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Active Voucher Instruments</div>
            <div className="text-3xl font-serif font-bold text-amber-600">{activeVouchersCount}</div>
            <div className="text-[11px] text-forest-500 mt-2 font-medium">Distinct active secret codes</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Redeemed Vouchers</div>
            <div className="text-3xl font-serif font-bold text-forest-800">{redeemedVouchersCount}</div>
            <div className="text-[11px] text-forest-500 mt-2 font-medium">Redeemed on nisargshala.in</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-forest-200 shadow-sm">
            <div className="text-xs text-forest-600 font-semibold uppercase mb-1">Pending Verification</div>
            <div className="text-3xl font-serif font-bold text-amber-700">{pendingVerificationCount}</div>
            <div className="text-[11px] text-amber-600 mt-2 font-medium">UTR submitted, awaiting confirmation</div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex border-b border-forest-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-forest-600 hover:text-forest-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Corporate Orders ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('vouchers')}
            className={`pb-4 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'vouchers'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-forest-600 hover:text-forest-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Voucher Inventory ({vouchers.length})
          </button>

          <button
            onClick={() => setActiveTab('catalogue')}
            className={`pb-4 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'catalogue'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-forest-600 hover:text-forest-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Experience Catalogue
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-6 font-semibold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-forest-600 hover:text-forest-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Bank & Validity Settings
          </button>
        </div>

        {/* TAB 1: CORPORATE ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-forest-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-forest-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-serif text-lg font-bold text-forest-950">Corporate Orders & Payment Verification</h3>
              <input
                type="text"
                placeholder="Search order or UTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-sand-50 border border-forest-200 rounded-lg text-xs"
              />
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-forest-500 italic text-xs">
                No corporate orders found. Orders submitted on the corporate portal will appear here in real time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-100 text-forest-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Order Ref</th>
                      <th className="px-6 py-4">Company</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">UTR Reference</th>
                      <th className="px-6 py-4">Payment Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-sand-50">
                        <td className="px-6 py-4 font-mono font-bold text-forest-950">{ord.order_number}</td>
                        <td className="px-6 py-4 font-semibold">{ord.company?.company_name || ord.company_name || 'Corporate Client'}</td>
                        <td className="px-6 py-4">{ord.company?.contact_person || 'N/A'}<br/><span className="text-[10px] text-forest-500">{ord.company?.email}</span></td>
                        <td className="px-6 py-4 font-bold text-amber-700">₹{ord.total_amount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-mono text-[11px]">{ord.utr_reference || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {ord.payment_status === 'AWAITING_VERIFICATION' && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-semibold">
                              <Clock className="w-3 h-3" /> Awaiting Verification
                            </span>
                          )}
                          {ord.payment_status === 'PAID' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Verified & Paid
                            </span>
                          )}
                          {ord.payment_status === 'PENDING_PAYMENT' && (
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-semibold">
                              Pending Payment
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {ord.payment_status !== 'PAID' && (
                            <button
                              onClick={() => handleConfirmPayment(ord.id)}
                              disabled={actionLoading}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg font-semibold shadow-sm text-[11px]"
                            >
                              Confirm Payment & Activate
                            </button>
                          )}
                          {ord.payment_status === 'PAID' && (
                            <a
                              href={`/api/vouchers/download?order_id=${ord.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 bg-forest-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                            >
                              <Download className="w-3 h-3" /> Download All ZIP
                            </a>
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

        {/* TAB 2: VOUCHER INVENTORY */}
        {activeTab === 'vouchers' && (
          <div className="bg-white rounded-2xl border border-forest-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-forest-100 flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-forest-950">Distinct Voucher Inventory</h3>
              <div className="text-xs text-forest-600">Total: {vouchers.length} individual voucher instruments</div>
            </div>

            {vouchers.length === 0 ? (
              <div className="p-12 text-center text-forest-500 italic text-xs">
                No active vouchers in database. Confirm payment on an order to generate individual vouchers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-100 text-forest-800 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-6 py-4">Voucher Ref</th>
                      <th className="px-6 py-4">Secret Redemption Code</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Face Value</th>
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
                        <td className="px-6 py-4 font-bold">₹{vch.voucher_value.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">{formatSafeDate(vch.expiry_date)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full font-semibold ${
                            vch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                            vch.status === 'REDEEMED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-700'
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

        {/* TAB 3: CATALOGUE */}
        {activeTab === 'catalogue' && (
          <div className="bg-white rounded-2xl border border-forest-200 shadow-sm p-8">
            <h3 className="font-serif text-lg font-bold text-forest-950 mb-2">Configurable Retail Experience Pricing</h3>
            <p className="text-xs text-forest-600 mb-6">
              Retail experience prices can be updated here by authorized administrators without altering locked corporate voucher face values.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {experiences.map((exp) => (
                <div key={exp.code} className="p-4 bg-sand-50 rounded-xl border border-sand-200 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-forest-950">{exp.title}</div>
                    <div className="text-[11px] text-forest-500 font-mono">Code: {exp.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-base text-amber-700">₹{exp.current_price.toLocaleString('en-IN')}</div>
                    <button className="text-[11px] text-forest-600 hover:text-forest-900 underline flex items-center gap-1 mt-1">
                      <Edit className="w-3 h-3" /> Edit Price
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-forest-200 shadow-sm p-8 max-w-2xl">
            <h3 className="font-serif text-lg font-bold text-forest-950 mb-6">Bank Payment & Validity Settings</h3>
            <form className="space-y-4 text-xs">
              <div>
                <label className="block text-forest-800 font-semibold mb-1">Account Holder Name</label>
                <input type="text" defaultValue="Nisargshala" className="w-full px-3 py-2 bg-sand-50 border rounded-lg" />
              </div>
              <div>
                <label className="block text-forest-800 font-semibold mb-1">Bank Name</label>
                <input type="text" defaultValue="HDFC Bank" className="w-full px-3 py-2 bg-sand-50 border rounded-lg" />
              </div>
              <div>
                <label className="block text-forest-800 font-semibold mb-1">Account Number</label>
                <input type="text" defaultValue="50200012345678" className="w-full px-3 py-2 bg-sand-50 border rounded-lg font-mono" />
              </div>
              <div>
                <label className="block text-forest-800 font-semibold mb-1">IFSC Code</label>
                <input type="text" defaultValue="HDFC0001234" className="w-full px-3 py-2 bg-sand-50 border rounded-lg font-mono uppercase" />
              </div>
              <div>
                <label className="block text-forest-800 font-semibold mb-1">Default Voucher Validity (Months)</label>
                <input type="number" defaultValue={12} className="w-full px-3 py-2 bg-sand-50 border rounded-lg" />
              </div>
              <button type="button" className="bg-forest-800 text-white px-6 py-2.5 rounded-lg font-semibold">Save Settings</button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
