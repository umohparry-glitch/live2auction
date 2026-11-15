import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Clock, 
  Eye, 
  Users, 
  ShieldCheck, 
  Truck, 
  Share2, 
  Zap, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Smile, 
  Pin, 
  Trash2, 
  ChevronRight, 
  Sparkles,
  Info,
  DollarSign,
  Maximize2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Radio,
  Calendar
} from 'lucide-react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { motion, AnimatePresence } from 'motion/react';
import { speechAnnouncer } from '../utils/speechAnnouncer';
import { RecentBidsTicker } from './RecentBidsTicker';
import { SlotProductQueue } from './SlotProductQueue';
import { SlotWeekScheduleModal } from './SlotWeekScheduleModal';
import { AuctionCountdownTimer } from './AuctionCountdownTimer';

interface LiveAuctionRoomProps {
  openPreBidModal: (product: any) => void;
  openTextUploader: () => void;
}

export const LiveAuctionRoom: React.FC<LiveAuctionRoomProps> = ({
  openPreBidModal,
  openTextUploader
}) => {
  const {
    categoryRooms,
    activeRoomId,
    activeRoom,
    activeSlotId,
    activeSlot,
    setActiveRoomId,
    setActiveSlotId,
    activeProductIndex,
    currentEvent,
    activeProduct,
    nextProduct,
    currentBid,
    bidHistory,
    timeRemaining,
    isExtended,
    transitionCountdown,
    isUserWinning,
    hasUserBiddedOnActive,
    userMaxBid,
    placeBid,
    setProxyMaxBid,
    chatMessages,
    sendChatMessage,
    reactions,
    sendReaction,
    pinChatMessage,
    deleteChatMessage,
    userRole,
    userNickname,
    activeAnnouncement,
    hostAction,
    isPaused
  } = useLiveAuction();

  // Local state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isWeekScheduleModalOpen, setIsWeekScheduleModalOpen] = useState(false);
  const [weekScheduleTargetSlotId, setWeekScheduleTargetSlotId] = useState<string | undefined>(undefined);
  const [customBidInput, setCustomBidInput] = useState('');
  const [showCustomBidConfirm, setShowCustomBidConfirm] = useState(false);
  const [pendingCustomBid, setPendingCustomBid] = useState<number | null>(null);
  const [bidErrorMessage, setBidErrorMessage] = useState<string | null>(null);
  const [showMaxBidModal, setShowMaxBidModal] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [prevBid, setPrevBid] = useState(currentBid);
  const [pricePulsing, setPricePulsing] = useState(false);

  // Helper to open week range schedule & items catalog modal
  const handleOpenWeekSchedule = (slotId?: string) => {
    setWeekScheduleTargetSlotId(slotId || activeSlot.id);
    setIsWeekScheduleModalOpen(true);
  };

  // SpeechSynthesis Voice Announcer State
  const [isVoiceAnnouncerEnabled, setIsVoiceAnnouncerEnabled] = useState<boolean>(() => speechAnnouncer.isVoiceEnabled());
  const [isSpeakingAnnouncement, setIsSpeakingAnnouncement] = useState<boolean>(false);
  const [currentSpokenPhrase, setCurrentSpokenPhrase] = useState<string>('');
  const lastAnnouncedBidIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef<boolean>(true);

  // Subscribe to speechAnnouncer speaking changes
  useEffect(() => {
    const unsubscribe = speechAnnouncer.subscribe((speaking, phrase) => {
      setIsSpeakingAnnouncement(speaking);
      setCurrentSpokenPhrase(phrase);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleVoiceAnnouncer = () => {
    const nextVal = !isVoiceAnnouncerEnabled;
    setIsVoiceAnnouncerEnabled(nextVal);
    speechAnnouncer.setVoiceEnabled(nextVal);
    if (nextVal) {
      speechAnnouncer.testVoice();
    }
  };

  // Announce incoming bids via SpeechSynthesis when a new person bids
  useEffect(() => {
    if (!bidHistory || bidHistory.length === 0) return;

    const latestBid = bidHistory[bidHistory.length - 1];
    if (!latestBid) return;

    // Avoid announcing historical bids on first render
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      lastAnnouncedBidIdRef.current = latestBid.id;
      return;
    }

    // Check if this is a new bid we haven't announced yet
    if (latestBid.id !== lastAnnouncedBidIdRef.current) {
      lastAnnouncedBidIdRef.current = latestBid.id;
      if (isVoiceAnnouncerEnabled) {
        speechAnnouncer.announceBid(latestBid.amount, latestBid.maskedBidder, latestBid.isCurrentUser);
      }
    }
  }, [bidHistory, isVoiceAnnouncerEnabled]);

  // Announce item sold if product concludes
  useEffect(() => {
    if (activeProduct?.status === 'sold' && activeProduct.winner && isVoiceAnnouncerEnabled) {
      speechAnnouncer.announceSold(activeProduct.winner.bidAmount, activeProduct.winner.nickname, activeProduct.title);
    }
  }, [activeProduct?.status, activeProduct?.winner, isVoiceAnnouncerEnabled, activeProduct?.title]);

  // Trigger pulse animation when current bid changes
  useEffect(() => {
    if (currentBid !== prevBid) {
      setPricePulsing(true);
      const timer = setTimeout(() => setPricePulsing(false), 800);
      setPrevBid(currentBid);
      return () => clearTimeout(timer);
    }
  }, [currentBid, prevBid]);

  if (!activeProduct) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Product in Auction Room</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
          All items in the current queue have concluded or the auction is awaiting scheduled start.
        </p>
        <button
          onClick={openTextUploader}
          className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition shadow-xs"
        >
          Upload Products via Text File
        </button>
      </div>
    );
  }

  const nextMinBid = currentBid + activeProduct.bidIncrement;

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Handle Quick Bid
  const handleQuickBid = (incrementAmount: number) => {
    setBidErrorMessage(null);
    const bidTarget = currentBid + incrementAmount;
    const res = placeBid(bidTarget);
    if (!res.success) {
      setBidErrorMessage(res.message);
    }
  };

  // Handle Custom Bid Submit
  const handleCustomBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBidErrorMessage(null);
    const amount = parseFloat(customBidInput.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= currentBid) {
      setBidErrorMessage(`Bid must exceed current bid of ₦${currentBid.toLocaleString()}`);
      return;
    }
    // If bid is more than 35% higher than current bid, ask confirmation for safety
    if (amount > currentBid * 1.35) {
      setPendingCustomBid(amount);
      setShowCustomBidConfirm(true);
      return;
    }
    const res = placeBid(amount);
    if (res.success) {
      setCustomBidInput('');
    } else {
      setBidErrorMessage(res.message);
    }
  };

  const confirmPendingCustomBid = () => {
    if (pendingCustomBid) {
      const res = placeBid(pendingCustomBid);
      if (res.success) {
        setCustomBidInput('');
      } else {
        setBidErrorMessage(res.message);
      }
    }
    setShowCustomBidConfirm(false);
    setPendingCustomBid(null);
  };

  // Share link
  const handleShare = () => {
    const text = `🔥 LIVE NOW on NaijaAuction: ${activeProduct.title}. Current bid ₦${currentBid.toLocaleString()}. Join the live room!`;
    if (navigator.share) {
      navigator.share({ title: activeProduct.title, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Max bid activation
  const handleSaveMaxBid = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(maxBidAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= currentBid) {
      alert(`Max bid must be higher than current bid of ₦${currentBid.toLocaleString()}`);
      return;
    }
    setProxyMaxBid(activeProduct.id, amount);
    setShowMaxBidModal(false);
    setMaxBidAmount('');
  };

  const energyColors = {
    LOW: 'text-slate-500 bg-slate-100',
    MEDIUM: 'text-amber-700 bg-amber-100',
    HOT: 'text-orange-700 bg-orange-100 border-orange-200',
    EXTREME: 'text-rose-700 bg-rose-100 border-rose-200 animate-pulse'
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-white text-slate-900 pb-28 lg:pb-0 flex flex-col justify-between">
      
      {/* Real-time Floating Reactions Canvas */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <AnimatePresence>
          {reactions.map((react) => (
            <motion.div
              key={react.id}
              initial={{ opacity: 1, y: '85vh', scale: 0.7 }}
              animate={{ opacity: 0, y: '20vh', scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.8, ease: 'easeOut' }}
              style={{ left: `${react.xOffset}%` }}
              className="absolute text-4xl select-none drop-shadow-md"
            >
              {react.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ================= CATEGORY LIVE ROOMS CHANNEL BAR ================= */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Live Category Rooms:
            </span>
          </div>

          {/* Horizontal scrollable category rooms channels */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
            {categoryRooms.map((room) => {
              const isSelected = room.id === activeRoom.id;
              const isLive = room.status === 'live';
              const activeSlotInRoom = room.slots.find(s => s.id === room.activeSlotId) || room.slots[0];

              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm ring-2 ring-emerald-400/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={`${room.title} - ${isLive ? 'Broadcasting Live' : 'Scheduled'}`}
                >
                  <span className="text-sm">{room.icon}</span>
                  <span>{room.category}</span>
                  {isLive ? (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold flex items-center gap-1 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal">
                      Upcoming
                    </span>
                  )}
                  {activeSlotInRoom && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-emerald-700/80 text-emerald-100' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {activeSlotInRoom.code}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= DAILY SLOTS NAVIGATION BAR ================= */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Active Room Title & Slots Header */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-base">{activeRoom.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  {activeRoom.title}
                </span>
                <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {activeRoom.slots.length} Auction Slots Today
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Each slot features a distinct item catalog quota allocated for today.
              </p>
            </div>
          </div>

          {/* Slots Selector Tabs with Target Item Counts (e.g. Slot A 200 items, Slot B 350 items) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {activeRoom.slots.map((slot) => {
              const isSelectedSlot = slot.id === activeSlot.id;
              const isSlotOnAir = slot.status === 'active' || slot.id === activeRoom.activeSlotId;

              return (
                <button
                  key={slot.id}
                  onClick={() => handleOpenWeekSchedule(slot.id)}
                  className={`px-3 py-2 rounded-xl text-left transition border shrink-0 min-w-[175px] cursor-pointer group ${
                    isSelectedSlot
                      ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                      : 'bg-white/60 hover:bg-white border-slate-200 text-slate-700'
                  }`}
                  title="Click to view scheduled items for today, tomorrow (next day) and choose live bid for this slot"
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={`text-xs font-black ${isSelectedSlot ? 'text-emerald-700' : 'text-slate-900 group-hover:text-emerald-600'}`}>
                      {slot.code}: {slot.name}
                    </span>
                    {isSlotOnAir ? (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 animate-pulse">
                        ON AIR
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-400">
                        {slot.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-emerald-600">
                      {slot.targetItemCount} items quota
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {slot.scheduledStartTime}
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-1 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round((slot.completedItemsCount / slot.targetItemCount) * 100))}%` }}
                    />
                  </div>
                </button>
              );
            })}

            {/* View 7-Day Week Range & Slots Catalog Button */}
            <button
              onClick={() => handleOpenWeekSchedule()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              title="Click to view full 7-day schedule and inspect available items for today, tomorrow (next day) and across the week before choosing live bid"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Week Range & Items</span>
            </button>
          </div>

        </div>

        {/* Slot On-Air Item Tracker Banner */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white tracking-wider">
              NOW BROADCASTING: {activeSlot.code}
            </span>
            <span className="font-bold text-slate-800">
              Item #{activeProductIndex + 1} of {activeSlot.targetItemCount} items for today
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">
              Slot Time Window: {activeSlot.scheduledStartTime} – {activeSlot.scheduledEndTime}
            </span>
          </div>

          <div className="flex items-center gap-3 font-semibold text-slate-600 text-[11px]">
            <span>
              Today's Slot Progress: <strong className="text-slate-900">{activeSlot.completedItemsCount} / {activeSlot.targetItemCount}</strong> completed
            </span>
            <span>
              Slot GMV: <strong className="text-emerald-700 font-mono">₦{activeSlot.totalSalesVolume.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Live Room Sub-Header */}
      <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white tracking-wider">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE ROOM
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-[260px] sm:max-w-md">
              {currentEvent.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-slate-600">
            {/* Live Voice Announcer Control */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <button
                onClick={handleToggleVoiceAnnouncer}
                className={`flex items-center gap-1.5 transition ${
                  isVoiceAnnouncerEnabled ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                }`}
                title={isVoiceAnnouncerEnabled ? 'Voice Announcer is ON. Click to mute' : 'Click to enable Voice Announcer (speaks highest bids aloud)'}
                aria-label="Toggle Voice Announcer"
              >
                {isVoiceAnnouncerEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="font-bold">
                  Voice {isVoiceAnnouncerEnabled ? 'ON' : 'OFF'}
                </span>
                {isSpeakingAnnouncement && (
                  <span className="flex gap-0.5 items-end h-3 ml-0.5">
                    <span className="w-0.5 h-3 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-3.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </button>

              {isVoiceAnnouncerEnabled && (
                <>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={() => speechAnnouncer.testVoice()}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold hover:underline"
                    title="Test Voice Speech Synthesis"
                  >
                    Test
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentEvent.viewerCount.toLocaleString()} watching</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentEvent.activeBiddersCount} bidders</span>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 transition"
              title="Share live auction"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Host Announcement Banner */}
      <AnimatePresence>
        {activeAnnouncement && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-600 text-white px-4 py-2.5 font-bold text-center text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{activeAnnouncement}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-Column Desktop Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ================= LEFT COLUMN: PRODUCT MEDIA & DETAILS (4 cols) ================= */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Live Media Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs overflow-hidden">
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                <img
                  src={activeProduct.images[activeImageIndex] || activeProduct.images[0]}
                  alt={activeProduct.title}
                  className="w-full h-full object-cover"
                />

                {/* Simulated Live Stream Watermark / Host Camera Pip */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[11px] font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>CAMERA 1 • 1080p</span>
                </div>

                <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-white/90 text-slate-800 font-bold text-xs border border-slate-200 shadow-xs">
                  {activeProduct.condition}
                </div>

                {/* Host PiP simulation in corner */}
                <div className="absolute bottom-2 left-2 w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                    alt="Auctioneer Chidi"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white font-bold text-center py-0.5">
                    HOST 🎙️
                  </div>
                </div>

                {/* Item Position Indicator */}
                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded">
                  Lot #01 of {currentEvent.totalProducts}
                </div>
              </div>

              {/* Thumbnails */}
              {activeProduct.images.length > 1 && (
                <div className="flex gap-2 mt-2.5">
                  {activeProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                        activeImageIndex === idx ? 'border-emerald-600' : 'border-slate-200 opacity-60'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Specifications & Seller Guarantee */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {activeProduct.category}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 mt-1">
                  {activeProduct.title}
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {activeProduct.description}
                </p>
              </div>

              {/* Specs chips */}
              <div className="flex flex-wrap gap-1.5">
                {activeProduct.specs.map((spec, i) => (
                  <span key={i} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {spec}
                  </span>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Market Retail Price:</span>
                  <span className="font-bold text-slate-700 line-through">
                    ₦{activeProduct.estimatedMarketValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Starting Price:</span>
                  <span className="font-semibold text-slate-900">
                    ₦{activeProduct.startingPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Bid Increment:</span>
                  <span className="font-semibold text-emerald-700">
                    +₦{activeProduct.bidIncrement.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Seller & Escrow Verification */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    {activeProduct.seller.name}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Ships from {activeProduct.seller.location} ({activeProduct.deliveryInfo.dispatchTime})</span>
                </p>
              </div>
            </div>

            {/* Next Product Queue Peek */}
            {nextProduct && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={nextProduct.images[0]}
                    alt={nextProduct.title}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                  />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Up Next in Queue
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                      {nextProduct.title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openPreBidModal(nextProduct)}
                  className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md transition shadow-2xs"
                >
                  Pre-Bid
                </button>
              </div>
            )}

          </div>

          {/* ================= CENTER COLUMN: BID STAGE & CONTROLS (5 cols) ================= */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Main Bid Stage Card */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm relative overflow-hidden">
              
              {/* Product Transition Overlay */}
              <AnimatePresence>
                {transitionCountdown !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-2xl flex items-center justify-center animate-bounce mb-2">
                      {transitionCountdown}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {activeProduct.status === 'sold' ? 'SOLD!' : 'AUCTION ENDED'}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 max-w-xs">
                      {activeProduct.winner 
                        ? `Won by ${activeProduct.winner.nickname} for ₦${activeProduct.winner.bidAmount.toLocaleString()}`
                        : 'Moving to the next scheduled product in queue...'}
                    </p>
                    <p className="text-xs font-bold text-emerald-700 mt-3 uppercase tracking-wider">
                      Next Item Loading In {transitionCountdown}s...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Visual Countdown Timer with Anti-Sniping Urgency Color Progression */}
              <div className="pb-2">
                <AuctionCountdownTimer
                  status={isPaused ? 'paused' : activeProduct.status}
                  remainingSeconds={timeRemaining}
                  totalDurationSeconds={activeProduct.durationSeconds}
                  antiSnipingSeconds={10}
                  extensionCount={activeProduct.extensionCount}
                  maxExtensions={activeProduct.maxExtensions}
                  isExtended={isExtended}
                />
              </div>

              {/* Dominant Current Bid Display */}
              <div className="py-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Current Highest Bid
                  </span>
                  {isVoiceAnnouncerEnabled && (
                    <button
                      onClick={() => speechAnnouncer.announceBid(currentBid, bidHistory[bidHistory.length - 1]?.maskedBidder || 'Leader', isUserWinning)}
                      className="text-emerald-600 hover:text-emerald-700 transition"
                      title="Announce current bid aloud"
                      aria-label="Announce bid aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <motion.div
                  animate={pricePulsing ? { scale: [1, 1.06, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-display mt-1"
                >
                  ₦{currentBid.toLocaleString()}
                </motion.div>

                {/* Spoken voice visual wave feedback */}
                <AnimatePresence>
                  {isSpeakingAnnouncement && currentSpokenPhrase && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold mt-2 shadow-2xs"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                      <span className="max-w-[260px] sm:max-w-xs truncate">
                        🎙️ Voice: {currentSpokenPhrase}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-2">
                  <span>{activeProduct.bidsCount} total bids placed</span>
                  <span>•</span>
                  <span>Min next bid: <strong className="text-slate-800">₦{nextMinBid.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Winning Status Badges */}
              <div className="mb-4">
                {isUserWinning ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-center gap-2 text-xs font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>🟢 YOU ARE WINNING THIS AUCTION (₦{currentBid.toLocaleString()})</span>
                  </div>
                ) : hasUserBiddedOnActive ? (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 flex items-center justify-center gap-2 text-xs font-extrabold animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>⚠️ YOU’VE BEEN OUTBID! Place another bid to regain the lead</span>
                  </div>
                ) : userMaxBid ? (
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 flex items-center justify-center gap-2 text-xs font-semibold">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Active Max Auto-Bid: ₦{userMaxBid.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>

              {/* Bid Error Message */}
              {bidErrorMessage && (
                <div className="mb-3 p-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg text-center">
                  {bidErrorMessage}
                </div>
              )}

              {/* Primary Bid Button (1-Tap Minimum Increment CTA) */}
              <button
                onClick={() => handleQuickBid(activeProduct.bidIncrement)}
                disabled={isPaused || transitionCountdown !== null}
                className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                <span>BID ₦{nextMinBid.toLocaleString()}</span>
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </button>

              {/* Quick Increment Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-2.5">
                {[5000, 10000, 20000, 50000].map((inc) => (
                  <button
                    key={inc}
                    onClick={() => handleQuickBid(inc)}
                    disabled={isPaused || transitionCountdown !== null}
                    className="py-2 text-xs font-bold rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 transition active:scale-95 disabled:opacity-50"
                  >
                    +₦{(inc / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>

              {/* Custom Bid & Max Bid Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                <form onSubmit={handleCustomBidSubmit} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      ₦
                    </span>
                    <input
                      type="text"
                      placeholder={`Custom bid (> ${currentBid.toLocaleString()})`}
                      value={customBidInput}
                      onChange={(e) => setCustomBidInput(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
                  >
                    Bid
                  </button>
                </form>

                <button
                  onClick={() => setShowMaxBidModal(true)}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0"
                  title="System automatically bids on your behalf up to your max"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Max Bid</span>
                </button>
              </div>

              {/* Energy Meter */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span>AUCTION HEAT:</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] border ${energyColors[currentEvent.energyLevel]}`}>
                  {currentEvent.energyLevel} 🔥🔥🔥
                </span>
              </div>

            </div>

            {/* Live Bid Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Live Bid Activity Feed
                </h3>
                <span className="text-[11px] text-slate-400">Server Synchronized</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {bidHistory.slice(-6).reverse().map((bid) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-2 rounded-lg flex items-center justify-between text-xs border ${
                        bid.isCurrentUser 
                          ? 'bg-emerald-50 border-emerald-300 font-bold' 
                          : 'bg-slate-50/70 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${bid.isCurrentUser ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        <span className="text-slate-800 font-semibold">
                          {bid.maskedBidder}
                        </span>
                        {bid.isProxy && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">
                            PROXY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-slate-900">
                          ₦{bid.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {bid.timestamp.split(' ')[0]}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Host Controls Quick Ribbon (Only visible if Host or Admin role) */}
            {(userRole === 'host' || userRole === 'admin') && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>🎙️ Auctioneer Host Controls</span>
                  <span className="text-[10px] uppercase font-mono">Live Call Pad</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => hostAction('GOING_ONCE')}
                    className="px-2 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100"
                  >
                    Going Once
                  </button>
                  <button
                    onClick={() => hostAction('GOING_TWICE')}
                    className="px-2 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-bold rounded-lg hover:bg-amber-100"
                  >
                    Going Twice
                  </button>
                  <button
                    onClick={() => hostAction('FINAL_CALL')}
                    className="px-2 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
                  >
                    Final Call!
                  </button>
                  <button
                    onClick={() => hostAction('SOLD')}
                    className="px-2 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black"
                  >
                    🔨 Sold!
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => hostAction('EXTEND')}
                    className="flex-1 py-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-100"
                  >
                    +30s Manual Extend
                  </button>
                  <button
                    onClick={() => hostAction('PAUSE')}
                    className="flex-1 py-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-100"
                  >
                    {isPaused ? 'Resume Auction' : 'Pause Auction'}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ================= RIGHT COLUMN: ALL NEXT SCHEDULED PRODUCTS IN QUEUE FOR DAY SLOT (3 cols) ================= */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <SlotProductQueue
              openPreBidModal={openPreBidModal}
              openWeekScheduleModal={handleOpenWeekSchedule}
            />
          </div>

        </div>
      </div>

      {/* Social Proof Real-Time Scrolling Ticker across all categories */}
      <div className="w-full mt-auto">
        <RecentBidsTicker
          latestLiveBid={
            bidHistory.length > 0
              ? {
                  productTitle: activeProduct.title,
                  category: activeProduct.category,
                  amount: currentBid,
                  bidder: bidHistory[bidHistory.length - 1].maskedBidder
                }
              : null
          }
        />
      </div>

      {/* Sticky Bottom Bidding Bar for Mobile View */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 z-40 shadow-xl flex items-center gap-2">
        {/* Mobile Voice Toggle */}
        <button
          onClick={handleToggleVoiceAnnouncer}
          className={`p-2.5 rounded-xl border transition shrink-0 ${
            isVoiceAnnouncerEnabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}
          title={isVoiceAnnouncerEnabled ? 'Live Voice Announcer is ON. Click to mute' : 'Click to enable Voice Announcer'}
          aria-label="Toggle Voice Announcer"
        >
          {isVoiceAnnouncerEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-slate-500 uppercase font-bold truncate">
            Current: ₦{currentBid.toLocaleString()}
          </div>
          <div className="text-xs font-mono font-black text-rose-600">
            {formatTime(timeRemaining)} remaining
          </div>
        </div>
        <button
          onClick={() => handleQuickBid(activeProduct.bidIncrement)}
          disabled={isPaused || transitionCountdown !== null}
          className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-md active:scale-95 disabled:opacity-50 shrink-0"
        >
          BID ₦{nextMinBid.toLocaleString()}
        </button>
      </div>

      {/* Custom Bid Confirmation Modal for high bids */}
      {showCustomBidConfirm && pendingCustomBid && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-extrabold text-slate-900">Confirm Large Bid</h4>
              <p className="text-xs text-slate-500 mt-1">
                You are about to place a bid significantly above the current price:
              </p>
              <div className="text-2xl font-black text-emerald-700 mt-2">
                ₦{pendingCustomBid.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                All bids are legally binding. Funds will be requested if you win.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomBidConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmPendingCustomBid}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
              >
                Confirm Bid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Max Bid / Proxy Bidding Configuration Modal */}
      {showMaxBidModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Configure Proxy Auto-Bid</h4>
                  <p className="text-[11px] text-slate-500">{activeProduct.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaxBidModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-1">
              <p className="font-bold text-blue-900">How Proxy Bidding Works:</p>
              <p>
                Enter the maximum amount you are willing to pay. The system will automatically counter-bid in minimum increments (+₦{activeProduct.bidIncrement.toLocaleString()}) on your behalf only when someone outbids you.
              </p>
              <p className="font-semibold text-emerald-800">
                🔒 Your maximum bid is 100% private and never visible to other bidders or sellers.
              </p>
            </div>

            <form onSubmit={handleSaveMaxBid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Maximum Bid Amount (₦)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${(currentBid * 1.2).toFixed(0)}`}
                  value={maxBidAmount}
                  onChange={(e) => setMaxBidAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Current Bid: ₦{currentBid.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaxBidModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                >
                  Activate Auto-Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7-Day Week Range Slot Schedule & Available Items Catalog Modal */}
      <SlotWeekScheduleModal
        isOpen={isWeekScheduleModalOpen}
        onClose={() => setIsWeekScheduleModalOpen(false)}
        initialSlotId={weekScheduleTargetSlotId}
        openPreBidModal={openPreBidModal}
      />

    </div>
  );
};
