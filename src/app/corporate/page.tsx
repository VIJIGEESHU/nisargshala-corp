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
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'vouchers'>('orders');

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    setLoading(true);
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
        setVouchers(payload.vouchers || []);
      }
    } catch (err) {
      console.error('Error fetching HR data:', err);
    } finally {
      setLoading(false);
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
            <CreditCard className="w-4 h-4" /> Payment History
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
            <div className="p-6 border-b border-forest-100">
              <h3 className="font-serif text-lg font-bold text-forest-950">Company Order History</h3>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-forest-500 italic text-xs">
                No orders placed yet. Select experience vouchers on the homepage to place a corporate bulk order.
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

            {orders.length === 0 ? (
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
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-sand-50">
                        <td className="px-6 py-4 font-mono font-bold text-forest-950">{ord.order_number}</td>
                        <td className="px-6 py-4 font-bold text-amber-700">₹{ord.total_amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-semibold">{ord.payment_method || 'RTGS / NEFT'}</td>
                        <td className="px-6 py-4 font-mono text-forest-900">{ord.utr_reference || 'Pending UTR submission'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full font-semibold ${
                            ord.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.payment_status === 'PAID' ? 'Verified' : 'Pending Verification'}
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
      </main>

      <Footer />
    </div>
  );
}
