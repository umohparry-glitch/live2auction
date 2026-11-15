import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Lock,
  PackagePlus,
  Radio,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { readAndCompressImageFiles } from '../utils/imageUpload';

export interface LiveAuctionSlot {
  slotKey: string;
  slotNumber: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  gapMinutesAfter: number;
  state: 'available' | 'occupied' | 'mine' | 'held';
  isLiveNow: boolean;
  heldByUsername: string | null;
  heldByUserId: number | null;
  occupiedBy: {
    id: number;
    code: string;
    title: string;
    status: string;
    approvalStatus: string;
    sellerId: number | null;
    sellerUsername: string | null;
  } | null;
}

interface SlotHoldPayload {
  slotKey: string;
  userId: number;
  username: string;
  expiresAt: number;
}

interface PostProductBiddingViewProps {
  onOpenAuction?: (auctionId: number) => void;
  onGoToDashboard?: () => void;
  embeddedInDashboard?: boolean;
}

export const PostProductBiddingView: React.FC<PostProductBiddingViewProps> = ({
  onOpenAuction,
  onGoToDashboard,
  embeddedInDashboard = false,
}) => {
  const { user, isAdmin, socket, showToast, refreshSession } = useAuth();

  const [dayOffset, setDayOffset] = useState<number>(0);
  const [slots, setSlots] = useState<LiveAuctionSlot[]>([]);
  const [gapMinutes, setGapMinutes] = useState<number>(15);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(60);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>('');

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productImageUrlInput, setProductImageUrlInput] = useState('');

  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    categoryName: 'Phones',
    condition: 'Brand New',
    brand: '',
    location: 'Lagos, Nigeria',
    startingPrice: '250000',
    bidIncrement: '10000',
    images: [] as string[],
  });

  const loadSlots = useCallback(
    async (targetDay = dayOffset) => {
      try {
        const res = await apiRequest<{
          slots: LiveAuctionSlot[];
          timeBetweenAuctionsMinutes: number;
          defaultSlotDurationMinutes: number;
        }>(`/api/public/auction-slots?dayOffset=${targetDay}`);
        setSlots(res.slots || []);
        setGapMinutes(res.timeBetweenAuctionsMinutes ?? 15);
        setSlotDurationMinutes(res.defaultSlotDurationMinutes ?? 60);

        // Preserve selection if still available, else clear if it became occupied/held by someone else
        setSelectedSlotKey((prev) => {
          if (!prev) {
            const firstOpen = (res.slots || []).find((s) => s.state === 'available');
            return firstOpen ? firstOpen.slotKey : '';
          }
          const matched = (res.slots || []).find((s) => s.slotKey === prev);
          if (!matched || (matched.state !== 'available' && matched.heldByUserId !== user?.id)) {
            return '';
          }
          return prev;
        });
      } catch (err: any) {
        showToast('error', 'Slots Error', err?.message || 'Unable to load live auction slots.');
      } finally {
        setLoadingSlots(false);
      }
    },
    [dayOffset, showToast, user?.id]
  );

  const loadCatalogAndProducts = useCallback(async () => {
    try {
      const [catsRes, dashRes] = await Promise.all([
        apiRequest<{ categories: { id: number; name: string }[] }>('/api/public/categories'),
        user ? apiRequest<{ myProducts: any[] }>('/api/user/dashboard') : Promise.resolve({ myProducts: [] }),
      ]);
      setCategories(catsRes.categories || []);
      if (catsRes.categories?.[0]) {
        setProductForm((prev) =>
          prev.categoryId
            ? prev
            : {
                ...prev,
                categoryId: String(catsRes.categories[0].id),
                categoryName: catsRes.categories[0].name,
              }
        );
      }
      setMyProducts(dashRes.myProducts || []);
    } catch {
      // handled silently
    }
  }, [user]);

  useEffect(() => {
    loadSlots(dayOffset);
  }, [dayOffset, loadSlots]);

  useEffect(() => {
    loadCatalogAndProducts();
  }, [loadCatalogAndProducts]);

  // Broadcast live hold when selectedSlotKey changes & release on unmount
  useEffect(() => {
    if (!socket || !user) return;
    if (selectedSlotKey) {
      socket.emit('slot:selecting', {
        slotKey: selectedSlotKey,
        userId: user.id,
        username: user.username,
      });
    } else {
      socket.emit('slot:released');
    }
  }, [selectedSlotKey, socket, user]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('slot:released');
      }
    };
  }, [socket]);

  // Real-Time Socket.IO updates for slots, holds, admin settings, approvals & auctions
  useEffect(() => {
    if (!socket) return;

    const handleSlotsUpdated = () => {
      void loadSlots(dayOffset);
      void loadCatalogAndProducts();
    };

    const handleHoldsUpdated = (holds: SlotHoldPayload[]) => {
      const holdMap = new Map(holds.map((h) => [h.slotKey, h]));
      setSlots((prev) =>
        prev.map((s) => {
          if (s.occupiedBy) return s;
          const hold = holdMap.get(s.slotKey);
          if (hold && hold.userId !== user?.id) {
            return {
              ...s,
              state: 'held',
              heldByUsername: hold.username,
              heldByUserId: hold.userId,
            };
          }
          if (hold && hold.userId === user?.id) {
            return {
              ...s,
              state: 'available',
              heldByUsername: hold.username,
              heldByUserId: hold.userId,
            };
          }
          return {
            ...s,
            state: 'available',
            heldByUsername: null,
            heldByUserId: null,
          };
        })
      );
    };

    const handleSettingsUpdated = () => {
      void loadSlots(dayOffset);
    };

    const handleUserNotification = (payload: any) => {
      if (payload?.userId === user?.id) {
        if (payload.type === 'seller_approved' || payload.type === 'seller_revoked') {
          void refreshSession();
        }
        void loadCatalogAndProducts();
        void loadSlots(dayOffset);
      }
    };

    socket.on('slots:updated', handleSlotsUpdated);
    socket.on('slots:holds_updated', handleHoldsUpdated);
    socket.on('settings:updated', handleSettingsUpdated);
    socket.on('auction:updated', handleSlotsUpdated);
    socket.on('auction:started', handleSlotsUpdated);
    socket.on('auction:closed', handleSlotsUpdated);
    socket.on('notification:user', handleUserNotification);

    return () => {
      socket.off('slots:updated', handleSlotsUpdated);
      socket.off('slots:holds_updated', handleHoldsUpdated);
      socket.off('settings:updated', handleSettingsUpdated);
      socket.off('auction:updated', handleSlotsUpdated);
      socket.off('auction:started', handleSlotsUpdated);
      socket.off('auction:closed', handleSlotsUpdated);
      socket.off('notification:user', handleUserNotification);
    };
  }, [socket, dayOffset, loadSlots, loadCatalogAndProducts, user?.id, refreshSession]);

  const handleSelectSlot = (slot: LiveAuctionSlot) => {
    if (slot.state === 'occupied' || slot.state === 'mine') return;
    if (slot.state === 'held' && slot.heldByUserId !== user?.id) {
      showToast(
        'warning',
        'Slot Currently Held',
        `@${slot.heldByUsername} is selecting this slot right now.`
      );
      return;
    }
    setSelectedSlotKey((prev) => (prev === slot.slotKey ? '' : slot.slotKey));
  };

  const handleRequestSellerApproval = async () => {
    setRequestingApproval(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/user/request-seller-access', {
        method: 'POST',
      });
      await refreshSession();
      showToast('success', 'Request Sent', res.message);
    } catch (err: any) {
      showToast('error', 'Request Failed', err?.message || 'Unable to submit approval request.');
    } finally {
      setRequestingApproval(false);
    }
  };

  const handleProductImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const uploaded = await readAndCompressImageFiles(e.target.files);
      if (uploaded.length > 0) {
        setProductForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uploaded].slice(0, 6),
        }));
        showToast('success', 'Photos Attached', `Added ${uploaded.length} product photo(s).`);
      }
    } catch (err: any) {
      showToast('error', 'Upload Failed', err?.message || 'Unable to process image files.');
    } finally {
      e.target.value = '';
    }
  };

  const selectedSlot = slots.find((s) => s.slotKey === selectedSlotKey) || null;

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      showToast(
        'warning',
        'Select Live Auction Slot',
        'Please pick an available live auction time slot before submitting your product.'
      );
      return;
    }
    setSubmittingProduct(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/user/products', {
        method: 'POST',
        body: JSON.stringify({
          title: productForm.title,
          description: productForm.description,
          categoryId: productForm.categoryId ? Number(productForm.categoryId) : null,
          categoryName: productForm.categoryName,
          condition: productForm.condition,
          brand: productForm.brand,
          location: productForm.location,
          startingPrice: Number(productForm.startingPrice),
          bidIncrement: Number(productForm.bidIncrement),
          slotKey: selectedSlot.slotKey,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          images: productForm.images,
        }),
      });
      showToast('success', 'Live Slot Reserved & Product Submitted', res.message);
      setSelectedSlotKey('');
      setProductForm({
        title: '',
        description: '',
        categoryId: categories[0]?.id ? String(categories[0].id) : '',
        categoryName: categories[0]?.name || 'Phones',
        condition: 'Brand New',
        brand: '',
        location: 'Lagos, Nigeria',
        startingPrice: '250000',
        bidIncrement: '10000',
        images: [],
      });
      await Promise.all([loadSlots(dayOffset), loadCatalogAndProducts()]);
    } catch (err: any) {
      showToast('error', 'Submission Failed', err?.message || 'Could not submit product.');
      await loadSlots(dayOffset);
    } finally {
      setSubmittingProduct(false);
    }
  };

  const canPost = Boolean(user?.canPostProducts || isAdmin);

  const dayTabs = [
    { offset: 0, label: 'Today (Next Live Slots)' },
    { offset: 1, label: 'Tomorrow' },
    { offset: 2, label: 'In 2 Days' },
  ];

  const formatSlotTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatSlotDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div
      className={
        embeddedInDashboard ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'
      }
    >
      {/* Top Banner */}
      <div className="border border-slate-200 rounded-2xl p-5 bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Real-Time Live Auction Slot Reservation</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display">
            Post Product for Live Auction Bidding
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Pick an available live auction time slot below. Every slot selection, hold, and interval update syncs instantaneously across all sellers and administrators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs shrink-0">
          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15">
            <div className="text-slate-300 text-[10px] uppercase tracking-wider">Slot Length</div>
            <div className="font-bold text-white tabular-nums">{slotDurationMinutes} mins</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
            <div className="text-emerald-200 text-[10px] uppercase tracking-wider">
              Time Between Auctions
            </div>
            <div className="font-bold text-emerald-300 tabular-nums">{gapMinutes} mins gap</div>
          </div>
          {onGoToDashboard && !embeddedInDashboard && (
            <button
              onClick={onGoToDashboard}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 cursor-pointer transition"
            >
              My Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Step 1: Real-Time Live Auction Slot Selection */}
      <section className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-600" />
              <span>1. Select Your Live Auction Time Slot</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each live auction runs for {slotDurationMinutes} minutes with an automatic{' '}
              <span className="font-semibold text-slate-700">{gapMinutes}-minute interval</span>{' '}
              between auctions configured by the administrator.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {dayTabs.map((d) => (
              <button
                key={d.offset}
                type="button"
                onClick={() => setDayOffset(d.offset)}
                className={`px-3 py-1.5 rounded-lg font-semibold border cursor-pointer transition ${
                  dayOffset === d.offset
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => loadSlots(dayOffset)}
              title="Refresh live slots"
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Selected Slot Summary Bar */}
        {selectedSlot ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Selected Live Slot: {formatSlotDate(selectedSlot.startTime)} ·{' '}
                {formatSlotTime(selectedSlot.startTime)} – {formatSlotTime(selectedSlot.endTime)} (
                {selectedSlot.durationMinutes} min live + {selectedSlot.gapMinutesAfter}m gap)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSlotKey('')}
              className="text-emerald-800 font-semibold hover:underline cursor-pointer text-left sm:text-right"
            >
              Release Selection
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Click any green <strong>Available</strong> live auction slot below to reserve it for your product.
          </div>
        )}

        {loadingSlots ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Synchronizing live auction slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 border border-slate-100 rounded-xl">
            No upcoming slots found for this day. Switch to Tomorrow or In 2 Days.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isSelectedByMe = selectedSlotKey === slot.slotKey;
              const isOccupied = slot.state === 'occupied' || slot.state === 'mine';
              const isHeldByOther = slot.state === 'held' && slot.heldByUserId !== user?.id;
              const disabled = isOccupied || isHeldByOther;

              return (
                <button
                  key={slot.slotKey}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectSlot(slot)}
                  className={`text-left p-3.5 rounded-xl border transition relative flex flex-col justify-between gap-2 ${
                    isSelectedByMe
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30 cursor-pointer'
                      : slot.state === 'mine'
                      ? 'border-sky-300 bg-sky-50/60 cursor-not-allowed'
                      : slot.state === 'occupied'
                      ? 'border-slate-200 bg-slate-100/80 opacity-80 cursor-not-allowed'
                      : isHeldByOther
                      ? 'border-amber-300 bg-amber-50/70 cursor-not-allowed'
                      : 'border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-slate-500">
                      {formatSlotDate(slot.startTime)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold ${
                        isSelectedByMe
                          ? 'bg-emerald-600 text-white'
                          : slot.state === 'mine'
                          ? 'bg-sky-600 text-white'
                          : slot.state === 'occupied'
                          ? 'bg-slate-700 text-white'
                          : isHeldByOther
                          ? 'bg-amber-500 text-white'
                          : slot.isLiveNow
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isSelectedByMe
                        ? 'Selected'
                        : slot.state === 'mine'
                        ? 'Your Booked Slot'
                        : slot.state === 'occupied'
                        ? slot.occupiedBy?.status === 'live'
                          ? 'Live Occupied'
                          : 'Booked'
                        : isHeldByOther
                        ? `Held: @${slot.heldByUsername}`
                        : slot.isLiveNow
                        ? 'Live Slot Open'
                        : 'Available'}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900 tabular-nums flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      {slot.durationMinutes}m auction · +{slot.gapMinutesAfter}m interval after
                    </div>
                  </div>

                  {slot.occupiedBy && (
                    <div className="pt-1.5 border-t border-slate-200/80 text-[11px] text-slate-600 truncate">
                      {slot.occupiedBy.code}: {slot.occupiedBy.title}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 2: Seller Approval Check + Product Submission Form */}
      {!canPost ? (
        <section className="border border-amber-200 rounded-2xl p-6 bg-amber-50/60 space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-slate-900">
                2. Seller Approval Required to Publish Product
              </h2>
              <p className="text-xs text-slate-700 max-w-2xl leading-relaxed">
                You can view live auction slots in real time right now. To finalize posting products for bidding, an administrator needs to approve your account once. When approved, this page unlocks automatically in real time.
              </p>
            </div>
          </div>

          {user?.sellerApprovalRequested ? (
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 text-xs text-amber-900 font-semibold">
              Approval Request Sent — Waiting for administrator review. You will be unlocked automatically in real time as soon as approved.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRequestSellerApproval}
              disabled={requestingApproval}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-60"
            >
              {requestingApproval ? 'Sending Request...' : 'Request Approval to Post Products'}
            </button>
          )}
        </section>
      ) : (
        <form
          onSubmit={handleSubmitProduct}
          className="border border-slate-200 rounded-2xl p-6 bg-white space-y-4 text-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-4 h-4 text-emerald-600" />
                <span>2. Upload Product Details & Reserve Selected Slot</span>
              </h2>
              <p className="text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Administrator posts go directly into the approved auction schedule.'
                  : 'Submitted products lock the selected live slot immediately while awaiting quick admin verification.'}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approved Seller Access</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                required
                value={productForm.title}
                onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                placeholder="e.g. Apple iPhone 16 Pro Max 256GB — Sealed Box"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Description & Condition Notes
              </label>
              <textarea
                rows={3}
                required
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Describe accessories, battery health, warranty, serial verification..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={productForm.categoryName}
                onChange={(e) => {
                  const cat = categories.find((c) => c.name === e.target.value);
                  setProductForm({
                    ...productForm,
                    categoryName: e.target.value,
                    categoryId: cat ? String(cat.id) : '',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Condition</label>
              <select
                value={productForm.condition}
                onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Brand New">Brand New</option>
                <option value="Open Box">Open Box</option>
                <option value="Foreign Used (Tokunbo)">Foreign Used (Tokunbo)</option>
                <option value="Mint Condition">Mint Condition</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                placeholder="e.g. Apple, Rolex, EcoFlow"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Item Location</label>
              <input
                type="text"
                value={productForm.location}
                onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Starting Price (₦)</label>
              <input
                type="number"
                required
                min={100}
                value={productForm.startingPrice}
                onChange={(e) => setProductForm({ ...productForm, startingPrice: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Min Bid Increment (₦)
              </label>
              <input
                type="number"
                required
                min={100}
                value={productForm.bidIncrement}
                onChange={(e) => setProductForm({ ...productForm, bidIncrement: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            {/* Photos Upload */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block font-semibold text-slate-700">
                Upload Product Photos (Up to 6 images — first image is primary cover)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Images from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleProductImagesUpload}
                    className="hidden"
                  />
                </label>
                <div className="flex flex-1 min-w-0 w-full sm:w-auto gap-2">
                  <input
                    type="url"
                    value={productImageUrlInput}
                    onChange={(e) => setProductImageUrlInput(e.target.value)}
                    placeholder="Or paste image URL..."
                    className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!productImageUrlInput.trim()) return;
                      setProductForm((prev) => ({
                        ...prev,
                        images: [...prev.images, productImageUrlInput.trim()].slice(0, 6),
                      }));
                      setProductImageUrlInput('');
                    }}
                    className="px-3 py-2 border border-slate-300 bg-white rounded-lg font-semibold hover:bg-slate-100 cursor-pointer shrink-0"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {productForm.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {productForm.images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-18 rounded-lg border border-slate-200 overflow-hidden bg-white group"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 ? (
                        <span className="absolute bottom-0.5 left-0.5 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded">
                          Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((prev) => {
                              const next = [...prev.images];
                              const [chosen] = next.splice(idx, 1);
                              return { ...prev, images: [chosen, ...next] };
                            })
                          }
                          className="absolute bottom-0.5 left-0.5 bg-slate-900/80 text-white text-[9px] font-semibold px-1 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setProductForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx),
                          }))
                        }
                        className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded px-1 text-[10px] cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-slate-600">
              {selectedSlot ? (
                <span>
                  Target Slot:{' '}
                  <strong className="text-slate-900">
                    {formatSlotDate(selectedSlot.startTime)} ·{' '}
                    {formatSlotTime(selectedSlot.startTime)} – {formatSlotTime(selectedSlot.endTime)}
                  </strong>
                </span>
              ) : (
                <span className="text-amber-700 font-semibold">
                  Select an available slot above before submitting.
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={submittingProduct || !selectedSlot}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingProduct
                ? 'Reserving Slot & Submitting...'
                : 'Reserve Slot & Post Product for Bidding'}
            </button>
          </div>
        </form>
      )}

      {/* User's Submitted Products */}
      <section className="border border-slate-200 rounded-2xl p-6 bg-white space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          My Submitted Auction Lots ({myProducts.length})
        </h3>
        {myProducts.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center border border-slate-100 rounded-xl">
            No products submitted yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-4">
            {myProducts.map((p) => (
              <div
                key={p.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-14 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{p.title}</div>
                    <div className="text-slate-500 mt-0.5 tabular-nums">
                      {p.code} · Starting ₦{Number(p.startingPrice).toLocaleString()} · Current Bid ₦
                      {Number(p.currentBid).toLocaleString()}
                      {p.winnerUsername ? ` · Leader/Winner: @${p.winnerUsername}` : ''}
                    </div>
                    <div className="text-slate-500 mt-0.5 tabular-nums">
                      Slot: {new Date(p.startTime).toLocaleString()} –{' '}
                      {new Date(p.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    {p.rejectionReason && p.approvalStatus === 'rejected' && (
                      <div className="text-rose-600 mt-0.5 font-medium">
                        Rejection reason: {p.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full font-semibold ${
                      p.approvalStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.approvalStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {p.approvalStatus === 'approved'
                      ? `Approved (${p.status})`
                      : p.approvalStatus === 'rejected'
                      ? 'Rejected'
                      : 'Pending Admin Approval'}
                  </span>
                  {p.approvalStatus === 'approved' && onOpenAuction && (
                    <button
                      onClick={() => onOpenAuction(p.id)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
