import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Clock,
  Gavel,
  MessageSquare,
  Package,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { PublicAuctionItem } from './PublicMarketplace';

interface BidRow {
  id: number;
  username: string;
  amount: number;
  isProxy: boolean;
  createdAt: string;
}

interface DiscussionRow {
  id: number;
  username: string;
  message: string;
  createdAt: string;
}

interface PublicAuctionDetailProps {
  auctionId: number;
  onBack: () => void;
}

export const PublicAuctionDetail: React.FC<PublicAuctionDetailProps> = ({
  auctionId,
  onBack,
}) => {
  const { user, socket, requireAuthentication, showToast } = useAuth();
  const [auction, setAuction] = useState<PublicAuctionItem | null>(null);
  const [bids, setBids] = useState<BidRow[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [customBid, setCustomBid] = useState('');
  const [discussionInput, setDiscussionInput] = useState('');
  const [bidding, setBidding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());

  const loadDetail = async () => {
    try {
      const data = await apiRequest<{
        auction: PublicAuctionItem;
        bids: BidRow[];
        discussions: DiscussionRow[];
      }>(`/api/public/auctions/${auctionId}`);
      setAuction(data.auction);
      setBids(data.bids || []);
      setDiscussions(data.discussions || []);
      const minNext =
        data.auction.bidsCount === 0
          ? data.auction.startingPrice
          : data.auction.currentBid + data.auction.bidIncrement;
      setCustomBid(String(minNext));
    } catch (err: any) {
      showToast('error', 'Load Error', err?.message || 'Unable to load auction.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [auctionId]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('auction:join', auctionId);

    const onBid = (payload: any) => {
      if (payload.auctionId !== auctionId) return;
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              currentBid: payload.currentBid,
              bidsCount: payload.bidsCount,
              winnerUsername: payload.winnerUsername,
              effectiveEndTime: payload.effectiveEndTime,
              extensionCount: payload.extensionCount,
            }
          : null
      );
      setBids((prev) => [payload.bid, ...prev]);
    };

    const onDiscussion = (payload: any) => {
      if (payload.auctionId !== auctionId) return;
      setDiscussions((prev) =>
        prev.some((d) => d.id === payload.discussion.id)
          ? prev
          : [...prev, payload.discussion]
      );
    };

    const onClosed = (payload: any) => {
      if (payload.auctionId !== auctionId) return;
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              status: 'ended',
              winnerUsername: payload.winnerUsername,
              winningBidAmount: payload.winningBidAmount,
            }
          : null
      );
    };

    socket.on('auction:bid_placed', onBid);
    socket.on('auction:discussion', onDiscussion);
    socket.on('auction:closed', onClosed);

    return () => {
      socket.off('auction:bid_placed', onBid);
      socket.off('auction:discussion', onDiscussion);
      socket.off('auction:closed', onClosed);
    };
  }, [socket, auctionId]);

  const handlePlaceBid = (bidAmount: number) => {
    requireAuthentication(async () => {
      setBidding(true);
      try {
        const res = await apiRequest<{ message: string; auction: PublicAuctionItem }>(
          `/api/auctions/${auctionId}/bid`,
          {
            method: 'POST',
            body: JSON.stringify({ amount: bidAmount }),
          }
        );
        showToast('success', 'Bid Confirmed', res.message);
        await loadDetail();
      } catch (err: any) {
        showToast('error', 'Bid Rejected', err?.message || 'Could not place bid.');
      } finally {
        setBidding(false);
      }
    });
  };

  const handleToggleWatchlist = () => {
    requireAuthentication(async () => {
      try {
        const res = await apiRequest<{ watchlisted: boolean; message: string }>(
          `/api/auctions/${auctionId}/watchlist`,
          { method: 'POST' }
        );
        setAuction((prev) => (prev ? { ...prev, isWatchlisted: res.watchlisted } : null));
        showToast('success', 'Watchlist', res.message);
      } catch (err: any) {
        showToast('error', 'Error', err?.message || 'Unable to update watchlist.');
      }
    });
  };

  const handleSendDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionInput.trim()) return;
    requireAuthentication(async () => {
      try {
        await apiRequest(`/api/auctions/${auctionId}/discussions`, {
          method: 'POST',
          body: JSON.stringify({ message: discussionInput.trim() }),
        });
        setDiscussionInput('');
      } catch (err: any) {
        showToast('error', 'Message Failed', err?.message || 'Unable to post message.');
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading auction details...
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-600">Auction not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const minNextBid =
    auction.bidsCount === 0
      ? auction.startingPrice
      : auction.currentBid + auction.bidIncrement;

  const targetTime =
    auction.status === 'scheduled'
      ? new Date(auction.startTime).getTime()
      : new Date(auction.effectiveEndTime).getTime();
  const diff = Math.max(0, targetTime - nowMs);
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Auction Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Image Gallery + Description + Specs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100 aspect-4/3">
            {auction.images[activeImgIdx] ? (
              <img
                src={auction.images[activeImgIdx]}
                alt={auction.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Package className="w-12 h-12" />
              </div>
            )}
          </div>

          {auction.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {auction.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImgIdx(i)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                    activeImgIdx === i ? 'border-emerald-600' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${auction.title} thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Lot Description & Specifications</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {auction.description}
            </p>
            {auction.specs && auction.specs.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-700">
                {auction.specs.map((s, idx) => (
                  <li key={idx} className="py-1.5 border-b border-slate-100">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Live Discussions (Public read, Auth required to post) */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Live Lot Discussion</span>
              </h3>
              <span className="text-xs text-slate-500">{discussions.length} messages</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {discussions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No questions or comments yet. Ask about inspection or specs!
                </p>
              ) : (
                discussions.map((d) => (
                  <div key={d.id} className="text-xs bg-slate-50 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between text-slate-500 mb-0.5">
                      <span className="font-semibold text-slate-900">@{d.username}</span>
                      <span>{new Date(d.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700">{d.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendDiscussion} className="flex gap-2">
              <input
                type="text"
                value={discussionInput}
                onChange={(e) => setDiscussionInput(e.target.value)}
                placeholder={
                  user
                    ? 'Ask a question or join the discussion...'
                    : 'Sign in required to participate in live discussions'
                }
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Sticky Bidding & History Module */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-slate-200 rounded-2xl p-6 bg-white space-y-5 sticky top-20">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {auction.code} · {auction.categoryName} · {auction.location}
              </span>
              <button
                onClick={handleToggleWatchlist}
                className={`inline-flex items-center gap-1.5 font-semibold cursor-pointer ${
                  auction.isWatchlisted ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${auction.isWatchlisted ? 'fill-emerald-600 text-emerald-600' : ''}`}
                />
                <span>{auction.isWatchlisted ? 'Watchlisted' : 'Watch'}</span>
              </button>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 font-display">{auction.title}</h1>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
              <div>
                <div className="text-xs text-slate-500">
                  {auction.bidsCount > 0 ? 'Current Highest Bid' : 'Starting Price'}
                </div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                  ₦{auction.currentBid.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1 tabular-nums">
                  Est. Market Value: ₦{auction.estimatedMarketValue.toLocaleString()}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-500">
                  {auction.status === 'scheduled'
                    ? 'Starts In'
                    : auction.status === 'ended'
                    ? 'Final Status'
                    : 'Time Remaining'}
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 tabular-nums mt-0.5 flex items-center justify-end gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>
                    {auction.status === 'ended'
                      ? 'Closed'
                      : `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 tabular-nums">
                  {auction.bidsCount} total bids · +{auction.bidIncrement.toLocaleString()} min step
                </div>
              </div>
            </div>

            {auction.status === 'live' ? (
              <div className="space-y-3">
                {user && auction.winnerUsername === user.username ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                    You are currently the highest bidder (@{user.username}).
                  </div>
                ) : null}

                <button
                  onClick={() => handlePlaceBid(minNextBid)}
                  disabled={bidding}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Gavel className="w-4 h-4" />
                  <span>
                    {bidding ? 'Placing Bid...' : `Quick Bid ₦${minNextBid.toLocaleString()}`}
                  </span>
                </button>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min={minNextBid}
                    step={auction.bidIncrement}
                    value={customBid}
                    onChange={(e) => setCustomBid(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    onClick={() => handlePlaceBid(Number(customBid))}
                    disabled={bidding}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Place Custom Bid
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Anti-sniping active · 100% Escrow Protected</span>
                </div>
              </div>
            ) : auction.status === 'ended' ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-900">Auction Completed</div>
                <div className="text-slate-600">
                  {auction.winnerUsername
                    ? `Winner: @${auction.winnerUsername} at ₦${(auction.winningBidAmount || auction.currentBid).toLocaleString()}`
                    : 'Closed with no winning bids.'}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                This auction is currently <span className="font-semibold">{auction.status}</span>.
                Add it to your watchlist to receive an alert when bidding opens and closes.
              </div>
            )}

            {/* Bid History */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="text-xs font-semibold text-slate-900">Recent Bid Ledger</div>
              {bids.length === 0 ? (
                <p className="text-xs text-slate-400">No bids placed yet. Be the first!</p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {bids.map((b, i) => (
                    <div key={b.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          @{b.username}
                          {i === 0 ? ' (Lead)' : ''}
                        </span>
                      </div>
                      <div className="text-right tabular-nums">
                        <span className="font-semibold text-slate-900">
                          ₦{b.amount.toLocaleString()}
                        </span>
                        <span className="text-slate-400 ml-2">
                          {new Date(b.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
