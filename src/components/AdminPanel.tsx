import React, { useState } from 'react';
import { 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  Pause, 
  SkipForward, 
  Clock, 
  UploadCloud, 
  Download, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Eye, 
  Plus, 
  Trash2,
  Lock,
  MessageSquare,
  Sparkles,
  Radio,
  Sliders,
  Calendar,
  Check,
  Edit3
} from 'lucide-react';
import { useLiveAuction } from '../context/LiveAuctionContext';
import { convertProductsToTextFile } from '../utils/textFileParser';
import { AuctionStatus, SlotStatusCode } from '../types';

interface AdminPanelProps {
  openTextUploader: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ openTextUploader }) => {
  const {
    categoryRooms,
    activeRoomId,
    activeRoom,
    activeSlotId,
    activeSlot,
    setActiveRoomId,
    setActiveSlotId,
    updateSlotTargetCount,
    addSlotToRoom,
    updateSlotStatus,
    setRoomActiveSlot,
    updateRoomStatus,
    addProductToSlot,
    reorderProductInSlot,
    skipCurrentProductInSlot,
    extendTimerInSlot,
    isPaused,
    hostAction,
    fraudAlerts,
    takeFraudAction,
    triggerHostAnnouncement,
    currentEvent
  } = useLiveAuction();

  // Admin Selected Room & Slot (sync with context, or let admin browse freely)
  const [adminSelectedRoomId, setAdminSelectedRoomId] = useState<string>(activeRoomId);
  const selectedRoom = categoryRooms.find(r => r.id === adminSelectedRoomId) || activeRoom;

  const [adminSelectedSlotId, setAdminSelectedSlotId] = useState<string>(selectedRoom.activeSlotId || selectedRoom.slots[0]?.id || '');
  const selectedSlot = selectedRoom.slots.find(s => s.id === adminSelectedSlotId) || selectedRoom.slots[0];

  // Quick edit state for slot target counts (e.g. 200 items, 350 items)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [customTargetInput, setCustomTargetInput] = useState<string>('');

  // Add new slot modal state
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlotCode, setNewSlotCode] = useState('Slot D');
  const [newSlotName, setNewSlotName] = useState('Night Owl Flash Clearance');
  const [newSlotTarget, setNewSlotTarget] = useState('200');
  const [newSlotStart, setNewSlotStart] = useState('11:00 PM');
  const [newSlotEnd, setNewSlotEnd] = useState('02:00 AM');

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');

  // Add single product modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartingPrice, setNewStartingPrice] = useState('100000');
  const [newBidIncrement, setNewBidIncrement] = useState('5000');
  const [newCondition, setNewCondition] = useState('Brand New');

  // Switch category room in admin
  const handleSelectAdminRoom = (roomId: string) => {
    setAdminSelectedRoomId(roomId);
    const targetRoom = categoryRooms.find(r => r.id === roomId);
    if (targetRoom && targetRoom.slots.length > 0) {
      setAdminSelectedSlotId(targetRoom.activeSlotId || targetRoom.slots[0].id);
    }
  };

  // Export current selected slot queue to .txt file
  const handleExportTextFile = () => {
    if (!selectedSlot) return;
    const textData = convertProductsToTextFile(selectedSlot.products);
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedRoom.category.toLowerCase().replace(/\s+/g, '-')}-${selectedSlot.code.toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendCustomAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    triggerHostAnnouncement(`📢 ADMIN NOTICE: ${announcementText.trim()}`);
    setAnnouncementText('');
  };

  // Save updated slot target item count (e.g., Slot A 200 items, Slot B 350 items)
  const handleSaveSlotTarget = (slotId: string) => {
    const val = parseInt(customTargetInput, 10);
    if (!isNaN(val) && val > 0) {
      updateSlotTargetCount(selectedRoom.id, slotId, val);
    }
    setEditingSlotId(null);
    setCustomTargetInput('');
  };

  // Quick adjust target item count by delta
  const handleQuickAdjustTarget = (slotId: string, currentTarget: number, delta: number) => {
    const updated = Math.max(1, currentTarget + delta);
    updateSlotTargetCount(selectedRoom.id, slotId, updated);
  };

  // Submit new slot form
  const handleCreateNewSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCount = parseInt(newSlotTarget, 10) || 200;
    addSlotToRoom(selectedRoom.id, {
      code: newSlotCode.trim(),
      name: newSlotName.trim(),
      targetItemCount: targetCount,
      scheduledStartTime: newSlotStart.trim(),
      scheduledEndTime: newSlotEnd.trim()
    });
    setShowAddSlotModal(false);
  };

  // Create single product in selected slot
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !selectedSlot) return;
    const startPrice = parseFloat(newStartingPrice) || 50000;
    const increment = parseFloat(newBidIncrement) || 5000;

    const newProd = {
      id: 'prod_admin_' + Date.now(),
      title: newTitle.trim(),
      category: selectedRoom.category,
      condition: newCondition,
      images: [
        'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1000&q=80'
      ],
      startingPrice: startPrice,
      currentBid: startPrice,
      bidIncrement: increment,
      reservePrice: Math.round(startPrice * 1.1),
      estimatedMarketValue: Math.round(startPrice * 1.35),
      seller: {
        name: 'Verified Market Merchant',
        location: 'Ikeja, Lagos',
        verified: true,
        rating: 4.9
      },
      durationSeconds: 90,
      remainingSeconds: 90,
      status: selectedSlot.products.length === 0 ? ('active' as const) : ('queued' as const),
      bidsCount: 0,
      description: `Admin created item for ${selectedRoom.title} (${selectedSlot.code}): ${newTitle.trim()}`,
      specs: ['100% Quality Inspected', 'Authentic Merchant Warranty', 'Escrow Protected'],
      deliveryInfo: {
        shipsFrom: 'Ikeja, Lagos',
        dispatchTime: '24-48 Hours Nationwide',
        lagosAbujaFee: 3500,
        nationwideFee: 6500
      },
      extensionCount: 0,
      maxExtensions: 5
    };

    addProductToSlot(selectedRoom.id, selectedSlot.id, newProd);
    setShowAddProductModal(false);
    setNewTitle('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 bg-white text-slate-900 font-sans">
      
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
              ROLE: AUCTION MANAGER & SUPER ADMIN
            </span>
            <span className="text-xs font-mono text-slate-400">SESSION ID: #EVT-NG-883</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Category Live Rooms & Slots Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure independent live auction rooms for each category, manage daily slots (e.g. Slot A 200 items, Slot B 350 items), and control on-air queue broadcasts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={openTextUploader}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Text File Catalog</span>
          </button>

          <button
            onClick={handleExportTextFile}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition"
            title="Download the current queue as a .txt file"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Slot Queue (.txt)</span>
          </button>
        </div>
      </div>

      {/* Real-time Analytics Snapshot */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Live GMV</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₦{categoryRooms.reduce((acc, r) => acc + r.slots.reduce((sAcc, s) => sAcc + s.totalSalesVolume, 0), 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Across {categoryRooms.length} Category Rooms</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Category Rooms</span>
            <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {categoryRooms.filter(r => r.status === 'live').length} / {categoryRooms.length} LIVE
          </div>
          <span className="text-[10px] text-blue-600 font-bold">Independent audio/video channels</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Slots Scheduled Today</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {categoryRooms.reduce((acc, r) => acc + r.slots.length, 0)} Slots
          </div>
          <span className="text-[10px] text-purple-600 font-bold">
            {categoryRooms.reduce((acc, r) => acc + r.slots.reduce((sAcc, s) => sAcc + s.targetItemCount, 0), 0)} Target items today
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Concurrent Viewers</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {categoryRooms.reduce((acc, r) => acc + r.viewerCount, 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-bold">100% Escrow protected</span>
        </div>
      </section>

      {/* ================= SECTION 1: CATEGORY LIVE ROOM SELECTOR & STATUS ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600" />
              <span>Category Live Auction Rooms ({categoryRooms.length} Active Channels)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select a category room to manage its daily broadcast slots, target items quota, and live queue.
            </p>
          </div>
        </div>

        {/* Category Room Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryRooms.map((room) => {
            const isSelected = room.id === selectedRoom.id;
            const isBroadcastingInClient = room.id === activeRoom.id;
            const isLive = room.status === 'live';
            const totalTargetItemsInRoom = room.slots.reduce((acc, s) => acc + s.targetItemCount, 0);
            const totalCompletedInRoom = room.slots.reduce((acc, s) => acc + s.completedItemsCount, 0);

            return (
              <div
                key={room.id}
                onClick={() => handleSelectAdminRoom(room.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-50/80 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Top badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{room.icon}</span>
                    <span className="font-black text-slate-900 text-sm">{room.title}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isLive ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {room.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                  {room.description}
                </p>

                {/* Slots info & Stats */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Active Slot:</span>
                    <span className="font-mono font-black text-emerald-700">
                      {room.slots.find(s => s.id === room.activeSlotId)?.code || 'Slot A'} (On-Air)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Total Target Items Today:</span>
                    <strong className="text-slate-900 font-mono">{totalTargetItemsInRoom} items</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Items Sold Today:</span>
                    <span className="text-emerald-600 font-bold">{totalCompletedInRoom} sold</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Live Viewers:</span>
                    <span className="text-slate-700">{room.viewerCount.toLocaleString()} watching</span>
                  </div>
                </div>

                {/* Room Controls */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateRoomStatus(room.id, isLive ? 'paused' : 'live');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isLive 
                        ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100' 
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isLive ? 'Pause Room' : 'Go Live'}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveRoomId(room.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      isBroadcastingInClient
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{isBroadcastingInClient ? 'Viewing in Live Room' : 'Tune Main Viewer'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION 2: DAILY SLOTS ALLOCATION MANAGER (CORE REQUIREMENT) ================= */}
      <section className="space-y-4 bg-slate-50/70 p-6 rounded-3xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedRoom.icon}</span>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Daily Slots Allocation for {selectedRoom.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control daily slot capacity (e.g. <strong>Slot A 200 items for today</strong>, <strong>Slot B 350 items for today</strong>), set which slot is actively broadcasting on air, and reallocate quotas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddSlotModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Slot to Room</span>
            </button>
          </div>
        </div>

        {/* Daily Slots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {selectedRoom.slots.map((slot) => {
            const isSelectedForQueue = slot.id === selectedSlot.id;
            const isOnAir = slot.id === selectedRoom.activeSlotId || slot.status === 'active';
            const isEditingTarget = editingSlotId === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => setAdminSelectedSlotId(slot.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelectedForQueue
                    ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Slot Code, Name & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-slate-900 text-white">
                        {slot.code}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm truncate max-w-[150px]">
                        {slot.name}
                      </h3>
                    </div>

                    {isOnAir ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        ON AIR NOW
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                        {slot.status}
                      </span>
                    )}
                  </div>

                  {/* Scheduled window */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Time Window: <strong>{slot.scheduledStartTime} – {slot.scheduledEndTime}</strong></span>
                  </div>

                  {/* TARGET ITEMS ALLOCATION (USER CORE REQUIREMENT) */}
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 mb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Target Items for Today:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSlotId(slot.id);
                          setCustomTargetInput(slot.targetItemCount.toString());
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Quota</span>
                      </button>
                    </div>

                    {isEditingTarget ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          value={customTargetInput}
                          onChange={(e) => setCustomTargetInput(e.target.value)}
                          className="w-24 px-2 py-1 text-sm font-mono font-bold rounded-lg border border-emerald-400 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveSlotTarget(slot.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSlotId(null)}
                          className="px-2 py-1 text-slate-500 text-xs hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between">
                        <div className="text-2xl font-black text-emerald-900 font-mono">
                          {slot.targetItemCount}{' '}
                          <span className="text-xs font-sans font-bold text-emerald-700">
                            live auction items
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quick increment / decrement buttons */}
                    <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleQuickAdjustTarget(slot.id, slot.targetItemCount, 50)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition cursor-pointer"
                        title="Add +50 items to daily target"
                      >
                        +50 items
                      </button>
                      <button
                        onClick={() => handleQuickAdjustTarget(slot.id, slot.targetItemCount, 100)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition cursor-pointer"
                        title="Add +100 items to daily target"
                      >
                        +100 items
                      </button>
                      <button
                        onClick={() => handleQuickAdjustTarget(slot.id, slot.targetItemCount, -50)}
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
                        title="Deduct -50 items from daily target"
                      >
                        -50 items
                      </button>
                    </div>

                    {/* Progress tracking */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                        <span>Today's Progress:</span>
                        <span><strong>{slot.completedItemsCount}</strong> of <strong>{slot.targetItemCount}</strong> items ({Math.min(100, Math.round((slot.completedItemsCount / slot.targetItemCount) * 100))}%)</span>
                      </div>
                      <div className="w-full bg-emerald-200/50 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(100, Math.round((slot.completedItemsCount / slot.targetItemCount) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slot Stats */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Catalog Queue:</span>
                      <strong className="text-slate-900 font-mono text-xs">{slot.products.length} Lots</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block">Sales Volume:</span>
                      <strong className="text-emerald-700 font-mono text-xs">₦{slot.totalSalesVolume.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Slot Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {!isOnAir ? (
                    <button
                      onClick={() => setRoomActiveSlot(selectedRoom.id, slot.id)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Make On-Air Slot</span>
                    </button>
                  ) : (
                    <span className="flex-1 text-center py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                      Currently Broadcasting
                    </span>
                  )}

                  <select
                    value={slot.status}
                    onChange={(e) => updateSlotStatus(selectedRoom.id, slot.id, e.target.value as SlotStatusCode)}
                    className="text-xs font-semibold py-1.5 px-2 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SECTION 3: LIVE QUEUE MANAGEMENT FOR SELECTED SLOT ================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded font-mono font-black text-xs bg-emerald-600 text-white">
                {selectedSlot.code}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                Catalog & Live Queue ({selectedSlot.products.length} Items Loaded)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Managing products inside <strong>{selectedRoom.title} › {selectedSlot.code} ({selectedSlot.name})</strong>. Reorder queue, skip item, or extend auction timer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product to This Slot</span>
            </button>
          </div>
        </div>

        {/* Queue Items Table */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {selectedSlot.products.length === 0 ? (
            <div className="p-12 text-center bg-white space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No products loaded in {selectedSlot.code} yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Target is {selectedSlot.targetItemCount} items for today. Add single products or upload a catalog text file directly into this slot.
              </p>
              <button
                onClick={openTextUploader}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Upload Text File into {selectedSlot.code}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white">
              {selectedSlot.products.map((product, idx) => {
                const isActive = idx === selectedSlot.activeProductIndex;
                const isPast = idx < selectedSlot.activeProductIndex;

                return (
                  <div
                    key={product.id}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                      isActive 
                        ? 'bg-emerald-50/50 border-l-4 border-l-emerald-600 font-bold' 
                        : isPast 
                        ? 'bg-slate-50/60 opacity-60' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Product Info */}
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-xs font-mono font-bold text-slate-400 text-center">
                        #{idx + 1}
                      </span>

                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                      />

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate max-w-xs sm:max-w-md">
                            {product.title}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white tracking-wider animate-pulse">
                              ON AIR NOW
                            </span>
                          )}
                          {product.status === 'sold' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              SOLD (₦{product.winner?.bidAmount.toLocaleString()})
                            </span>
                          )}
                          {product.status === 'passed' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                              NO SALE / PASSED
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                          <span>Starting: ₦{product.startingPrice.toLocaleString()}</span>
                          <span>•</span>
                          <span>Current: <strong className="text-slate-900">₦{product.currentBid.toLocaleString()}</strong></span>
                          <span>•</span>
                          <span>Inc: +₦{product.bidIncrement.toLocaleString()}</span>
                          <span>•</span>
                          <span>{product.seller.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Reordering */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isActive ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => extendTimerInSlot(selectedRoom.id, selectedSlot.id, 30)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition cursor-pointer"
                            title="Add +30 seconds to the live clock"
                          >
                            +30s
                          </button>
                          <button
                            onClick={() => hostAction('PAUSE')}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                          >
                            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => skipCurrentProductInSlot(selectedRoom.id, selectedSlot.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-black transition flex items-center gap-1 cursor-pointer"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                            <span>End Item</span>
                          </button>
                        </div>
                      ) : !isPast ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => reorderProductInSlot(selectedRoom.id, selectedSlot.id, idx, idx - 1)}
                            disabled={idx <= selectedSlot.activeProductIndex + 1}
                            className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                            title="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => reorderProductInSlot(selectedRoom.id, selectedSlot.id, idx, idx + 1)}
                            disabled={idx >= selectedSlot.products.length - 1}
                            className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                            title="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= SECTION 4: REAL-TIME FRAUD & RISK TELEMETRY ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Real-Time Fraud & Abuse Detection (Section 44)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Internal risk metrics for suspicious bidder velocity, bot behaviors, and failed payment histories across all category rooms.
            </p>
          </div>
          <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full font-bold">
            {fraudAlerts.length} Alerts Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fraudAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {alert.maskedBidder}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                      alert.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.riskLevel} RISK
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {alert.reason}
                </p>

                {alert.actionTaken && (
                  <div className="mt-2 text-[11px] font-bold text-slate-500">
                    Status: <span className="uppercase text-slate-900">{alert.actionTaken}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => takeFraudAction(alert.id, 'restricted')}
                  className="flex-1 py-1.5 text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer"
                >
                  Restrict Bidding
                </button>
                <button
                  onClick={() => takeFraudAction(alert.id, 'suspended')}
                  className="flex-1 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                >
                  Suspend Account
                </button>
                <button
                  onClick={() => takeFraudAction(alert.id, 'cleared')}
                  className="py-1.5 px-3 text-xs font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SECTION 5: HOST & ADMIN BROADCAST NOTICE ================= */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Broadcast Official Host/Admin Notice Across All Live Category Rooms</span>
        </h3>

        <form onSubmit={handleSendCustomAnnouncement} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Next slot starting at 01:30 PM with 350 items. All lots escrow guaranteed."
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
          >
            Broadcast Notice
          </button>
        </form>
      </section>

      {/* ================= MODAL: ADD NEW SLOT TO CATEGORY ROOM ================= */}
      {showAddSlotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Add New Slot to {selectedRoom.title}
                </h3>
                <p className="text-xs text-slate-500">Configure daily capacity and time schedule</p>
              </div>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Slot Identifier Code</label>
                <input
                  type="text"
                  placeholder="e.g. Slot D"
                  value={newSlotCode}
                  onChange={(e) => setNewSlotCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slot Name / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Clearance & Overstock"
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Items for Today (e.g. 200, 350):
                </label>
                <input
                  type="number"
                  placeholder="200"
                  value={newSlotTarget}
                  onChange={(e) => setNewSlotTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="11:00 PM"
                    value={newSlotStart}
                    onChange={(e) => setNewSlotStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="02:00 AM"
                    value={newSlotEnd}
                    onChange={(e) => setNewSlotEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD PRODUCT TO CURRENT SLOT ================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Add Product to {selectedSlot.code}</h3>
                <p className="text-xs text-slate-500">{selectedRoom.title} queue</p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Apple MacBook Pro M3 14-inch"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Starting Price (₦)</label>
                  <input
                    type="number"
                    value={newStartingPrice}
                    onChange={(e) => setNewStartingPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bid Increment (₦)</label>
                  <input
                    type="number"
                    value={newBidIncrement}
                    onChange={(e) => setNewBidIncrement(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Condition</label>
                <select
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Brand New">Brand New</option>
                  <option value="Foreign Used / Grade A">Foreign Used / Grade A</option>
                  <option value="Certified Refurbished">Certified Refurbished</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Add to {selectedSlot.code}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
