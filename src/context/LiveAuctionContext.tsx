import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  AuctionProduct, 
  LiveAuctionEvent, 
  BidRecord, 
  LiveChatMessage, 
  LiveReaction, 
  UserNotification, 
  FraudAlert, 
  UserRole,
  CategoryLiveRoom,
  AuctionSlot,
  SlotStatusCode,
  AuctionStatus
} from '../types';
import { 
  INITIAL_CHAT_MESSAGES, 
  INITIAL_FRAUD_ALERTS, 
  INITIAL_NOTIFICATIONS 
} from '../data/mockData';
import { INITIAL_CATEGORY_ROOMS } from '../data/categoryRoomsData';
import { sounds } from '../utils/audio';
import { speechAnnouncer } from '../utils/speechAnnouncer';
import { filterChatMessage } from '../utils/chatSafety';
import confetti from 'canvas-confetti';

interface LiveAuctionContextType {
  // Category Rooms & Slots
  categoryRooms: CategoryLiveRoom[];
  activeRoomId: string;
  activeRoom: CategoryLiveRoom;
  activeSlotId: string;
  activeSlot: AuctionSlot;
  setActiveRoomId: (roomId: string) => void;
  setActiveSlotId: (slotId: string, slotData?: AuctionSlot) => void;

  // Event & Current Products (mapped to active room & slot)
  currentEvent: LiveAuctionEvent;
  products: AuctionProduct[];
  activeProductIndex: number;
  activeProduct: AuctionProduct | null;
  nextProduct: AuctionProduct | null;
  timeRemaining: number;
  isPaused: boolean;
  isExtended: boolean;
  transitionCountdown: number | null;
  
  // Bidding & Live Feed
  currentBid: number;
  bidHistory: BidRecord[];
  isUserWinning: boolean;
  hasUserBiddedOnActive: boolean;
  userMaxBid: number | null;
  userProxyBids: Record<string, number>;
  placeBid: (amount: number) => { success: boolean; message: string };
  setProxyMaxBid: (productId: string, maxAmount: number) => void;
  
  // Chat & Reactions
  chatMessages: LiveChatMessage[];
  sendChatMessage: (text: string) => { success: boolean; reason?: string };
  reactions: LiveReaction[];
  sendReaction: (emoji: string) => void;
  pinChatMessage: (id: string) => void;
  deleteChatMessage: (id: string) => void;
  
  // Admin & Controls
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  userNickname: string;
  setUserNickname: (name: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  
  // Host Actions
  triggerHostAnnouncement: (text: string) => void;
  activeAnnouncement: string | null;
  hostAction: (action: 'GOING_ONCE' | 'GOING_TWICE' | 'FINAL_CALL' | 'SOLD' | 'PAUSE' | 'EXTEND' | 'NEXT') => void;
  
  // Slot & Room Admin Controls
  updateSlotTargetCount: (roomId: string, slotId: string, newTarget: number) => void;
  addSlotToRoom: (roomId: string, slotData: { code: string; name: string; targetItemCount: number; scheduledStartTime: string; scheduledEndTime: string }) => void;
  updateSlotStatus: (roomId: string, slotId: string, status: SlotStatusCode) => void;
  setRoomActiveSlot: (roomId: string, slotId: string) => void;
  updateRoomStatus: (roomId: string, status: AuctionStatus) => void;
  addProductToSlot: (roomId: string, slotId: string, product: AuctionProduct) => void;
  importProductsToSlot: (roomId: string, slotId: string, items: any[], mode: 'append' | 'replace') => void;
  reorderProductInSlot: (roomId: string, slotId: string, fromIndex: number, toIndex: number) => void;
  skipCurrentProductInSlot: (roomId: string, slotId: string) => void;
  extendTimerInSlot: (roomId: string, slotId: string, seconds: number) => void;
  
  // Compatibility helpers (operate on active room & slot)
  importProductsFromText: (items: any[], mode: 'append' | 'replace') => void;
  reorderProduct: (fromIndex: number, toIndex: number) => void;
  skipCurrentProduct: () => void;
  extendAuctionTimer: (seconds: number) => void;
  
  // Winner & Payments
  winnerModalProduct: AuctionProduct | null;
  closeWinnerModal: () => void;
  
  // Watchlist & Push Notifications
  watchlist: string[];
  toggleWatchlist: (productId: string) => boolean;
  isInWatchlist: (productId: string) => boolean;
  watchlistItems: AuctionProduct[];
  allAuctionProducts: AuctionProduct[];
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  activeToastNotification: UserNotification | null;
  dismissToastNotification: () => void;
  simulateWatchlistPriceChange: (productId?: string) => void;
  simulateWatchlistEndingSoon: (productId?: string) => void;
  simulateTwoMinuteClosingAlert: (productId?: string) => void;
  setLotTimerForTesting: (productId: string, seconds: number) => void;
  isNativeNotificationSupported: boolean;
  jumpToProductAuction: (productId: string) => boolean;

  // Notifications & Fraud
  notifications: UserNotification[];
  unreadNotifsCount: number;
  markNotifAsRead: (id: string) => void;
  fraudAlerts: FraudAlert[];
  takeFraudAction: (alertId: string, action: 'restricted' | 'suspended' | 'cleared') => void;
  
  // Simulation Scenario (Section 77)
  runAutomatedScenario77: () => void;
  isSimulationRunning: boolean;
}

const LiveAuctionContext = createContext<LiveAuctionContextType | undefined>(undefined);

export const LiveAuctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Category Rooms State
  const [categoryRooms, setCategoryRooms] = useState<CategoryLiveRoom[]>(INITIAL_CATEGORY_ROOMS);
  const [activeRoomId, setActiveRoomIdState] = useState<string>('room_phones');
  const [activeSlotId, setActiveSlotIdState] = useState<string>('slot_phones_a');

