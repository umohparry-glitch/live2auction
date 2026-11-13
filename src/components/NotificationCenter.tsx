import React from 'react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { Bell, CheckCheck, AlertTriangle, Trophy, Zap, Clock, X } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotifAsRead } = useLiveAuction();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Live Auction Notifications
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notif) => {
              const icons = {
                outbid: <AlertTriangle className="w-4 h-4 text-rose-600" />,
                won: <Trophy className="w-4 h-4 text-amber-600" />,
                extended: <Zap className="w-4 h-4 text-amber-500" />,
                reminder: <Clock className="w-4 h-4 text-blue-600" />,
                system: <Bell className="w-4 h-4 text-emerald-600" />
              };

              return (
                <div
                  key={notif.id}
                  onClick={() => markNotifAsRead(notif.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    notif.read 
                      ? 'bg-white border-slate-200 text-slate-600' 
                      : 'bg-emerald-50/40 border-emerald-200 text-slate-900 font-semibold shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-slate-100 shadow-2xs shrink-0">
                      {icons[notif.type] || icons.system}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-400">
            Real-time auction push alerts are enabled for your active device.
          </p>
        </div>

      </div>
    </div>
  );
};
