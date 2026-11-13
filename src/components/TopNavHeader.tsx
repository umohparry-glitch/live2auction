import React, { useState } from 'react';
import {
  Bell,
  Bookmark,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Radio,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type PublicOrAppPage =
  | 'home'
  | 'live_room'
  | 'upcoming'
  | 'completed'
  | 'about'
  | 'contact'
  | 'terms'
  | 'privacy'
  | 'dashboard'
  | 'admin';

interface TopNavHeaderProps {
  currentPage: PublicOrAppPage;
  onNavigate: (page: PublicOrAppPage) => void;
  unreadNotifications?: number;
}

export const TopNavHeader: React.FC<TopNavHeaderProps> = ({
  currentPage,
  onNavigate,
  unreadNotifications = 0,
}) => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    websiteSettings,
    openAuthModal,
    requireAuthentication,
    logout,
  } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const siteName = websiteSettings?.siteName || 'NaijaAuction';

  const handleProtectedNav = (page: PublicOrAppPage) => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    requireAuthentication(() => onNavigate(page));
  };

  const handlePublicNav = (page: PublicOrAppPage) => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            onClick={() => handlePublicNav('home')}
            className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer font-display"
          >
            {websiteSettings?.logoUrl ? (
              <img
                src={websiteSettings.logoUrl}
                alt={siteName}
                className="w-7 h-7 rounded-md object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <span>{siteName}</span>
          </button>

          {/* Zone 2: Concise Single-Line Text Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => handlePublicNav('home')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'home'
                  ? 'border-emerald-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Auctions
            </button>
            <button
              onClick={() => handleProtectedNav('live_room')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'live_room'
                  ? 'border-emerald-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Live Room
            </button>
            <button
              onClick={() => handlePublicNav('upcoming')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'upcoming'
                  ? 'border-emerald-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => handlePublicNav('completed')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'completed'
                  ? 'border-emerald-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handlePublicNav('about')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentPage === 'about'
                  ? 'border-emerald-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              About
            </button>
          </nav>

          {/* Zone 3: Primary Account Action (Desktop) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {!isAuthenticated ? (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Login / Register
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-xs font-semibold text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-6 h-6 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      {user?.username[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate">@{user?.username}</span>
                  {unreadNotifications > 0 && (
                    <span className="text-[11px] font-bold text-rose-600 tabular-nums">
                      ({unreadNotifications})
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <div className="font-semibold text-slate-900 truncate">{user?.fullName}</div>
                      <div className="text-slate-500 truncate">{user?.email}</div>
                    </div>

                    <button
                      onClick={() => handleProtectedNav('dashboard')}
                      className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      <span>User Dashboard</span>
                    </button>

                    <button
                      onClick={() => handleProtectedNav('live_room')}
                      className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Radio className="w-4 h-4 text-rose-600" />
                      <span>Live Auction Room</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full px-3.5 py-2 text-left text-slate-900 font-semibold hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Admin Panel</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={async () => {
                          setAccountMenuOpen(false);
                          await logout();
                          onNavigate('home');
                        }}
                        className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle ONLY (All header buttons/icons inside mobile menu drawer) */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open navigation menu"
              className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 cursor-pointer relative"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {!mobileMenuOpen && unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          {isAuthenticated && user ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {user.username[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-slate-500 truncate">@{user.username}</div>
                </div>
              </div>
              <button
                onClick={() => handleProtectedNav('dashboard')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
              >
                Dashboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="py-2.5 px-3 bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="py-2.5 px-3 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Create Account
              </button>
            </div>
          )}

          <div className="space-y-1 text-sm font-medium">
            <button
              onClick={() => handlePublicNav('home')}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Browse Auctions</span>
            </button>
            <button
              onClick={() => handleProtectedNav('live_room')}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Live Auction Room</span>
              <Radio className="w-4 h-4 text-rose-600" />
            </button>
            <button
              onClick={() => handlePublicNav('upcoming')}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-800 cursor-pointer"
            >
              Upcoming Listings
            </button>
            <button
              onClick={() => handlePublicNav('completed')}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-800 cursor-pointer"
            >
              Completed Auctions
            </button>
            <button
              onClick={() => handleProtectedNav('dashboard')}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>My Watchlist & Notifications</span>
              <div className="flex items-center gap-2 text-slate-500">
                <Bookmark className="w-4 h-4" />
                <Bell className="w-4 h-4" />
              </div>
            </button>
            {isAdmin && (
              <button
                onClick={() => handlePublicNav('admin')}
                className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-900 text-white font-semibold flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Panel</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <button onClick={() => handlePublicNav('about')} className="text-left py-1.5 hover:text-slate-900">
              About Us
            </button>
            <button onClick={() => handlePublicNav('contact')} className="text-left py-1.5 hover:text-slate-900">
              Contact Us
            </button>
            <button onClick={() => handlePublicNav('terms')} className="text-left py-1.5 hover:text-slate-900">
              Terms & Conditions
            </button>
            <button onClick={() => handlePublicNav('privacy')} className="text-left py-1.5 hover:text-slate-900">
              Privacy Policy
            </button>
          </div>

          {isAuthenticated && (
            <button
              onClick={async () => {
                setMobileMenuOpen(false);
                await logout();
                onNavigate('home');
              }}
              className="w-full py-2.5 px-3 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
