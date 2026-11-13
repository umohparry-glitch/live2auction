import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Check, 
  Bell, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  Radio, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { generateWeekScheduleForCategory } from '../data/weekScheduleData';
import { AuctionProduct, AuctionSlot, DaySchedule } from '../types';

interface SlotWeekScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSlotId?: string;
  openPreBidModal: (product: AuctionProduct) => void;
}

export const SlotWeekScheduleModal: React.FC<SlotWeekScheduleModalProps> = ({
  isOpen,
  onClose,
  initialSlotId,
  openPreBidModal
}) => {
  const {
    activeRoom,
    activeSlot,
    setActiveSlotId,
    watchlist,
    toggleWatchlist,
    dispatchPushNotification
  } = useLiveAuction();

  // Generate 7-day schedule for the active room
  const weekSchedule: DaySchedule[] = useMemo(() => {
    return generateWeekScheduleForCategory(activeRoom.id);
  }, [activeRoom.id]);

  // Selected Day Index (0 = Today, 1 = Tomorrow / Next Day, 2..6 = Week Range)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Current selected day
  const selectedDay = weekSchedule[selectedDayIndex] || weekSchedule[0];

  // Selected Slot ID within that day
  const [selectedSlotId, setSelectedSlotId] = useState<string>(() => {
    return initialSlotId || selectedDay.slots[0]?.id || '';
  });

  // Keep slot in sync if user changes day
  const currentSlot = useMemo(() => {
    const found = selectedDay.slots.find(s => s.id === selectedSlotId);
    return found || selectedDay.slots[0];
  }, [selectedDay, selectedSlotId]);

  // Filters within slot catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('all');

  // Filtered products for this slot
  const slotProducts = useMemo(() => {
    if (!currentSlot) return [];
    return currentSlot.products.filter((prod) => {
      if (conditionFilter !== 'all' && prod.condition !== conditionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          prod.title.toLowerCase().includes(q) ||
          prod.category.toLowerCase().includes(q) ||
          prod.seller.name.toLowerCase().includes(q) ||
          prod.specs.some(s => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [currentSlot, conditionFilter, searchQuery]);

  if (!isOpen) return null;

  // Handle choosing live bid for this slot
  const handleChooseLiveBidForSlot = (slot: AuctionSlot) => {
    setActiveSlotId(slot.id, slot);
    
    dispatchPushNotification({
      title: `⚡ Live Bidding Activated: ${slot.code}`,
      message: `You are now tuned into ${slot.code} (${slot.name}). Quota of ${slot.targetItemCount} items scheduled for bidding!`,
      type: 'system',
      productTitle: slot.name
    });

    onClose();

    // Smooth scroll to the live bidding stage
    setTimeout(() => {
      const bidSection = document.getElementById('bid-input') || document.querySelector('button[id*="quick-bid"]');
      bidSection?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const isCurrentSlotActiveNow = selectedDay.isToday && (currentSlot.id === activeSlot.id || currentSlot.status === 'active');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-1.5 bg-slate-800 rounded-xl">{activeRoom.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {activeRoom.title} — Weekly Slot & Item Schedule
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  7-Day Quota
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Inspect the list of available items scheduled for today, tomorrow, or any day this week before choosing live bid for that slot.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-DAY WEEK RANGE SELECTOR TABS */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Week Range:</span>
            </span>

            {weekSchedule.map((day) => {
              const isSelected = day.dayIndex === selectedDayIndex;
              return (
                <button
                  key={day.dayIndex}
                  onClick={() => {
                    setSelectedDayIndex(day.dayIndex);
                    setSelectedSlotId(day.slots[0]?.id || '');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500/50'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{day.formattedDate}</span>
                  {day.isToday && (
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      TODAY
                    </span>
                  )}
                  {day.isTomorrow && (
                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                    }`}>
                      NEXT DAY
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* DAILY SLOTS SELECTOR TABS FOR SELECTED DAY */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Slots for <span className="text-emerald-700 font-extrabold">{selectedDay.formattedDate}</span>:
              </span>
              <span className="text-[11px] text-slate-500">
                (Click slot to inspect available items)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              3 Daily Slots • 700 Total Daily Item Quota
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {selectedDay.slots.map((slot) => {
              const isSelected = slot.id === currentSlot.id;
              const isOnAir = selectedDay.isToday && (slot.status === 'active' || slot.id === activeRoom.activeSlotId);

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-3 rounded-xl text-left border transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/40'
                      : 'bg-white/80 hover:bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-xs font-black ${isSelected ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {slot.code}: {slot.name}
                    </span>
                    {isOnAir ? (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                        ON AIR
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {slot.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="font-extrabold text-emerald-600">
                      {slot.targetItemCount} items scheduled
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {slot.scheduledStartTime} – {slot.scheduledEndTime}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ITEMS CATALOG SECTION FOR CHOSEN SLOT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          
          {/* Header of catalog & search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>Available Items Scheduled for {currentSlot.code}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {slotProducts.length} Lots in Slot Queue
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Scheduled for {selectedDay.formattedDate} • Time window: {currentSlot.scheduledStartTime} – {currentSlot.scheduledEndTime}
              </p>
            </div>

            {/* Search & Condition Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search scheduled items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                />
              </div>

              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Conditions</option>
                <option value="Brand New">Brand New</option>
                <option value="Open Box">Open Box</option>
                <option value="Fairly Used">Fairly Used / Tokunbo</option>
                <option value="Certified Refurbished">Refurbished</option>
              </select>
            </div>
          </div>

          {/* List of Products */}
          {slotProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold text-slate-600">No products match your filter in this slot.</p>
              <button
                onClick={() => { setSearchQuery(''); setConditionFilter('all'); }}
                className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {slotProducts.map((prod, idx) => {
                const isSaved = watchlist.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition flex flex-col justify-between"
                  >
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={prod.images[0]}
                          alt={prod.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-mono font-bold px-1 rounded">
                          Lot #{idx + 1}
                        </span>
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[8px] font-bold text-center py-0.2 truncate">
                          {prod.condition}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          {prod.category}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mt-0.5">
                          {prod.title}
                        </h4>

                        {/* Specs Chips */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {prod.specs.slice(0, 2).map((spec, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                              {spec}
                            </span>
                          ))}
                        </div>

                        {/* Seller */}
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{prod.seller.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions Row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase font-medium">
                          Starting Price
                        </div>
                        <div className="font-mono font-extrabold text-xs text-emerald-700">
                          ₦{prod.startingPrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 line-through">
                          Est. ₦{prod.estimatedMarketValue.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleWatchlist(prod.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                            isSaved
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                          title="Save to Watchlist for 2-minute native closing alert"
                        >
                          <Bell className={`w-3 h-3 ${isSaved ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                          <span>{isSaved ? 'Saved' : 'Watch'}</span>
                        </button>

                        <button
                          onClick={() => openPreBidModal(prod)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>Pre-Bid</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* PRIMARY ACTION BAR AT THE BOTTOM */}
        <div className="p-4 bg-slate-900 text-white border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  {currentSlot.code}: {currentSlot.name}
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  ({selectedDay.formattedDate})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentSlot.targetItemCount} items scheduled • {currentSlot.scheduledStartTime} – {currentSlot.scheduledEndTime}
              </p>
            </div>
          </div>

          {/* The Choose Live Bid For That Slot CTA */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
            >
              Continue Browsing
            </button>

            <button
              id="choose-live-bid-for-slot-btn"
              onClick={() => handleChooseLiveBidForSlot(currentSlot)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400/40"
            >
              <span>Choose Live Bid For This Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
