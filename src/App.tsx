import React, { useEffect, useState } from 'react';
import { CheckCircle2, Info, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LiveAuctionProvider, useLiveAuction } from './context/LiveAuctionContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import { TopNavHeader, PublicOrAppPage } from './components/TopNavHeader';
import { PublicMarketplace, PublicAuctionItem } from './components/PublicMarketplace';
import { PublicAuctionDetail } from './components/PublicAuctionDetail';
import { PublicPages } from './components/PublicPages';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboardFull } from './components/AdminDashboardFull';
import { LiveAuctionRoom } from './components/LiveAuctionRoom';
import { AuthModal } from './components/AuthModal';
import { PreBidModal } from './components/PreBidModal';
import { TextFileUploaderModal } from './components/TextFileUploaderModal';
import { WinnerModal } from './components/WinnerModal';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { AuctionProduct } from './types';

function AppShell() {
  const {
    user,
    isAuthenticated,
    isLoading,
    websiteSettings,
    toast,
    dismissToast,
    requireAuthentication,
  } = useAuth();

  const {
    setUserNickname,
    winnerModalProduct,
    closeWinnerModal,
  } = useLiveAuction();

  const [currentPage, setCurrentPage] = useState<PublicOrAppPage>('home');
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(null);
  const [preBidProduct, setPreBidProduct] = useState<AuctionProduct | null>(null);
  const [isTextUploaderOpen, setIsTextUploaderOpen] = useState(false);

  // Sync authenticated username into LiveAuctionContext handle
  useEffect(() => {
    if (user?.username) {
      setUserNickname(user.username);
    }
  }, [user?.username, setUserNickname]);

  const navigateTo = (page: PublicOrAppPage) => {
    setSelectedAuctionId(null);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuction = (auctionId: number) => {
    setSelectedAuctionId(auctionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const siteName = websiteSettings?.siteName || 'NaijaAuction';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-sm text-slate-500">
        Loading {siteName}...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      <TopNavHeader currentPage={currentPage} onNavigate={navigateTo} />

      {/* Watchlist 2-min Browser Notification Banner */}
      {isAuthenticated && <NotificationPermissionBanner />}

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full px-4">
          <div
            className={`p-4 rounded-xl border shadow-xl bg-white flex items-start gap-3 text-xs ${
              toast.type === 'error'
                ? 'border-rose-200'
                : toast.type === 'warning'
                ? 'border-amber-200'
                : 'border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900">{toast.title}</div>
              <div className="text-slate-600 mt-0.5">{toast.message}</div>
            </div>
            <button
              onClick={dismissToast}
              aria-label="Close notification"
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {selectedAuctionId !== null ? (
          <PublicAuctionDetail
            auctionId={selectedAuctionId}
            onBack={() => setSelectedAuctionId(null)}
          />
        ) : (
          <>
            {(currentPage === 'home' ||
              currentPage === 'upcoming' ||
              currentPage === 'completed') && (
              <PublicMarketplace
                initialStatusFilter={
                  currentPage === 'upcoming'
                    ? 'scheduled'
                    : currentPage === 'completed'
                    ? 'ended'
                    : 'all'
                }
                onSelectAuction={(a: PublicAuctionItem) => handleOpenAuction(a.id)}
                onGoToLiveRoom={() => navigateTo('live_room')}
              />
            )}

            {currentPage === 'live_room' && (
              isAuthenticated ? (
                <LiveAuctionRoom
                  openPreBidModal={(p) => setPreBidProduct(p)}
                  openTextUploader={() => setIsTextUploaderOpen(true)}
                />
              ) : (
                <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
                  <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Authentication Required for Live Room
                  </h2>
                  <p className="text-sm text-slate-600">
                    Create a free account or log in to participate in our live auctions.
                  </p>
                  <button
                    onClick={() => requireAuthentication(() => navigateTo('live_room'))}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Login or Create Account
                  </button>
                </div>
              )
            )}

            {(currentPage === 'about' ||
              currentPage === 'contact' ||
              currentPage === 'terms' ||
              currentPage === 'privacy') && <PublicPages page={currentPage} />}

            {currentPage === 'dashboard' && (
              isAuthenticated ? (
                <UserDashboard
                  onOpenAuction={(id) => {
                    setCurrentPage('home');
                    handleOpenAuction(id);
                  }}
                  onLogoutComplete={() => navigateTo('home')}
                />
              ) : (
                <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Sign In to View Dashboard</h2>
                  <p className="text-sm text-slate-600">
                    Create a free account or log in to participate in our live auctions.
                  </p>
                  <button
                    onClick={() => requireAuthentication(() => navigateTo('dashboard'))}
                    className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Login / Register
                  </button>
                </div>
              )
            )}

            {currentPage === 'admin' && <AdminDashboardFull />}
          </>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {siteName}. Protected Escrow & Server-Authoritative Live Bidding.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button onClick={() => navigateTo('about')} className="hover:text-slate-900 cursor-pointer">
              About Us
            </button>
            <button onClick={() => navigateTo('contact')} className="hover:text-slate-900 cursor-pointer">
              Contact Us
            </button>
            <button onClick={() => navigateTo('terms')} className="hover:text-slate-900 cursor-pointer">
              Terms & Conditions
            </button>
            <button onClick={() => navigateTo('privacy')} className="hover:text-slate-900 cursor-pointer">
              Privacy Policy
            </button>
            <button onClick={() => navigateTo('admin')} className="hover:text-slate-900 font-semibold cursor-pointer">
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Global Auth Gate & Live Room Modals */}
      <AuthModal />
      <PreBidModal product={preBidProduct} onClose={() => setPreBidProduct(null)} />
      <TextFileUploaderModal
        isOpen={isTextUploaderOpen}
        onClose={() => setIsTextUploaderOpen(false)}
      />
      <WinnerModal product={winnerModalProduct} onClose={closeWinnerModal} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LiveAuctionProvider>
        <MarketplaceProvider>
          <AppShell />
        </MarketplaceProvider>
      </LiveAuctionProvider>
    </AuthProvider>
  );
}