  // Find active room & slot safely
  const activeRoom = categoryRooms.find(r => r.id === activeRoomId) || categoryRooms[0];
  const activeSlot = activeRoom.slots.find(s => s.id === activeSlotId) || activeRoom.slots[0];

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isExtended, setIsExtended] = useState<boolean>(false);
  const [transitionCountdown, setTransitionCountdown] = useState<number | null>(null);

  // User State
  const [userRole, setUserRole] = useState<UserRole>('buyer');
  const [userNickname, setUserNickname] = useState<string>('DealHunter_Lagos');
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  
  // Winner Modal
  const [winnerModalProduct, setWinnerModalProduct] = useState<AuctionProduct | null>(null);

  // Announcements
  const [activeAnnouncement, setActiveAnnouncement] = useState<string | null>(null);

  // Active products in the current slot
  const products = activeSlot?.products || [];
  const activeProductIndex = activeSlot?.activeProductIndex || 0;
  const activeProduct = products[activeProductIndex] || null;
  const nextProduct = products[activeProductIndex + 1] || null;
  const currentBid = activeProduct ? activeProduct.currentBid : 0;
  const timeRemaining = activeProduct ? activeProduct.remainingSeconds : 0;

  // Bids & Proxy
  const [bidHistory, setBidHistory] = useState<BidRecord[]>([
    {
      id: 'bid_init_1',
      auctionProductId: 'phone_1',
      bidderId: 'usr_other_1',
      maskedBidder: 'Bidder_472',
      amount: 1150000,
      timestamp: '12:03:10 PM'
    },
    {
      id: 'bid_init_2',
      auctionProductId: 'phone_1',
      bidderId: 'usr_other_2',
      maskedBidder: 'TechKing_99',
      amount: 1220000,
      timestamp: '12:03:45 PM'
    },
    {
      id: 'bid_init_3',
      auctionProductId: 'phone_1',
      bidderId: 'usr_other_3',
      maskedBidder: 'AbujaBuyer_77',
      amount: 1280000,
      timestamp: '12:04:12 PM'
    }
  ]);
  const [userProxyBids, setUserProxyBids] = useState<Record<string, number>>({});
  
  // Chat & Reactions
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  
  // Notifications & Fraud
  const [notifications, setNotifications] = useState<UserNotification[]>(INITIAL_NOTIFICATIONS);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>(INITIAL_FRAUD_ALERTS);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);

  // Derived: Current user winning status
  const latestBid = bidHistory[bidHistory.length - 1];
  const isUserWinning = Boolean(latestBid?.isCurrentUser);
  const hasUserBiddedOnActive = bidHistory.some(b => b.isCurrentUser && b.auctionProductId === activeProduct?.id);
  const userMaxBid = activeProduct ? (userProxyBids[activeProduct.id] || null) : null;

  // Switch Room handler
  const setActiveRoomId = (roomId: string) => {
    const targetRoom = categoryRooms.find(r => r.id === roomId);
    if (!targetRoom) return;
    setActiveRoomIdState(roomId);
    setActiveSlotIdState(targetRoom.activeSlotId || targetRoom.slots[0]?.id || '');
    setTransitionCountdown(null);
  };

  // Switch Slot handler
  const setActiveSlotId = (slotId: string, slotData?: AuctionSlot) => {
    if (slotData) {
      setCategoryRooms(prev => prev.map(room => {
        if (room.id !== activeRoom.id) return room;
        const exists = room.slots.some(s => s.id === slotId);
        if (!exists) {
          return {
            ...room,
            activeSlotId: slotId,
            slots: [...room.slots, slotData]
          };
        }
        return {
          ...room,
          activeSlotId: slotId
        };
      }));
    }
    setActiveSlotIdState(slotId);
    setTransitionCountdown(null);
  };

  // Sound sync
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sounds.enabled = enabled;
  };

  const addNotification = useCallback((title: string, message: string, type: UserNotification['type'], productTitle?: string, productId?: string, price?: number) => {
    const newNotif: UserNotification = {
      id: 'notif_' + Date.now() + Math.random().toString(36).substring(2, 5),
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type,
      productTitle,
      productId,
      price
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Watchlist State (saved in localStorage)
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('naija_auction_watchlist');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore fallback
      }
    }
    return ['phone_1', 'laptop_1', 'solar_1'];
  });

  // Active floating toast for real-time push alerts
  const [activeToastNotification, setActiveToastNotification] = useState<UserNotification | null>(null);

  const dismissToastNotification = useCallback(() => {
    setActiveToastNotification(null);
  }, []);

  // Auto dismiss toast after 6s
  useEffect(() => {
    if (!activeToastNotification) return;
    const timer = setTimeout(() => {
      setActiveToastNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToastNotification]);

  // Push Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const isNativeNotificationSupported = typeof window !== 'undefined' && 'Notification' in window;

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          // Trigger a system confirmation notification
          try {
            const welcomeNotif = new Notification('🟢 Watchlist Push Alerts Enabled', {
              body: 'You will receive native browser push alerts whenever an item in your watchlist is within 2 minutes of closing!',
              icon: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=192&q=80',
              tag: 'watchlist_permission_welcome'
            });
            setTimeout(() => {
              try { welcomeNotif.close(); } catch (e) {}
            }, 6000);
          } catch (e) {
            // silent catch in restricted iframe environments
          }
        }
        return perm;
      } catch (e) {
        console.warn('Could not request Notification permission:', e);
      }
    }
    return 'default';
  }, []);

  // Flat array of all products across all category rooms & slots
  const allAuctionProducts = React.useMemo(() => {
    const list: AuctionProduct[] = [];
    categoryRooms.forEach(room => {
      room.slots.forEach(slot => {
        slot.products.forEach(p => {
          if (!list.some(item => item.id === p.id)) {
            list.push(p);
          }
        });
      });
    });
    return list;
  }, [categoryRooms]);

  // Derived list of products currently in the user's Watchlist
  const watchlistItems = React.useMemo(() => {
    return allAuctionProducts.filter(p => watchlist.includes(p.id));
  }, [allAuctionProducts, watchlist]);

  // Save watchlist updates to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('naija_auction_watchlist', JSON.stringify(watchlist));
      } catch (e) {
        // ignore
      }
    }
  }, [watchlist]);

  // Forward ref for jumping from native push notifications
  const jumpToProductAuctionRef = useRef<(id: string) => boolean>(() => false);
  const allAuctionProductsRef = useRef(allAuctionProducts);
  allAuctionProductsRef.current = allAuctionProducts;

  // Ending Soon tracker ref to avoid duplicate alerts for the same lot & threshold
  const notifiedEndingSoonRef = useRef<Set<string>>(new Set());

  // Central Push Dispatcher (Browser Native Push API + In-App Push Toast + Notification Center)
  const dispatchPushNotification = useCallback((params: {
    title: string;
    message: string;
    type: UserNotification['type'];
    productTitle?: string;
    productId?: string;
    price?: number;
  }) => {
    const notif: UserNotification = {
      id: 'notif_push_' + Date.now() + Math.random().toString(36).substring(2, 5),
      title: params.title,
      message: params.message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: params.type,
      productTitle: params.productTitle,
      productId: params.productId,
      price: params.price
    };

    // Add to notifications list
    setNotifications(prev => [notif, ...prev]);

    // Show high-visibility in-app push toast
    setActiveToastNotification(notif);

    // Play appropriate alert sound (special harmonic chime for closing-soon)
    if (params.type === 'ending_soon') {
      sounds.playClosingSoonAlert();
    } else {
      sounds.playBidSound();
    }

    // Trigger native browser notification if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const prod = allAuctionProductsRef.current.find(p => p.id === params.productId);
        const iconUrl = prod?.images?.[0] || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=192&q=80';

        const nativeNotif = new Notification(params.title, {
          body: params.message,
          icon: iconUrl,
          badge: iconUrl,
          tag: `watchlist_${params.type}_${params.productId || 'item'}`,
          silent: false
        });

        nativeNotif.onclick = (e) => {
          e.preventDefault();
          try {
            window.focus();
          } catch (err) {
            // ignore
          }
          if (params.productId) {
            jumpToProductAuctionRef.current(params.productId);
          }
          nativeNotif.close();
        };
      } catch (e) {
        console.warn('Native browser push notification error:', e);
      }
    }
  }, []);

  // Toggle item in Watchlist with automated notification onboarding
  const toggleWatchlist = useCallback((productId: string): boolean => {
    let nowInWatchlist = false;
    setWatchlist(prev => {
      if (prev.includes(productId)) {
        nowInWatchlist = false;
        return prev.filter(id => id !== productId);
      } else {
        nowInWatchlist = true;
        return [...prev, productId];
      }
    });

    const targetProduct = allAuctionProducts.find(p => p.id === productId);
    const title = targetProduct?.title || 'Auction Lot';

    if (!watchlist.includes(productId)) {
      // Newly added: Ask for browser push permission if default
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setNotificationPermission(perm);
        }).catch(() => {});
      }

      // If the added item is active and ALREADY within 2 minutes of closing, alert immediately!
      if (targetProduct && targetProduct.status === 'active' && targetProduct.remainingSeconds <= 120 && targetProduct.remainingSeconds > 0) {
        const twoMinKey = `${targetProduct.id}_2min`;
        notifiedEndingSoonRef.current.add(twoMinKey);
        const mins = Math.floor(targetProduct.remainingSeconds / 60);
        const secs = targetProduct.remainingSeconds % 60;
        const timeStr = mins > 0 ? `${mins}m ${secs > 0 ? secs + 's' : ''}` : `${secs}s`;

        dispatchPushNotification({
          title: `⏳ Closing Soon: ${targetProduct.title}`,
          message: `Watchlist item "${targetProduct.title}" has under 2 minutes remaining (${timeStr})! Current high bid is ₦${targetProduct.currentBid.toLocaleString()}. Click to view lot and bid.`,
          type: 'ending_soon',
          productTitle: targetProduct.title,
          productId: targetProduct.id,
          price: targetProduct.currentBid
        });
      } else {
        dispatchPushNotification({
          title: '⭐ Added to Watchlist',
          message: `You will receive native browser push alerts when bids change or when ${title} is within 2 minutes of closing.`,
          type: 'reminder',
          productTitle: title,
          productId
        });
      }
    }

    return !watchlist.includes(productId);
  }, [watchlist, allAuctionProducts, dispatchPushNotification]);

  const isInWatchlist = useCallback((productId: string): boolean => {
    return watchlist.includes(productId);
  }, [watchlist]);

  // Jump to specific product's room and slot
  const jumpToProductAuction = useCallback((productId: string): boolean => {
    for (const room of categoryRooms) {
      for (const slot of room.slots) {
        const prod = slot.products.find(p => p.id === productId);
        if (prod) {
          setActiveRoomId(room.id);
          setActiveSlotId(slot.id);
          return true;
        }
      }
    }
    return false;
  }, [categoryRooms]);

  jumpToProductAuctionRef.current = jumpToProductAuction;

  // Manual tester/simulation triggers
  const simulateWatchlistPriceChange = useCallback((productId?: string) => {
    const targetId = productId || (watchlist.length > 0 ? watchlist[0] : allAuctionProducts[0]?.id);
    if (!targetId) return;

    const prod = allAuctionProducts.find(p => p.id === targetId);
    if (!prod) return;

    const priceBump = prod.bidIncrement * 2;
    const newBid = prod.currentBid + priceBump;

    // Update product price in categoryRooms
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => ({
        ...room,
        slots: room.slots.map(slot => ({
          ...slot,
          products: slot.products.map(p => {
            if (p.id === targetId) {
              return {
                ...p,
                currentBid: newBid,
                bidsCount: p.bidsCount + 1
              };
            }
            return p;
          })
        }))
      }));
    });

    dispatchPushNotification({
      title: '🔔 Price Update: Watchlist Auction',
      message: `A new bid of ₦${newBid.toLocaleString()} was just placed on "${prod.title}". Tap to check the room.`,
      type: 'price_change',
      productTitle: prod.title,
      productId: prod.id,
      price: newBid
    });
  }, [watchlist, allAuctionProducts, dispatchPushNotification]);

  const simulateWatchlistEndingSoon = useCallback((productId?: string) => {
    const targetId = productId || (watchlist.length > 0 ? watchlist[0] : allAuctionProducts[0]?.id);
    if (!targetId) return;

    const prod = allAuctionProducts.find(p => p.id === targetId);
    if (!prod) return;

    dispatchPushNotification({
      title: '⏱ Ending Soon: Final Countdown!',
      message: `"${prod.title}" is in its final countdown! Current high bid: ₦${prod.currentBid.toLocaleString()}. Don’t miss your chance!`,
      type: 'ending_soon',
      productTitle: prod.title,
      productId: prod.id,
      price: prod.currentBid
    });
  }, [watchlist, allAuctionProducts, dispatchPushNotification]);

  // Specific simulation for 2-minute (120s) closing alert
  const simulateTwoMinuteClosingAlert = useCallback((productId?: string) => {
    const targetId = productId || (watchlist.length > 0 ? watchlist[0] : allAuctionProducts[0]?.id);
    if (!targetId) return;

    const prod = allAuctionProducts.find(p => p.id === targetId);
    if (!prod) return;

    // Prompt for browser permission if not yet decided
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        setNotificationPermission(perm);
      }).catch(() => {});
    }

    dispatchPushNotification({
      title: `⏳ 2 Minutes Left: ${prod.title}`,
      message: `Watchlist item "${prod.title}" is closing in under 2 minutes (1m 58s)! Current high bid is ₦${prod.currentBid.toLocaleString()}. Click to place your bid now.`,
      type: 'ending_soon',
      productTitle: prod.title,
      productId: prod.id,
      price: prod.currentBid
    });
  }, [watchlist, allAuctionProducts, dispatchPushNotification]);

  // Adjust lot timer for fast countdown testing (e.g. set to 125s so user can watch it cross 120s)
  const setLotTimerForTesting = useCallback((productId: string, seconds: number) => {
    // Clear notification keys so it triggers when timer reaches 120s
    notifiedEndingSoonRef.current.delete(`${productId}_2min`);
    notifiedEndingSoonRef.current.delete(`${productId}_60s`);
    notifiedEndingSoonRef.current.delete(`${productId}_30s`);
    notifiedEndingSoonRef.current.delete(`${productId}_10s`);

    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => ({
        ...room,
        slots: room.slots.map(slot => ({
          ...slot,
          products: slot.products.map(p => {
            if (p.id !== productId) return p;
            return {
              ...p,
              remainingSeconds: seconds,
              durationSeconds: Math.max(p.durationSeconds, seconds)
            };
          })
        }))
      }));
    });
  }, []);

  // Stabilized refs to prevent interval teardowns
  const activeProductRef = useRef(activeProduct);
  activeProductRef.current = activeProduct;
  const watchlistRef = useRef(watchlist);
  watchlistRef.current = watchlist;
  const dispatchPushNotificationRef = useRef(dispatchPushNotification);
  dispatchPushNotificationRef.current = dispatchPushNotification;

  // Timer Tick Engine for active item
  useEffect(() => {
    if (isPaused || transitionCountdown !== null || !activeProduct || activeProduct.status !== 'active') {
      return;
    }

    const timer = setInterval(() => {
      const prod = activeProductRef.current;
      if (!prod || prod.status !== 'active') return;

      // Check if active item is in watchlist and within 2 minutes of closing
      if (watchlistRef.current.includes(prod.id)) {
        // 2-minute mark (120 seconds):
        if (prod.remainingSeconds <= 120 && prod.remainingSeconds > 0) {
          const twoMinKey = `${prod.id}_2min`;
          if (!notifiedEndingSoonRef.current.has(twoMinKey)) {
            notifiedEndingSoonRef.current.add(twoMinKey);
            const mins = Math.floor(prod.remainingSeconds / 60);
            const secs = prod.remainingSeconds % 60;
            const timeStr = mins > 0 ? `${mins}m ${secs > 0 ? secs + 's' : ''}` : `${secs}s`;

            dispatchPushNotificationRef.current({
              title: `⏳ 2 Minutes Left: ${prod.title}`,
              message: `Watchlist item "${prod.title}" is closing in under 2 minutes (${timeStr})! Current high bid: ₦${prod.currentBid.toLocaleString()}. Click to place your bid.`,
              type: 'ending_soon',
              productTitle: prod.title,
              productId: prod.id,
              price: prod.currentBid
            });
          }
        } else if (prod.remainingSeconds > 120) {
          // Reset key if anti-sniping or seller extension pushed timer back over 120s
          notifiedEndingSoonRef.current.delete(`${prod.id}_2min`);
        }

        // 1-minute alert (60 seconds):
        if (prod.remainingSeconds === 60) {
          const key60 = `${prod.id}_60s`;
          if (!notifiedEndingSoonRef.current.has(key60)) {
            notifiedEndingSoonRef.current.add(key60);
            dispatchPushNotificationRef.current({
              title: `⚡ 1 Minute Left: ${prod.title}`,
              message: `Only 60 seconds remaining on "${prod.title}"! Current high bid: ₦${prod.currentBid.toLocaleString()}.`,
              type: 'ending_soon',
              productTitle: prod.title,
              productId: prod.id,
              price: prod.currentBid
            });
          }
        }

        // Final 30s & 10s urgent alerts:
        if (prod.remainingSeconds === 30 || prod.remainingSeconds === 10) {
          const key = `${prod.id}_${prod.remainingSeconds}`;
          if (!notifiedEndingSoonRef.current.has(key)) {
            notifiedEndingSoonRef.current.add(key);
            dispatchPushNotificationRef.current({
              title: `⏱ Ending Soon (${prod.remainingSeconds}s): ${prod.title}`,
              message: `Only ${prod.remainingSeconds}s left to bid! Current high bid is ₦${prod.currentBid.toLocaleString()}.`,
              type: 'ending_soon',
              productTitle: prod.title,
              productId: prod.id,
              price: prod.currentBid
            });
          }
        }
      }

      // Play subtle countdown tick for final 10 seconds (with escalating suspense in final 5 seconds)
      if (prod.remainingSeconds <= 10 && prod.remainingSeconds > 0) {
        sounds.playCountdownTick(prod.remainingSeconds);
      }

      setCategoryRooms(prevRooms => {
        return prevRooms.map(room => {
          if (room.id !== activeRoom.id) return room;
          return {
            ...room,
            slots: room.slots.map(slot => {
              if (slot.id !== activeSlot.id) return slot;
              return {
                ...slot,
                products: slot.products.map((p, idx) => {
                  if (idx !== slot.activeProductIndex) return p;
                  if (p.remainingSeconds <= 1) {
                    return { ...p, remainingSeconds: 0 };
                  }
                  return { ...p, remainingSeconds: p.remainingSeconds - 1 };
                })
              };
            })
          };
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, transitionCountdown, activeRoom.id, activeSlot.id, activeProduct?.id, activeProduct?.status]);

  // Handle Auction End when item time hits 0
  useEffect(() => {
    if (!activeProduct || activeProduct.remainingSeconds > 0 || activeProduct.status !== 'active') {
      return;
    }

    // Determine winner
    const winningBid = bidHistory.filter(b => b.auctionProductId === activeProduct.id).slice(-1)[0];
    const isSold = winningBid && (!activeProduct.reservePrice || winningBid.amount >= activeProduct.reservePrice);

    if (isSold && winningBid?.isCurrentUser) {
      sounds.playWinFanfare();
    } else {
      sounds.playSoldGavelSound();
    }

    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              completedItemsCount: isSold ? slot.completedItemsCount + 1 : slot.completedItemsCount,
              totalSalesVolume: isSold ? slot.totalSalesVolume + winningBid.amount : slot.totalSalesVolume,
              products: slot.products.map((p, idx) => {
                if (idx !== slot.activeProductIndex) return p;
                return {
                  ...p,
                  status: isSold ? 'sold' : 'passed',
                  winner: isSold ? {
                    id: winningBid.bidderId,
                    nickname: winningBid.maskedBidder,
                    bidAmount: winningBid.amount,
                    timestamp: new Date().toLocaleTimeString()
                  } : undefined
                };
              })
            };
          })
        };
      });
    });

    if (isSold && winningBid.isCurrentUser) {
      sounds.playWinFanfare();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
      setWinnerModalProduct({
        ...activeProduct,
        winner: {
          id: winningBid.bidderId,
          nickname: winningBid.maskedBidder,
          bidAmount: winningBid.amount,
          timestamp: new Date().toLocaleTimeString()
        }
      });
      addNotification(
        '🎉 YOU WON THE AUCTION!',
        `Congratulations! You won the ${activeProduct.title} for ₦${winningBid.amount.toLocaleString()}. Please complete payment within 12 hours.`,
        'won',
        activeProduct.title
      );
    } else if (isSold) {
      addNotification(
        'Item Sold!',
        `${activeProduct.title} sold to ${winningBid.maskedBidder} for ₦${winningBid.amount.toLocaleString()}.`,
        'system',
        activeProduct.title
      );
    }

    // Start 5-second countdown to next product in the slot
    setTransitionCountdown(5);
  }, [activeProduct?.remainingSeconds, activeProduct?.status]);

  // Transition countdown timer between lots in the slot
  useEffect(() => {
    if (transitionCountdown === null) return;

    if (transitionCountdown <= 0) {
      setTransitionCountdown(null);
      // Move to next product if available in the slot
      if (activeProductIndex + 1 < products.length) {
        setCategoryRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room.id !== activeRoom.id) return room;
            return {
              ...room,
              slots: room.slots.map(slot => {
                if (slot.id !== activeSlot.id) return slot;
                const nextIdx = slot.activeProductIndex + 1;
                return {
                  ...slot,
                  activeProductIndex: nextIdx,
                  products: slot.products.map((p, i) => {
                    if (i === nextIdx) {
                      return { ...p, status: 'active' };
                    }
                    return p;
                  })
                };
              })
            };
          });
        });
      } else {
        // Slot completed
        triggerHostAnnouncement(`🏁 ${activeSlot.code} has concluded! Thank you for participating.`);
      }
      return;
    }

    const timer = setTimeout(() => {
      setTransitionCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [transitionCountdown, activeProductIndex, products.length, activeRoom.id, activeSlot.id, activeSlot.code]);

  // Simulated background bids to keep room dynamic and competitive
  useEffect(() => {
    if (!activeProduct || activeProduct.status !== 'active' || isPaused || transitionCountdown !== null || isSimulationRunning) {
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() > 0.45 && activeProduct.remainingSeconds > 12) {
        const competitors = ['TechKing_99', 'IkejaWholesale', 'AbujaBuyer_77', 'DealHunter_NG', 'LagosTrader', 'OwerriGadgets', 'KanoTechDealer'];
        const randomBidder = competitors[Math.floor(Math.random() * competitors.length)];
        
        const inc = activeProduct.bidIncrement;
        const newBidAmt = activeProduct.currentBid + inc;

        // Check if user has active proxy bid
        const currentProxy = userProxyBids[activeProduct.id];
        if (currentProxy && currentProxy >= newBidAmt + inc) {
          const userCounterBid = newBidAmt + inc;
          
          setBidHistory(prev => [
            ...prev,
            {
              id: 'bid_' + Date.now(),
              auctionProductId: activeProduct.id,
              bidderId: 'usr_comp_' + Math.random().toString(36).substring(2, 5),
              maskedBidder: randomBidder,
              amount: newBidAmt,
              timestamp: new Date().toLocaleTimeString()
            },
            {
              id: 'bid_proxy_' + Date.now(),
              auctionProductId: activeProduct.id,
              bidderId: 'usr_current',
              maskedBidder: userNickname + ' (Auto-Bid ⚡)',
              amount: userCounterBid,
              timestamp: new Date().toLocaleTimeString(),
              isProxy: true,
              isCurrentUser: true
            }
          ]);

          setCategoryRooms(prevRooms => {
            return prevRooms.map(room => {
              if (room.id !== activeRoom.id) return room;
              return {
                ...room,
                slots: room.slots.map(slot => {
                  if (slot.id !== activeSlot.id) return slot;
                  return {
                    ...slot,
                    totalBidsPlaced: slot.totalBidsPlaced + 2,
                    products: slot.products.map((p, idx) => {
                      if (idx !== slot.activeProductIndex) return p;
                      return {
                        ...p,
                        currentBid: userCounterBid,
                        bidsCount: p.bidsCount + 2
                      };
                    })
                  };
                })
              };
            });
          });

          sounds.playUserBidSuccessSound();
          return;
        }

        // Competitor bid
        setBidHistory(prev => [
          ...prev,
          {
            id: 'bid_' + Date.now(),
            auctionProductId: activeProduct.id,
            bidderId: 'usr_comp_' + Math.random().toString(36).substring(2, 5),
            maskedBidder: randomBidder,
            amount: newBidAmt,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);

        setCategoryRooms(prevRooms => {
          return prevRooms.map(room => {
            if (room.id !== activeRoom.id) return room;
            return {
              ...room,
              slots: room.slots.map(slot => {
                if (slot.id !== activeSlot.id) return slot;
                return {
                  ...slot,
                  totalBidsPlaced: slot.totalBidsPlaced + 1,
                  products: slot.products.map((p, idx) => {
                    if (idx !== slot.activeProductIndex) return p;
                    return {
                      ...p,
                      currentBid: newBidAmt,
                      bidsCount: p.bidsCount + 1
                    };
                  })
                };
              })
            };
          });
        });

        sounds.playCompetitorBidSound();

        // Watchlist Push Notification: notify if item is on user's watchlist
        if (watchlist.includes(activeProduct.id)) {
          dispatchPushNotification({
            title: '🔔 Price Update: ' + activeProduct.title,
            message: `New bid of ₦${newBidAmt.toLocaleString()} placed by ${randomBidder}. Current highest bid updated!`,
            type: 'price_change',
            productTitle: activeProduct.title,
            productId: activeProduct.id,
            price: newBidAmt
          });
        }

        if (isUserWinning) {
          sounds.playOutbidSound();
          addNotification(
            '⚠️ YOU’VE BEEN OUTBID!',
            `Another buyer just placed ₦${newBidAmt.toLocaleString()} on ${activeProduct.title}. Tap to re-bid!`,
            'outbid',
            activeProduct.title
          );
        }
      }
    }, 14000);

    return () => clearInterval(interval);
  }, [activeProduct, isPaused, transitionCountdown, isSimulationRunning, userProxyBids, isUserWinning, userNickname, activeRoom.id, activeSlot.id]);

  // Place Bid (User Action)
  const placeBid = (amount: number): { success: boolean; message: string } => {
    if (!activeProduct) {
      return { success: false, message: 'No active auction product.' };
    }
    if (activeProduct.status !== 'active') {
      return { success: false, message: 'This item is not currently active for bidding.' };
    }
    if (amount <= activeProduct.currentBid) {
      return { success: false, message: `Bid must be higher than current bid (₦${activeProduct.currentBid.toLocaleString()}).` };
    }

    const minRequired = activeProduct.currentBid + activeProduct.bidIncrement;
    if (amount < minRequired) {
      return { success: false, message: `Minimum bid allowed is ₦${minRequired.toLocaleString()} (+₦${activeProduct.bidIncrement.toLocaleString()} increment).` };
    }

    let extendedNow = false;
    let newRemaining = activeProduct.remainingSeconds;

    if (activeProduct.remainingSeconds <= 10 && activeProduct.extensionCount < activeProduct.maxExtensions) {
      extendedNow = true;
      newRemaining = activeProduct.remainingSeconds + 10;
      setIsExtended(true);
      sounds.playUserBidSuccessSound();
      setTimeout(() => sounds.playExtendedSound(), 180);
      setTimeout(() => setIsExtended(false), 3000);
      addNotification(
        '⚡ AUCTION EXTENDED!',
        `New bid in final 10 seconds! Auction on ${activeProduct.title} extended by +10 seconds.`,
        'extended',
        activeProduct.title
      );
    } else {
      sounds.playUserBidSuccessSound();
    }

    const newRecord: BidRecord = {
      id: 'bid_' + Date.now(),
      auctionProductId: activeProduct.id,
      bidderId: 'usr_current',
      maskedBidder: userNickname,
      amount,
      timestamp: new Date().toLocaleTimeString(),
      isCurrentUser: true
    };

    setBidHistory(prev => [...prev, newRecord]);

    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              totalBidsPlaced: slot.totalBidsPlaced + 1,
              products: slot.products.map((p, idx) => {
                if (idx !== slot.activeProductIndex) return p;
                return {
                  ...p,
                  currentBid: amount,
                  bidsCount: p.bidsCount + 1,
                  remainingSeconds: newRemaining,
                  extensionCount: extendedNow ? p.extensionCount + 1 : p.extensionCount
                };
              })
            };
          })
        };
      });
    });

    sendReaction('🔥');
    return { success: true, message: `Bid of ₦${amount.toLocaleString()} placed successfully!` };
  };

  // Set Proxy / Max Bid
  const setProxyMaxBid = (productId: string, maxAmount: number) => {
    setUserProxyBids(prev => ({ ...prev, [productId]: maxAmount }));
    addNotification(
      '⚡ Max Auto-Bid Activated',
      `Your private maximum bid of ₦${maxAmount.toLocaleString()} has been set. The system will automatically counter-bid on your behalf by minimum increment.`,
      'system'
    );
  };

  // Send Chat Message
  const sendChatMessage = (text: string): { success: boolean; reason?: string } => {
    const filter = filterChatMessage(text);
    if (!filter.allowed) {
      return { success: false, reason: filter.reason };
    }

    const newMsg: LiveChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: 'usr_current',
      senderNickname: userRole === 'admin' ? `${userNickname} (Admin)` : userRole === 'host' ? `${userNickname} 🎙️ (Host)` : userNickname,
      text: filter.cleanText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isModerator: userRole === 'admin',
      isHost: userRole === 'host',
      flagged: filter.isFlagged
    };

    setChatMessages(prev => [...prev, newMsg]);
    return { success: true };
  };

  const sendReaction = (emoji: string) => {
    const newReaction: LiveReaction = {
      id: 'react_' + Date.now() + Math.random(),
      emoji,
      xOffset: 15 + Math.random() * 70,
      timestamp: Date.now()
    };
    setReactions(prev => [...prev.slice(-15), newReaction]);
  };

  useEffect(() => {
    if (reactions.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setReactions(prev => prev.filter(r => now - r.timestamp < 3500));
    }, 1000);
    return () => clearInterval(interval);
  }, [reactions.length]);

  const triggerHostAnnouncement = (text: string) => {
    setActiveAnnouncement(text);
    sounds.playTickSound();
    setTimeout(() => setActiveAnnouncement(null), 6000);
  };

  const hostAction = (action: 'GOING_ONCE' | 'GOING_TWICE' | 'FINAL_CALL' | 'SOLD' | 'PAUSE' | 'EXTEND' | 'NEXT') => {
    switch (action) {
      case 'GOING_ONCE':
        triggerHostAnnouncement('🎙️ AUCTIONEER: Going once at ₦' + currentBid.toLocaleString() + '!');
        break;
      case 'GOING_TWICE':
        triggerHostAnnouncement('🎙️ AUCTIONEER: Going TWICE at ₦' + currentBid.toLocaleString() + '! Any higher bids?');
        break;
      case 'FINAL_CALL':
        triggerHostAnnouncement('🚨 FINAL CALL! The hammer is about to fall!');
        sounds.playOutbidSound();
        break;
      case 'SOLD':
        if (activeProduct) {
          setCategoryRooms(prevRooms => prevRooms.map(room => {
            if (room.id !== activeRoom.id) return room;
            return {
              ...room,
              slots: room.slots.map(slot => {
                if (slot.id !== activeSlot.id) return slot;
                return {
                  ...slot,
                  products: slot.products.map((p, idx) => idx === slot.activeProductIndex ? { ...p, remainingSeconds: 0 } : p)
                };
              })
            };
          }));
        }
        break;
      case 'PAUSE':
        setIsPaused(prev => !prev);
        triggerHostAnnouncement(isPaused ? '▶️ Auction has been resumed by the host.' : '⏸️ Auction has been paused by the host.');
        break;
      case 'EXTEND':
        extendAuctionTimer(30);
        triggerHostAnnouncement('⏳ Host added +30 seconds to the clock!');
        break;
      case 'NEXT':
        skipCurrentProduct();
        break;
    }
  };

  // ================= ADMIN SLOT & CATEGORY ROOM CONTROLS =================

  // 1. Update Slot Target Item Count (e.g., Slot A 200 items, Slot B 350 items)
  const updateSlotTargetCount = (roomId: string, slotId: string, newTarget: number) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== slotId) return slot;
            return {
              ...slot,
              targetItemCount: Math.max(1, newTarget)
            };
          })
        };
      });
    });
    addNotification(
      'Slot Target Updated',
      `Updated ${slotId} target item count to ${newTarget} items for today.`,
      'system'
    );
  };

  // 2. Add New Slot to a Category Live Room
  const addSlotToRoom = (roomId: string, slotData: { code: string; name: string; targetItemCount: number; scheduledStartTime: string; scheduledEndTime: string }) => {
    const slotId = 'slot_' + roomId.replace('room_', '') + '_' + Date.now().toString(36);
    const newSlot: AuctionSlot = {
      id: slotId,
      code: slotData.code,
      name: slotData.name,
      targetItemCount: slotData.targetItemCount,
      scheduledStartTime: slotData.scheduledStartTime,
      scheduledEndTime: slotData.scheduledEndTime,
      status: 'upcoming',
      activeProductIndex: 0,
      completedItemsCount: 0,
      totalSalesVolume: 0,
      totalBidsPlaced: 0,
      products: []
    };

    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: [...room.slots, newSlot]
        };
      });
    });

    addNotification(
      'New Slot Created',
      `Created ${slotData.code} (${slotData.name}) with ${slotData.targetItemCount} items target for ${roomId}.`,
      'system'
    );
  };

  // 3. Update Slot Status (active / upcoming / completed / paused)
  const updateSlotStatus = (roomId: string, slotId: string, status: SlotStatusCode) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== slotId) return slot;
            return {
              ...slot,
              status
            };
          })
        };
      });
    });
  };

  // 4. Set Room Active Broadcast Slot
  const setRoomActiveSlot = (roomId: string, slotId: string) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          activeSlotId: slotId,
          slots: room.slots.map(slot => ({
            ...slot,
            status: slot.id === slotId ? 'active' : slot.status === 'active' ? 'upcoming' : slot.status
          }))
        };
      });
    });
    if (activeRoomId === roomId) {
      setActiveSlotIdState(slotId);
    }
  };

  // 5. Update Category Live Room Status
  const updateRoomStatus = (roomId: string, status: AuctionStatus) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          status
        };
      });
    });
  };

  // 6. Add Single Product to Slot
  const addProductToSlot = (roomId: string, slotId: string, product: AuctionProduct) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== slotId) return slot;
            const isFirst = slot.products.length === 0;
            return {
              ...slot,
              products: [...slot.products, { ...product, status: isFirst ? 'active' : 'queued' }]
            };
          })
        };
      });
    });
    addNotification('Product Added to Slot', `Added ${product.title} to ${slotId}`, 'system');
  };

  // 7. Import Products to Specific Slot
  const importProductsToSlot = (roomId: string, slotId: string, items: any[], mode: 'append' | 'replace') => {
    const formatted: AuctionProduct[] = items.map((item, idx) => {
      const id = 'prod_imp_' + Date.now() + '_' + idx;
      return {
        id,
        title: item.title,
        category: item.category || 'General',
        condition: item.condition || 'Brand New',
        images: [
          'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=1000&q=80'
        ],
        startingPrice: item.startingPrice,
        currentBid: item.startingPrice,
        bidIncrement: item.bidIncrement,
        reservePrice: Math.round(item.startingPrice * 1.1),
        estimatedMarketValue: item.estimatedMarketValue,
        seller: {
          name: 'Verified Market Merchant',
          location: item.sellerLocation || 'Lagos, Nigeria',
          verified: true,
          rating: 4.8
        },
        durationSeconds: item.durationSeconds || 90,
        remainingSeconds: item.durationSeconds || 90,
        status: mode === 'replace' && idx === 0 ? 'active' : 'queued',
        bidsCount: 0,
        description: item.description,
        specs: ['100% Quality Inspected', 'Authentic Merchant Warranty', 'Escrow Protected'],
        deliveryInfo: {
          shipsFrom: item.sellerLocation || 'Lagos, Nigeria',
          dispatchTime: '24-48 Hours Nationwide',
          lagosAbujaFee: 3500,
          nationwideFee: 6500
        },
        extensionCount: 0,
        maxExtensions: 5
      };
    });

    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== slotId) return slot;
            return {
              ...slot,
              products: mode === 'replace' ? formatted : [...slot.products, ...formatted],
              activeProductIndex: mode === 'replace' ? 0 : slot.activeProductIndex
            };
          })
        };
      });
    });

    addNotification(
      'Products Imported to Slot',
      `Imported ${formatted.length} products to ${slotId} (${mode === 'replace' ? 'replaced' : 'appended'}).`,
      'system'
    );
  };

  // 8. Reorder Product In Slot
  const reorderProductInSlot = (roomId: string, slotId: string, fromIndex: number, toIndex: number) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== slotId) return slot;
            if (fromIndex === slot.activeProductIndex || toIndex === slot.activeProductIndex) return slot;
            const updated = [...slot.products];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return {
              ...slot,
              products: updated
            };
          })
        };
      });
    });
  };

  // 9. Skip Current Product In Slot
  const skipCurrentProductInSlot = (roomId: string, slotId: string) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== slotId) return slot;
            const currentIdx = slot.activeProductIndex;
            const nextIdx = currentIdx + 1;
            return {
              ...slot,
              activeProductIndex: nextIdx < slot.products.length ? nextIdx : currentIdx,
              products: slot.products.map((p, i) => {
                if (i === currentIdx) return { ...p, status: 'passed' };
                if (i === nextIdx) return { ...p, status: 'active' };
                return p;
              })
            };
          })
        };
      });
    });
  };

  // 10. Extend Timer In Slot
  const extendTimerInSlot = (roomId: string, slotId: string, seconds: number) => {
    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== slotId) return slot;
            return {
              ...slot,
              products: slot.products.map((p, i) => {
                if (i !== slot.activeProductIndex) return p;
                return { ...p, remainingSeconds: p.remainingSeconds + seconds };
              })
            };
          })
        };
      });
    });
    sounds.playExtendedSound();
  };

  // Compatibility helpers (delegate to active room & slot)
  const importProductsFromText = (items: any[], mode: 'append' | 'replace') => {
    importProductsToSlot(activeRoom.id, activeSlot.id, items, mode);
  };

  const reorderProduct = (fromIndex: number, toIndex: number) => {
    reorderProductInSlot(activeRoom.id, activeSlot.id, fromIndex, toIndex);
  };

  const skipCurrentProduct = () => {
    skipCurrentProductInSlot(activeRoom.id, activeSlot.id);
  };

  const extendAuctionTimer = (seconds: number) => {
    extendTimerInSlot(activeRoom.id, activeSlot.id, seconds);
  };

  // Fraud alerts
  const takeFraudAction = (alertId: string, action: 'restricted' | 'suspended' | 'cleared') => {
    setFraudAlerts(prev => prev.map(a => a.id === alertId ? { ...a, actionTaken: action } : a));
    addNotification('Fraud Action Applied', `Bidder action set to: ${action.toUpperCase()}`, 'system');
  };

  // Notifications
  const markNotifAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const pinChatMessage = (id: string) => {
    setChatMessages(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));
  };

  const deleteChatMessage = (id: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== id));
  };

  const closeWinnerModal = () => {
    setWinnerModalProduct(null);
  };

  // Dynamic currentEvent derived from active category room & active slot
  const currentEvent: LiveAuctionEvent = {
    id: activeRoom.id,
    title: `${activeRoom.icon} ${activeRoom.title}`,
    description: activeRoom.description,
    banner: activeRoom.banner,
    eventType: 'daily',
    startTime: activeSlot?.scheduledStartTime || '09:00 AM',
    endTime: activeSlot?.scheduledEndTime || '08:00 PM',
    status: activeRoom.status,
    hostName: activeRoom.hostName,
    hostAvatar: activeRoom.hostAvatar,
    totalProducts: activeSlot?.targetItemCount || products.length || 200,
    currentProductIndex: activeProductIndex,
    viewerCount: activeRoom.viewerCount,
    activeBiddersCount: activeRoom.activeBiddersCount,
    totalBidsPlaced: activeSlot?.totalBidsPlaced || 184,
    totalSalesVolume: activeSlot?.totalSalesVolume || 4850000,
    energyLevel: activeRoom.energyLevel,
    sponsor: activeRoom.sponsor
  };

  // Section 77 Automated Test Scenario
  const runAutomatedScenario77 = () => {
    setIsSimulationRunning(true);
    triggerHostAnnouncement('🎬 Launching Automated Scenario (Section 77 Test)...');

    const testProd: AuctionProduct = {
      id: 'prod_test_77',
      title: 'Apple iPhone 14 Pro Max (Demo Scenario 77)',
      category: 'Smartphones',
      condition: 'Brand New',
      images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80'],
      startingPrice: 100000,
      currentBid: 100000,
      bidIncrement: 5000,
      reservePrice: 100000,
      estimatedMarketValue: 650000,
      seller: {
        name: 'Computer Village Accredited',
        location: 'Ikeja, Lagos',
        verified: true,
        rating: 5.0
      },
      durationSeconds: 25,
      remainingSeconds: 25,
      status: 'active',
      bidsCount: 0,
      description: 'Scenario 77 automated test item to verify proxy bidding, outbidding, anti-sniping extension and order creation.',
      specs: ['128GB Storage', 'A16 Bionic', 'Dual SIM', 'Scenario Verified'],
      deliveryInfo: {
        shipsFrom: 'Ikeja, Lagos',
        dispatchTime: 'Immediate Dispatch',
        lagosAbujaFee: 3000,
        nationwideFee: 5000
      },
      extensionCount: 0,
      maxExtensions: 5
    };

    setCategoryRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              activeProductIndex: 0,
              products: [testProd, ...slot.products]
            };
          })
        };
      });
    });

    setBidHistory([]);

    setTimeout(() => {
      setBidHistory([
        {
          id: 'bid_test_1',
          auctionProductId: 'prod_test_77',
          bidderId: 'buyer_a',
          maskedBidder: 'Buyer_A (Pre-Bid ₦150K)',
          amount: 105000,
          timestamp: '06:00:01 PM'
        },
        {
          id: 'bid_test_2',
          auctionProductId: 'prod_test_77',
          bidderId: 'buyer_b',
          maskedBidder: 'Buyer_B (Proxy Counter ₦180K)',
          amount: 155000,
          timestamp: '06:00:03 PM'
        }
      ]);
      setCategoryRooms(prevRooms => prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              products: slot.products.map((p, i) => i === 0 ? { ...p, currentBid: 155000, bidsCount: 2 } : p)
            };
          })
        };
      }));
      sounds.playCompetitorBidSound();
      triggerHostAnnouncement('⚡ Pre-bids evaluated: Buyer_B holds highest proxy bid at ₦155,000!');
    }, 2000);

    setTimeout(() => {
      setBidHistory(prev => [
        ...prev,
        {
          id: 'bid_test_3',
          auctionProductId: 'prod_test_77',
          bidderId: 'buyer_c',
          maskedBidder: 'Buyer_C_Live',
          amount: 190000,
          timestamp: '06:00:08 PM',
          isCurrentUser: userNickname.toLowerCase().includes('buyer_c')
        }
      ]);
      setCategoryRooms(prevRooms => prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              products: slot.products.map((p, i) => i === 0 ? { ...p, currentBid: 190000, bidsCount: 3 } : p)
            };
          })
        };
      }));
      sounds.playCompetitorBidSound();
      triggerHostAnnouncement('🔥 Buyer C placed ₦190,000! Buyer B is outbid!');
    }, 5000);

    setTimeout(() => {
      setCategoryRooms(prevRooms => prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              products: slot.products.map((p, i) => i === 0 ? { ...p, remainingSeconds: 8 } : p)
            };
          })
        };
      }));
    }, 8000);

    setTimeout(() => {
      setBidHistory(prev => [
        ...prev,
        {
          id: 'bid_test_4',
          auctionProductId: 'prod_test_77',
          bidderId: 'buyer_a',
          maskedBidder: 'Buyer_A_FinalSeconds',
          amount: 195000,
          timestamp: '06:00:15 PM'
        }
      ]);
      setCategoryRooms(prevRooms => prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              products: slot.products.map((p, i) => i === 0 ? { 
                ...p, 
                currentBid: 195000, 
                bidsCount: 4, 
                remainingSeconds: 18, 
                extensionCount: 1 
              } : p)
            };
          })
        };
      }));
      setIsExtended(true);
      sounds.playExtendedSound();
      triggerHostAnnouncement('⚡ EXTENDED! Sniping detected in final seconds. +10 seconds added!');
      setTimeout(() => setIsExtended(false), 3000);
    }, 10000);

    setTimeout(() => {
      setBidHistory(prev => [
        ...prev,
        {
          id: 'bid_test_5',
          auctionProductId: 'prod_test_77',
          bidderId: 'usr_current',
          maskedBidder: userNickname,
          amount: 200000,
          timestamp: '06:00:22 PM',
          isCurrentUser: true
        }
      ]);
      setCategoryRooms(prevRooms => prevRooms.map(room => {
        if (room.id !== activeRoom.id) return room;
        return {
          ...room,
          slots: room.slots.map(slot => {
            if (slot.id !== activeSlot.id) return slot;
            return {
              ...slot,
              products: slot.products.map((p, i) => i === 0 ? { ...p, currentBid: 200000, bidsCount: 5, remainingSeconds: 4 } : p)
            };
          })
        };
      }));
      sounds.playUserBidSuccessSound();
      triggerHostAnnouncement(`👑 ${userNickname} placed winning bid of ₦200,000!`);
      setIsSimulationRunning(false);
    }, 13000);
  };

  return (
    <LiveAuctionContext.Provider value={{
      categoryRooms,
      activeRoomId,
      activeRoom,
      activeSlotId,
      activeSlot,
      setActiveRoomId,
      setActiveSlotId,
      currentEvent,
      products,
      activeProductIndex,
      activeProduct,
      nextProduct,
      timeRemaining,
      isPaused,
      isExtended,
      transitionCountdown,
      currentBid,
      bidHistory,
      isUserWinning,
      hasUserBiddedOnActive,
      userMaxBid,
      userProxyBids,
      placeBid,
      setProxyMaxBid,
      chatMessages,
      sendChatMessage,
      reactions,
      sendReaction,
      pinChatMessage,
      deleteChatMessage,
      userRole,
      setUserRole,
      userNickname,
      setUserNickname,
      soundEnabled,
      setSoundEnabled,
      triggerHostAnnouncement,
      activeAnnouncement,
      hostAction,
      updateSlotTargetCount,
      addSlotToRoom,
      updateSlotStatus,
      setRoomActiveSlot,
      updateRoomStatus,
      addProductToSlot,
      importProductsToSlot,
      reorderProductInSlot,
      skipCurrentProductInSlot,
      extendTimerInSlot,
      importProductsFromText,
      reorderProduct,
      skipCurrentProduct,
      extendAuctionTimer,
      winnerModalProduct,
      closeWinnerModal,
      watchlist,
      toggleWatchlist,
      isInWatchlist,
      watchlistItems,
      allAuctionProducts,
      notificationPermission,
      requestNotificationPermission,
      activeToastNotification,
      dismissToastNotification,
      simulateWatchlistPriceChange,
      simulateWatchlistEndingSoon,
      simulateTwoMinuteClosingAlert,
      setLotTimerForTesting,
      isNativeNotificationSupported,
      jumpToProductAuction,
      notifications,
      unreadNotifsCount,
      markNotifAsRead,
      fraudAlerts,
      takeFraudAction,
      runAutomatedScenario77,
      isSimulationRunning
    }}>
      {children}
    </LiveAuctionContext.Provider>
  );
};

export const useLiveAuction = () => {
  const context = useContext(LiveAuctionContext);
  if (!context) {
    throw new Error('useLiveAuction must be used within a LiveAuctionProvider');
  }
  return context;
};
