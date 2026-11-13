import React, { useState, useEffect } from 'react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { Bell, Clock, X, CheckCircle2, ShieldCheck } from 'lucide-react';

export const NotificationPermissionBanner: React.FC = () => {
  const {
    watchlist,
    notificationPermission,
    requestNotificationPermission,
    isNativeNotificationSupported,
    simulateTwoMinuteClosingAlert
  } = useLiveAuction();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const dismissed = sessionStorage.getItem('naija_notif_banner_dismissed');
        if (dismissed === 'true') {
          setIsDismissed(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('naija_notif_banner_dismissed', 'true');
      } catch (e) {
        // ignore
      }
    }
  };

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        setJustEnabled(true);
        setTimeout(() => {
          setIsDismissed(true);
        }, 3500);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  // Only show if browser supports native Notification, permission is not yet decided, and user has items in watchlist
  if (
    !isNativeNotificationSupported ||
    isDismissed ||
    notificationPermission === 'denied' ||
    (notificationPermission === 'granted' && !justEnabled) ||
    watchlist.length === 0
  ) {
    return null;
  }

  return (
    <div
      id="notification-permission-banner"
      className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white border-b border-emerald-700/60 shadow-md relative z-30 transition-all duration-300 animate-in slide-in-from-top-2"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {justEnabled ? (
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Native browser alerts enabled! You will be notified whenever your watchlisted items are within 2 minutes of closing.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>Never miss a winning bid</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Native Browser Push
                </span>
              </p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Get native notifications on your device when items in your watchlist are within 2 minutes of closing.
              </p>
            </div>
          </div>
        )}

        {!justEnabled && (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              id="enable-browser-notifications-btn"
              onClick={handleEnable}
              disabled={isRequesting}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isRequesting ? 'Prompting...' : 'Allow 2-Min Alerts'}</span>
            </button>

            <button
              id="test-2min-alert-quick-btn"
              onClick={() => simulateTwoMinuteClosingAlert()}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold transition"
              title="Test the 2-minute closing alert notification"
            >
              Test Alert
            </button>

            <button
              id="dismiss-notif-banner-btn"
              onClick={handleDismiss}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Dismiss for this session"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
