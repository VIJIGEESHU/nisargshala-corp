'use client';

import React, { useState } from 'react';

interface CustomExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomExperienceModal({ isOpen, onClose }: CustomExperienceModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    mobile: '',
    gst_number: '',
    team_size: '25',
    preferred_date: '',
    preferred_location: 'Nisargshala',
    experience_type: 'Team Outing & Camping',
    budget_range: '₹50,000 - ₹1,00,000',
    special_requirements: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/outings/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          team_size: parseInt(formData.team_size) || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit enquiry.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit custom enquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#0A2B1B] text-slate-900 dark:text-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-emerald-800/30">
        {/* Header */}
        <div className="px-6 py-5 bg-[#062018] text-white flex justify-between items-center border-b border-emerald-900/50">
          <div>
            <h3 className="text-xl font-bold font-serif text-amber-400">Planning Something Different?</h3>
            <p className="text-xs text-emerald-200 mt-1">Design a tailored corporate retreat or outdoor immersion experience for your team.</p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-2 rounded-lg hover:bg-emerald-900/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <h4 className="text-2xl font-bold font-serif text-emerald-900 dark:text-emerald-300">Enquiry Received!</h4>
              <p className="text-sm text-slate-600 dark:text-emerald-100/80 max-w-md mx-auto">
                Thank you for reaching out. A dedicated Nisargshala Corporate Experience Manager will review your requirements and get back to you with a custom proposal within 24 hours.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md"
                >
                  Close & Continue Exploring
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
                  ⚠️ {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="e.g. Acme Technologies Pvt Ltd"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@company.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Estimated Team Size *</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={formData.team_size}
                    onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Preferred Location</label>
                  <select
                    value={formData.preferred_location}
                    onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Nisargshala">Nisargshala</option>
                    <option value="Western Ghats">Western Ghats</option>
                    <option value="Panchgani">Panchgani</option>
                    <option value="Pawna Lake">Pawna Lake</option>
                    <option value="Lonavala">Lonavala</option>
                    <option value="Custom Site">Custom Destination</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-emerald-200 mb-1">Special Requirements & Activities</label>
                <textarea
                  rows={3}
                  value={formData.special_requirements}
                  onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                  placeholder="Describe your ideal program, accommodation preferences, team goals, or special catering requests..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#062018] border border-slate-300 dark:border-emerald-800/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800/60 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Custom Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
