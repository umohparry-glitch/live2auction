import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PublicPagesProps {
  page: 'about' | 'contact' | 'terms' | 'privacy';
}

export const PublicPages: React.FC<PublicPagesProps> = ({ page }) => {
  const { websiteSettings, showToast } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Inquiry Sent', 'Our support team has received your message.');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {page === 'about' && (
        <article className="space-y-6">
          <div className="space-y-2 border-b border-slate-200 pb-6">
            <div className="text-xs font-semibold text-emerald-700">About Us</div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              About {websiteSettings?.siteName || 'NaijaAuction'}
            </h1>
          </div>
          <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {websiteSettings?.aboutUs}
          </p>
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Official Auction Rules</span>
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {websiteSettings?.auctionRules}
            </p>
          </div>
        </article>
      )}

      {page === 'contact' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-5">
            <div>
              <div className="text-xs font-semibold text-emerald-700">Support</div>
              <h1 className="text-3xl font-extrabold text-slate-900 font-display mt-1">
                Contact Us
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                Reach out for verification, escrow assistance, or seller onboarding.
              </p>
            </div>
            <div className="space-y-3 text-sm text-slate-700 pt-2">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                <span>{websiteSettings?.contactEmail || 'support@naijaauction.ng'}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                <span>{websiteSettings?.contactPhone || '+234 800 624 5228'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                <span>
                  {websiteSettings?.contactAddress ||
                    '14 Simbiat Abiola Way, Computer Village, Ikeja, Lagos, Nigeria'}
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleContactSubmit}
            className="md:col-span-7 border border-slate-200 rounded-2xl p-6 bg-white space-y-4 text-sm"
          >
            <h2 className="text-base font-bold text-slate-900">Send a Message</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </button>
          </form>
        </div>
      )}

      {page === 'terms' && (
        <article className="space-y-6">
          <div className="space-y-2 border-b border-slate-200 pb-6">
            <div className="text-xs font-semibold text-emerald-700">Legal</div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              Terms and Conditions
            </h1>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {websiteSettings?.termsAndConditions}
          </div>
          <div className="border-t border-slate-200 pt-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">Auction Rules</h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {websiteSettings?.auctionRules}
            </p>
          </div>
        </article>
      )}

      {page === 'privacy' && (
        <article className="space-y-6">
          <div className="space-y-2 border-b border-slate-200 pb-6">
            <div className="text-xs font-semibold text-emerald-700">Privacy</div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              Privacy Policy
            </h1>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {websiteSettings?.privacyPolicy}
          </div>
        </article>
      )}
    </div>
  );
};
