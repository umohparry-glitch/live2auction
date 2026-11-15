import React, { useEffect, useState } from 'react';
import {
  Bell,
  Bookmark,
  CheckCircle2,
  Eye,
  EyeOff,
  Gavel,
  History,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Trophy,
  User,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

type DashboardTab =
  | 'overview'
  | 'profile'
  | 'active_bids'
  | 'winning_bids'
  | 'lost_auctions'
  | 'watchlist'
  | 'history'
  | 'notifications'
  | 'settings'
  | 'change_password';

interface DashboardPayload {
  stats: {
    activeBidsCount: number;
    wonCount: number;
    lostCount: number;
    totalBidsPlaced: number;
    watchlistCount: number;
    activeSessionsCount: number;
  };
  activeBids: any[];
  winningBids: any[];
  lostAuctions: any[];
  watchlist: any[];
  bidHistory: any[];
  notifications: any[];
}

interface UserDashboardProps {
  onOpenAuction: (auctionId: number) => void;
  onLogoutComplete: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onOpenAuction,
  onLogoutComplete,
}) => {
  const {
    user,
    logout,
    logoutAllDevices,
    refreshSession,
    showToast,
    openAuthModal,
    socket,
  } = useAuth();

  const [tab, setTab] = useState<DashboardTab>('overview');
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // Native notification permission state
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const loadDashboard = async () => {
    try {
      const res = await apiRequest<DashboardPayload>('/api/user/dashboard');
      setData(res);
    } catch (err: any) {
      showToast('error', 'Dashboard Error', err?.message || 'Unable to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setPhone(user.phone);
    setAvatarUrl(user.avatarUrl);
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const reload = () => loadDashboard();
    socket.on('auction:bid_placed', reload);
    socket.on('auction:closed', reload);
    socket.on('notification:user', reload);
    return () => {
      socket.off('auction:bid_placed', reload);
      socket.off('auction:closed', reload);
      socket.off('notification:user', reload);
    };
  }, [socket]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, phone, avatarUrl }),
      });
      await refreshSession();
      showToast('success', 'Profile Saved', res.message);
    } catch (err: any) {
      showToast('error', 'Update Failed', err?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', 'Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: user?.username,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', 'Password Updated', res.message);
      await loadDashboard();
    } catch (err: any) {
      showToast('error', 'Update Failed', err?.message || 'Unable to change password.');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleMarkNotifsRead = async (id?: number) => {
    try {
      await apiRequest('/api/user/notifications/read', {
        method: 'PATCH',
        body: JSON.stringify(id ? { id } : {}),
      });
      await loadDashboard();
    } catch {
      // ignore
    }
  };

  const handleRequestBrowserPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === 'granted') {
      showToast(
        'success',
        'Browser Alerts Enabled',
        'You will receive native alerts when watchlisted items are within 2 minutes of closing.'
      );
    }
  };

  const handleRemoveWatchlist = async (auctionId: number) => {
    try {
      await apiRequest(`/api/auctions/${auctionId}/watchlist`, { method: 'POST' });
      await loadDashboard();
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Unable to update watchlist.');
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await apiRequest<{ verificationTokenPreview?: string }>(
        '/api/auth/resend-verification',
        { method: 'POST' }
      );
      if (res.verificationTokenPreview) {
        openAuthModal('verify');
        showToast(
          'info',
          'Verification Token Ready',
          `Use token: ${res.verificationTokenPreview}`
        );
      }
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Could not issue verification token.');
    }
  };

  if (!user) return null;

  const navItems: { key: DashboardTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: 'Account Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    {
      key: 'active_bids',
      label: 'My Active Bids',
      icon: <Gavel className="w-4 h-4" />,
      count: data?.stats.activeBidsCount,
    },
    {
      key: 'winning_bids',
      label: 'My Winning Bids',
      icon: <Trophy className="w-4 h-4" />,
      count: data?.stats.wonCount,
    },
    {
      key: 'lost_auctions',
      label: 'My Lost Auctions',
      icon: <XCircle className="w-4 h-4" />,
      count: data?.stats.lostCount,
    },
    {
      key: 'watchlist',
      label: 'My Watchlist',
      icon: <Bookmark className="w-4 h-4" />,
      count: data?.stats.watchlistCount,
    },
    { key: 'history', label: 'Auction History', icon: <History className="w-4 h-4" /> },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      count: data?.notifications.filter((n) => !n.isRead).length,
    },
    { key: 'settings', label: 'Account Settings', icon: <Settings className="w-4 h-4" /> },
    { key: 'change_password', label: 'Change Password', icon: <KeyRound className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* User Summary Banner */}
      <div className="border border-slate-200 rounded-2xl p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {user.username[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.fullName}</h1>
              <span className="text-xs text-slate-500">@{user.username}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString()} ·{' '}
              {user.emailVerified ? (
                <span className="text-emerald-700 font-semibold">Email Verified</span>
              ) : (
                <button
                  onClick={handleResendVerification}
                  className="text-amber-700 font-semibold underline cursor-pointer"
                >
                  Verify Email
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 text-center md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
          <div>
            <div className="text-xs text-slate-500">Active Bids</div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {data?.stats.activeBidsCount ?? 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Auctions Won</div>
            <div className="text-xl font-bold text-emerald-700 tabular-nums">
              {data?.stats.wonCount ?? 0}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Bids</div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {data?.stats.totalBidsPlaced ?? 0}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-1">
          <div className="border border-slate-200 rounded-2xl p-2 bg-white space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  tab === item.key
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`tabular-nums text-[11px] ${
                      tab === item.key ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}

            <div className="pt-2 mt-2 border-t border-slate-100">
              <button
                onClick={async () => {
                  await logout();
                  onLogoutComplete();
                }}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <section className="lg:col-span-9 border border-slate-200 rounded-2xl p-6 bg-white min-h-[420px]">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading your account activity...
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-slate-900">Account Overview</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs text-slate-500">Active Bids</div>
                      <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                        {data?.stats.activeBidsCount || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs text-slate-500">Auctions Won</div>
                      <div className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
                        {data?.stats.wonCount || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs text-slate-500">Watchlist Lots</div>
                      <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                        {data?.stats.watchlistCount || 0}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="text-xs text-slate-500">Total Bid Activity</div>
                      <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                        {data?.stats.totalBidsPlaced || 0}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
                    {data?.notifications.slice(0, 4).map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{n.title}</div>
                          <div className="text-slate-600 mt-0.5">{n.message}</div>
                        </div>
                        <span className="text-slate-400 shrink-0">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {(!data?.notifications || data.notifications.length === 0) && (
                      <p className="text-xs text-slate-400">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}

              {tab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg text-sm">
                  <h2 className="text-lg font-bold text-slate-900">My Profile</h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username (Permanent)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.username}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.email}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Profile Image URL
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              )}

              {tab === 'active_bids' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">My Active Bids</h2>
                  {!data?.activeBids.length ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      You have no active bids on live auctions right now.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.activeBids.map((b) => {
                        const isLeading = b.winnerId === user.id;
                        return (
                          <div
                            key={b.auctionId}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 text-sm">
                                {b.auctionTitle}
                              </div>
                              <div className="text-slate-500 mt-0.5 tabular-nums">
                                Your Highest Bid: ₦{Number(b.amount).toLocaleString()} · Current
                                Price: ₦{Number(b.currentBid).toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`font-semibold ${
                                  isLeading ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {isLeading ? 'Winning' : 'Outbid'}
                              </span>
                              <button
                                onClick={() => onOpenAuction(b.auctionId)}
                                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
                              >
                                Open Auction
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'winning_bids' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">My Winning Bids</h2>
                  {!data?.winningBids.length ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No won auctions yet. Keep bidding on live lots!
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.winningBids.map((b) => (
                        <div
                          key={b.auctionId}
                          className="py-3.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {b.auctionTitle}
                            </div>
                            <div className="text-emerald-700 font-semibold mt-0.5 tabular-nums">
                              Won at ₦{Number(b.amount).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => onOpenAuction(b.auctionId)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                          >
                            View Lot
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'lost_auctions' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">My Lost Auctions</h2>
                  {!data?.lostAuctions.length ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No lost auctions recorded.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.lostAuctions.map((b) => (
                        <div
                          key={b.auctionId}
                          className="py-3.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {b.auctionTitle}
                            </div>
                            <div className="text-slate-500 mt-0.5 tabular-nums">
                              Your Bid: ₦{Number(b.amount).toLocaleString()} · Final Hammer: ₦
                              {Number(b.currentBid).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => onOpenAuction(b.auctionId)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                          >
                            View Result
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'watchlist' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">My Watchlist</h2>
                    {notifPerm !== 'granted' && (
                      <button
                        onClick={handleRequestBrowserPush}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Enable 2-Min Closing Browser Alerts
                      </button>
                    )}
                  </div>
                  {!data?.watchlist.length ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      Your watchlist is empty. Click Watch on any auction to track it.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.watchlist.map((w) => (
                        <div
                          key={w.auctionId}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{w.title}</div>
                            <div className="text-slate-500 mt-0.5 tabular-nums">
                              {w.status} · Current Bid: ₦{Number(w.currentBid).toLocaleString()} ·
                              Closes {new Date(w.effectiveEndTime).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenAuction(w.auctionId)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer"
                            >
                              Bid Now
                            </button>
                            <button
                              onClick={() => handleRemoveWatchlist(w.auctionId)}
                              className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'history' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">Auction Bid History</h2>
                  {!data?.bidHistory.length ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No bidding history yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-slate-200 text-slate-500">
                          <tr>
                            <th className="py-2.5 pr-4 font-semibold">Lot</th>
                            <th className="py-2.5 pr-4 font-semibold">Status</th>
                            <th className="py-2.5 pr-4 font-semibold text-right">Bid Amount</th>
                            <th className="py-2.5 font-semibold text-right">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.bidHistory.map((h) => (
                            <tr key={h.bidId} className="hover:bg-slate-50">
                              <td className="py-2.5 pr-4 font-medium text-slate-900">
                                {h.auctionTitle}
                              </td>
                              <td className="py-2.5 pr-4 text-slate-600">{h.auctionStatus}</td>
                              <td className="py-2.5 pr-4 text-right font-mono font-semibold tabular-nums">
                                ₦{Number(h.amount).toLocaleString()}
                              </td>
                              <td className="py-2.5 text-right text-slate-500 tabular-nums">
                                {new Date(h.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">In-App Notifications</h2>
                    <button
                      onClick={() => handleMarkNotifsRead()}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>
                  {!data?.notifications.length ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No notifications available.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkNotifsRead(n.id)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                            n.isRead
                              ? 'border-slate-200 bg-white text-slate-600'
                              : 'border-emerald-200 bg-emerald-50/50 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span>{n.title}</span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="mt-1">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'settings' && (
                <div className="space-y-6 max-w-xl">
                  <h2 className="text-lg font-bold text-slate-900">Account & Session Settings</h2>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-sm font-semibold text-slate-900">
                      Browser Native Notifications (2-Minute Watchlist Alerts)
                    </div>
                    <p className="text-xs text-slate-600">
                      Status: <span className="font-semibold">{notifPerm}</span>
                    </p>
                    {notifPerm !== 'granted' && (
                      <button
                        onClick={handleRequestBrowserPush}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Enable Browser Notifications
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>Active Sessions & Device Security</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      You currently have{' '}
                      <span className="font-semibold tabular-nums">
                        {data?.stats.activeSessionsCount || 1}
                      </span>{' '}
                      active session(s) protected by HTTP-only cookies.
                    </p>
                    <button
                      onClick={async () => {
                        await logoutAllDevices();
                        onLogoutComplete();
                      }}
                      className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Log Out From All Devices
                    </button>
                  </div>
                </div>
              )}

              {tab === 'change_password' && (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md text-sm">
                  <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars with letter & number"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPwd}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{savingPwd ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
