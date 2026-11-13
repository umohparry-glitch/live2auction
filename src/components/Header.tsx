import React, { useState } from 'react';
import { 
  Radio, 
  Flame, 
  Volume2, 
  VolumeX, 
  Bell, 
  UploadCloud, 
  ShieldCheck, 
  Play, 
  User, 
  ChevronDown,
  Calendar,
  Layers,
  Sparkles,
  Bookmark,
  ShoppingBag, 
  Store, 
  CreditCard,
  Menu,
  X,
  Edit2,
  Check
} from 'lucide-react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { UserRole } from '../types';
import { sounds } from '../utils/audio';

export type AppViewMode = 'room' | 'hub' | 'admin' | 'marketplace' | 'seller' | 'escrow';

interface HeaderProps {
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  openTextUploader: () => void;
  openNotifs: () => void;
  openWatchlist: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  openTextUploader,
  openNotifs,
  openWatchlist
}) => {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    unreadNotifsCount, 
    userRole, 
    setUserRole, 
    userNickname, 
    setUserNickname,
    runAutomatedScenario77,
    isSimulationRunning,
    watchlist
  } = useLiveAuction();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [tempNick, setTempNick] = useState(userNickname);

  const handleSaveNick = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempNick.trim()) {
      setUserNickname(tempNick.trim());
      setIsEditingNick(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) {
      sounds.playUserBidSuccessSound();
    }
  };

  const handleNavClick = (view: AppViewMode) => {
    setCurrentView(view);
    setIsMobileNavOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('room')}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 font-display">
                    NAIJA<span className="text-emerald-600">AUCTION</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    LIVE
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate max-w-[190px] sm:max-w-none">
                  Authoritative Interactive Bidding
                </p>
              </div>
            </button>

            {/* Desktop Navigation Tabs (Hidden on mobile / tablet < lg) */}
            <nav className="hidden lg:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200">
              <button
                onClick={() => setCurrentView('marketplace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'marketplace'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className={`w-3.5 h-3.5 ${currentView === 'marketplace' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Marketplace
              </button>

              <button
                onClick={() => setCurrentView('room')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'room'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${currentView === 'room' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Live Room
              </button>

              <button
                onClick={() => setCurrentView('hub')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'hub'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${currentView === 'hub' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Live Hub & Slots
              </button>

              <button
                onClick={() => setCurrentView('seller')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'seller'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Store className={`w-3.5 h-3.5 ${currentView === 'seller' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Seller Hub
              </button>

              <button
                onClick={() => setCurrentView('escrow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'escrow'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCard className={`w-3.5 h-3.5 ${currentView === 'escrow' ? 'text-emerald-600' : 'text-slate-400'}`} />
                Escrow Orders
              </button>

              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Admin
              </button>
            </nav>
          </div>

          {/* Desktop-Only Action Tools & Header Controls */}
          <div className="hidden lg:flex items-center gap-2.5">
            
            {/* Direct Text File Upload Trigger */}
            <button
              onClick={openTextUploader}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-2xs cursor-pointer"
              title="Upload text file (.txt/.csv) to import products to auction queue"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Upload Text File</span>
            </button>

            {/* Test Scenario (Section 77) Trigger */}
            <button
              onClick={runAutomatedScenario77}
              disabled={isSimulationRunning}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition disabled:opacity-50 cursor-pointer"
              title="Run automated test scenario from Section 77 (proxy bids, anti-sniping, order flow)"
            >
              <Play className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
              <span>{isSimulationRunning ? 'Running Test...' : 'Simulate Sec. 77'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-lg border transition cursor-pointer ${
                soundEnabled 
                  ? 'bg-white border-slate-200 text-emerald-700 hover:bg-slate-50' 
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? 'Mute auction sound effects' : 'Enable auction sound effects (Audio active)'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Watchlist Quick Trigger */}
            <button
              onClick={openWatchlist}
              className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Your Watchlist & Price Alerts"
              aria-label="Watchlist"
            >
              <Bookmark className={`w-4 h-4 ${watchlist.length > 0 ? 'text-emerald-600 fill-emerald-100' : 'text-slate-600'}`} />
              {watchlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {watchlist.length}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={openNotifs}
              className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-bounce">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* User Identity / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  {userNickname[0]?.toUpperCase() || 'U'}
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-bold text-slate-900 truncate max-w-[100px]">
                    {userNickname}
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {userRole}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Dropdown */}
              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Public Bidder Handle
                    </p>
                    {isEditingNick ? (
                      <form onSubmit={handleSaveNick} className="mt-1 flex gap-1">
                        <input
                          type="text"
                          value={tempNick}
                          onChange={(e) => setTempNick(e.target.value)}
                          maxLength={18}
                          className="w-full text-xs font-semibold px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded hover:bg-emerald-700 cursor-pointer"
                        >
                          Save
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-slate-800">{userNickname}</span>
                        <button
                          onClick={() => {
                            setTempNick(userNickname);
                            setIsEditingNick(true);
                          }}
                          className="text-[11px] text-emerald-600 font-semibold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      Identity is protected. Phone/email are never displayed.
                    </p>
                  </div>

                  <div className="py-1">
                    <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Role (Demo Mode)
                    </p>
                    
                    <button
                      onClick={() => {
                        setUserRole('buyer');
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        userRole === 'buyer' ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span>Buyer / Bidder</span>
                      </div>
                      {userRole === 'buyer' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setUserRole('host');
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        userRole === 'host' ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Live Auction Host 🎙️</span>
                      </div>
                      {userRole === 'host' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setUserRole('admin');
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        userRole === 'admin' ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Super Admin / Manager</span>
                      </div>
                      {userRole === 'admin' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Right Bar: ONLY The Menu Toggle Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="relative p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 transition cursor-pointer flex items-center justify-center shadow-2xs"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileNavOpen ? (
                <X className="w-5 h-5 text-slate-900" />
              ) : (
                <Menu className="w-5 h-5 text-slate-900" />
              )}
              
              {/* Unread Alert Indicator dot on mobile menu button */}
              {!isMobileNavOpen && unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-600 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Backdrop & Slide-down Menu Bar */}
      {isMobileNavOpen && (
        <div className="lg:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 top-16 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Menu Bar Container */}
          <div className="relative z-50 border-t border-slate-200 bg-white px-4 py-4 shadow-2xl space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
            
            {/* 1. Mobile User Profile & Identity Block */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
                    {userNickname[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>{userNickname}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                        {userRole}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Public Bidder Handle
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setTempNick(userNickname);
                    setIsEditingNick(!isEditingNick);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px]">{isEditingNick ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              {/* Inline Nickname Editor */}
              {isEditingNick && (
                <form onSubmit={handleSaveNick} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={tempNick}
                    onChange={(e) => setTempNick(e.target.value)}
                    maxLength={18}
                    className="flex-1 text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Enter nickname"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </form>
              )}

              {/* Demo Role Switcher Pills */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Role Perspective (Demo Switch)
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setUserRole('buyer')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition ${
                      userRole === 'buyer'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Buyer</span>
                  </button>

                  <button
                    onClick={() => setUserRole('host')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition ${
                      userRole === 'host'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Host 🎙️</span>
                  </button>

                  <button
                    onClick={() => setUserRole('admin')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition ${
                      userRole === 'admin'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Mobile Quick Icons / Actions Row (Watchlist, Alerts, Sound FX) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                Quick Tools & Alerts
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Watchlist */}
                <button
                  onClick={() => {
                    openWatchlist();
                    setIsMobileNavOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer relative shadow-2xs transition"
                >
                  <div className="relative">
                    <Bookmark className={`w-5 h-5 ${watchlist.length > 0 ? 'text-emerald-600 fill-emerald-100' : 'text-slate-600'}`} />
                    {watchlist.length > 0 && (
                      <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold ring-2 ring-white">
                        {watchlist.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Watchlist</span>
                </button>

                {/* Notification Alerts */}
                <button
                  onClick={() => {
                    openNotifs();
                    setIsMobileNavOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer relative shadow-2xs transition"
                >
                  <div className="relative">
                    <Bell className="w-5 h-5 text-slate-700" />
                    {unreadNotifsCount > 0 && (
                      <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold ring-2 ring-white animate-bounce">
                        {unreadNotifsCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Alerts</span>
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={handleToggleSound}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs transition ${
                    soundEnabled
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-[11px] font-bold">
                    {soundEnabled ? 'Audio ON' : 'Audio Muted'}
                  </span>
                </button>
              </div>
            </div>

            {/* 3. Navigation Views Menu */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                Auction Views & Pages
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavClick('room')}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition cursor-pointer ${
                    currentView === 'room'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Radio className={`w-4 h-4 shrink-0 ${currentView === 'room' ? 'text-white' : 'text-emerald-600'}`} />
                  <div className="leading-tight">
                    <div>Live Room</div>
                    <div className={`text-[10px] font-normal ${currentView === 'room' ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Active Bidding
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('marketplace')}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition cursor-pointer ${
                    currentView === 'marketplace'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingBag className={`w-4 h-4 shrink-0 ${currentView === 'marketplace' ? 'text-white' : 'text-slate-600'}`} />
                  <div className="leading-tight">
                    <div>Marketplace</div>
                    <div className={`text-[10px] font-normal ${currentView === 'marketplace' ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Pre-Bid Catalog
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('hub')}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition cursor-pointer ${
                    currentView === 'hub'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className={`w-4 h-4 shrink-0 ${currentView === 'hub' ? 'text-white' : 'text-slate-600'}`} />
                  <div className="leading-tight">
                    <div>Live Hub</div>
                    <div className={`text-[10px] font-normal ${currentView === 'hub' ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Rooms & Slots
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('seller')}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition cursor-pointer ${
                    currentView === 'seller'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Store className={`w-4 h-4 shrink-0 ${currentView === 'seller' ? 'text-white' : 'text-slate-600'}`} />
                  <div className="leading-tight">
                    <div>Seller Hub</div>
                    <div className={`text-[10px] font-normal ${currentView === 'seller' ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Stats & Products
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('escrow')}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition cursor-pointer ${
                    currentView === 'escrow'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className={`w-4 h-4 shrink-0 ${currentView === 'escrow' ? 'text-white' : 'text-slate-600'}`} />
                  <div className="leading-tight">
                    <div>Escrow Orders</div>
                    <div className={`text-[10px] font-normal ${currentView === 'escrow' ? 'text-emerald-100' : 'text-slate-500'}`}>
                      Track Delivery
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavClick('admin')}
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200/80 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Layers className={`w-4 h-4 shrink-0 ${currentView === 'admin' ? 'text-white' : 'text-slate-600'}`} />
                  <div className="leading-tight">
                    <div>Super Admin</div>
                    <div className={`text-[10px] font-normal ${currentView === 'admin' ? 'text-emerald-100' : 'text-slate-500'}`}>
                      System Controls
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Utilities & Scenario Testing */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                Tools & Import
              </div>

              <button
                onClick={() => {
                  openTextUploader();
                  setIsMobileNavOpen(false);
                }}
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 flex items-center gap-2.5 hover:bg-slate-50 cursor-pointer shadow-2xs transition"
              >
                <UploadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-left">
                  <div>Import Products via Text File</div>
                  <div className="text-[10px] font-normal text-slate-500">Bulk upload .txt / .csv product queues</div>
                </div>
              </button>

              <button
                onClick={() => {
                  runAutomatedScenario77();
                  setIsMobileNavOpen(false);
                }}
                disabled={isSimulationRunning}
                className="w-full py-2.5 px-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs font-bold text-amber-900 flex items-center gap-2.5 hover:bg-amber-100 disabled:opacity-50 cursor-pointer shadow-2xs transition"
              >
                <Play className="w-4 h-4 text-amber-700 fill-amber-700 shrink-0" />
                <div className="text-left">
                  <div>{isSimulationRunning ? 'Simulating Section 77...' : 'Run Automated Scenario (Sec. 77)'}</div>
                  <div className="text-[10px] font-normal text-amber-700">Proxy bids, anti-sniping timer & auto-checkout</div>
                </div>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
