import React, { useState } from 'react';
import {
  Bell,
  Bookmark,
  ChevronDown,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
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
  | 'post_product'
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

  // Hide global bottom bar inside authenticated LiveAuctionRoom (which has its own sticky bid bar)
  const showMobileBottomBar = !(currentPage === 'live_room' && isAuthenticated);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 overflow-x-clip">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 h-14 sm:h-16 min-w-0">
            {/* Zone 1: Single-line Brand Wordmark */}
            <button
              onClick={() => handlePublicNav('home')}
              className="text-[13px] sm:text-lg font-extrabold tracking-tight text-slate-900 min-w-0 flex-1 lg:flex-none flex items-center gap-1.5 sm:gap-2 cursor-pointer font-display min-h-[38px]"
            >
              {websiteSettings?.logoUrl ? (
                <img
                  src={websiteSettings.logoUrl}
                  alt={siteName}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-md object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="truncate">{siteName}</span>
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

            {/* Zone 3: Primary Account & Post Product Actions (Desktop) */}
            <div className="hidden lg:flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleProtectedNav('post_product')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer border ${
                  currentPage === 'post_product'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <PackagePlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Post Product for Bidding</span>
              </button>
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

            {/* Mobile & Tablet Visible Quick Actions + Menu Button (Fits all mobile widths) */}
            <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => handleProtectedNav('post_product')}
                className={`px-2 sm:px-2.5 py-1.5 min-h-[38px] text-[11px] sm:text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer border ${
                  currentPage === 'post_product'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <PackagePlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="sm:hidden">Post</span>
                <span className="hidden sm:inline">Post Lot</span>
              </button>

              {!isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="px-2 sm:px-3 py-1.5 min-h-[38px] text-[11px] sm:text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Login
                </button>
              ) : (
                <button
                  onClick={() => handleProtectedNav('dashboard')}
                  className={`px-2 py-1.5 min-h-[38px] rounded-lg border text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                    currentPage === 'dashboard'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-bold shrink-0">
                    {user?.username[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="max-w-[52px] sm:max-w-[96px] truncate">@{user?.username}</span>
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="px-2 sm:px-2.5 py-1.5 min-h-[38px] rounded-lg border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 cursor-pointer relative inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold shrink-0 whitespace-nowrap"
              >
                {mobileMenuOpen ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                <span>{mobileMenuOpen ? 'Close' : 'Menu'}</span>
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
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-xl max-h-[calc(100vh-7.5rem)] overflow-y-auto">
            {isAuthenticated && user ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
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
                  className="px-3.5 py-2 min-h-[40px] bg-emerald-600 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                >
                  My Dashboard
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="py-2.5 px-3 min-h-[44px] bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="py-2.5 px-3 min-h-[44px] border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="space-y-1 text-sm font-medium">
              <button
                onClick={() => handlePublicNav('home')}
                className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg flex items-center justify-between cursor-pointer ${
                  currentPage === 'home'
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span>Browse Auctions</span>
              </button>
              <button
                onClick={() => handleProtectedNav('live_room')}
                className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg flex items-center justify-between cursor-pointer ${
                  currentPage === 'live_room'
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span>Live Auction Room</span>
                <Radio className="w-4 h-4 text-rose-600" />
              </button>
              <button
                onClick={() => handleProtectedNav('post_product')}
                className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg font-semibold flex items-center justify-between cursor-pointer ${
                  currentPage === 'post_product'
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900'
                }`}
              >
                <span>Post Product for Bidding</span>
                <PackagePlus className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => handlePublicNav('upcoming')}
                className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg flex items-center justify-between cursor-pointer ${
                  currentPage === 'upcoming'
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span>Upcoming Listings</span>
              </button>
              <button
                onClick={() => handlePublicNav('completed')}
                className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg flex items-center justify-between cursor-pointer ${
                  currentPage === 'completed'
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span>Completed Auctions</span>
              </button>
              <button
                onClick={() => handleProtectedNav('dashboard')}
                className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg flex items-center justify-between cursor-pointer ${
                  currentPage === 'dashboard'
                    ? 'bg-emerald-50 text-emerald-900 font-semibold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
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
                  className="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-900 text-white font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <button
                onClick={() => handlePublicNav('about')}
                className="text-left py-2 px-2 min-h-[40px] rounded hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                About Us
              </button>
              <button
                onClick={() => handlePublicNav('contact')}
                className="text-left py-2 px-2 min-h-[40px] rounded hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                Contact Us
              </button>
              <button
                onClick={() => handlePublicNav('terms')}
                className="text-left py-2 px-2 min-h-[40px] rounded hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => handlePublicNav('privacy')}
                className="text-left py-2 px-2 min-h-[40px] rounded hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
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
                className="w-full py-2.5 px-3 min-h-[44px] border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Mobile Fixed Thumb-Zone Bottom Navigation Bar */}
      {showMobileBottomBar && (
        <nav
          aria-label="Mobile quick navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg"
        >
          <div className="grid grid-cols-5 items-center h-14 px-1">
            <button
              onClick={() => handlePublicNav('home')}
              className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-semibold transition-colors cursor-pointer ${
                currentPage === 'home' ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gavel className="w-4 h-4 mb-0.5" />
              <span>Auctions</span>
            </button>

            <button
              onClick={() => handleProtectedNav('live_room')}
              className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-semibold transition-colors cursor-pointer ${
                currentPage === 'live_room'
                  ? 'text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Radio className="w-4 h-4 mb-0.5 text-rose-600" />
              <span>Live Room</span>
            </button>

            <button
              onClick={() => handleProtectedNav('post_product')}
              className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-semibold transition-colors cursor-pointer ${
                currentPage === 'post_product'
                  ? 'text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackagePlus className="w-4 h-4 mb-0.5 text-emerald-600" />
              <span>Post Lot</span>
            </button>

            <button
              onClick={() =>
                isAuthenticated ? handleProtectedNav('dashboard') : openAuthModal('login')
              }
              className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-semibold transition-colors cursor-pointer ${
                currentPage === 'dashboard'
                  ? 'text-emerald-700'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAuthenticated ? (
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
              ) : (
                <User className="w-4 h-4 mb-0.5" />
              )}
              <span>{isAuthenticated ? 'Account' : 'Login'}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`flex flex-col items-center justify-center min-h-[44px] text-[10px] font-semibold transition-colors cursor-pointer ${
                mobileMenuOpen ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 mb-0.5" /> : <Menu className="w-4 h-4 mb-0.5" />}
              <span>{mobileMenuOpen ? 'Close' : 'More'}</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
