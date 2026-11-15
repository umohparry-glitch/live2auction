import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { apiRequest } from '../services/api';

export interface AuthUser {
  id: number;
  uid: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatarUrl: string;
  status: string;
  emailVerified: boolean;
  mustChangePassword: boolean;
  isAdmin: boolean;
  canPostProducts?: boolean;
  sellerApprovalRequested?: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface WebsiteSettingsData {
  id: number;
  siteName: string;
  logoUrl: string;
  heroBannerTitle: string;
  heroBannerSubtitle: string;
  heroBannerImage: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  socialLinks: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
  auctionRules: string;
  termsAndConditions: string;
  privacyPolicy: string;
  aboutUs: string;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
  defaultBidIncrement: number;
  antiSnipingSeconds: number;
  timeBetweenAuctionsMinutes?: number;
  defaultSlotDurationMinutes?: number;
}

export type AuthModalMode = 'gate' | 'login' | 'register' | 'forgot' | 'reset' | 'verify';

interface AuthGateState {
  isOpen: boolean;
  mode: AuthModalMode;
  pendingAction?: () => void;
  verificationTokenPreview?: string;
  resetTokenPreview?: string;
}

interface ToastBanner {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AuthContextType {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  adminInitialized: boolean;
  websiteSettings: WebsiteSettingsData | null;
  socket: Socket | null;
  authGate: AuthGateState;
  toast: ToastBanner | null;
  showToast: (type: ToastBanner['type'], title: string, message: string) => void;
  dismissToast: () => void;
  openAuthModal: (mode?: AuthModalMode, onAfterAuth?: () => void) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  requireAuthentication: (onAuthorized: () => void) => boolean;
  hasPermission: (permCode: string) => boolean;
  refreshSession: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  refreshSetupStatus: () => Promise<void>;
  login: (identifier: string, password: string, rememberMe: boolean) => Promise<void>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  register: (payload: {
    fullName: string;
    username: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    rememberMe: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInitialized, setAdminInitialized] = useState(true);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettingsData | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toast, setToast] = useState<ToastBanner | null>(null);

  const [authGate, setAuthGate] = useState<AuthGateState>({
    isOpen: false,
    mode: 'gate',
  });

  const pendingActionRef = useRef<(() => void) | undefined>(undefined);
  const userIdRef = useRef<number | null>(null);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  const showToast = useCallback(
    (type: ToastBanner['type'], title: string, message: string) => {
      const id = Date.now();
      setToast({ id, type, title, message });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 6000);
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await apiRequest<{
        authenticated: boolean;
        user: AuthUser | null;
        roles: string[];
        permissions: string[];
      }>('/api/auth/me');
      if (data.authenticated && data.user) {
        setUser(data.user);
        setRoles(data.roles || []);
        setPermissions(data.permissions || []);
      } else {
        setUser(null);
        setRoles([]);
        setPermissions([]);
      }
    } catch {
      setUser(null);
      setRoles([]);
      setPermissions([]);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await apiRequest<{ settings: WebsiteSettingsData | null }>(
        '/api/public/settings'
      );
      if (data.settings) {
        setWebsiteSettings(data.settings);
        document.title = `${data.settings.siteName} — Live Interactive Auction Marketplace`;
      }
    } catch {
      // ignore initial settings load errors
    }
  }, []);

  const refreshSetupStatus = useCallback(async () => {
    try {
      const data = await apiRequest<{ adminInitialized: boolean }>('/api/auth/setup-status');
      setAdminInitialized(data.adminInitialized);
    } catch {
      // ignore
    }
  }, []);

  // Boot: restore HTTP-only session cookie, public settings, and Socket.IO real-time listener
  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.all([refreshSession(), refreshSettings(), refreshSetupStatus()]);
      if (active) setIsLoading(false);
    })();

    const s = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    setSocket(s);

    s.on('settings:updated', (updated: WebsiteSettingsData) => {
      setWebsiteSettings(updated);
      document.title = `${updated.siteName} — Live Interactive Auction Marketplace`;
    });

    s.on(
      'notification:user',
      (payload: { userId: number; type: string; title: string; message: string }) => {
        if (userIdRef.current && payload.userId === userIdRef.current) {
          showToast(
            payload.type === 'outbid' ? 'warning' : payload.type === 'auction_won' || payload.type === 'seller_approved' ? 'success' : 'info',
            payload.title,
            payload.message
          );
          if (payload.type === 'seller_approved' || payload.type === 'seller_revoked') {
            void refreshSession();
          }
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(payload.title, {
                body: payload.message,
                tag: `naija_${payload.type}`,
              });
            } catch {
              // ignore browser notification errors
            }
          }
        }
      }
    );

    return () => {
      active = false;
      s.disconnect();
    };
  }, [refreshSession, refreshSettings, refreshSetupStatus, showToast]);

  const openAuthModal = useCallback(
    (mode: AuthModalMode = 'login', onAfterAuth?: () => void) => {
      pendingActionRef.current = onAfterAuth;
      setAuthGate({ isOpen: true, mode });
    },
    []
  );

  const closeAuthModal = useCallback(() => {
    pendingActionRef.current = undefined;
    setAuthGate({ isOpen: false, mode: 'gate' });
  }, []);

  const setAuthModalMode = useCallback((mode: AuthModalMode) => {
    setAuthGate((prev) => ({ ...prev, mode }));
  }, []);

  const requireAuthentication = useCallback(
    (onAuthorized: () => void) => {
      if (user) {
        onAuthorized();
        return true;
      }
      pendingActionRef.current = onAuthorized;
      setAuthGate({ isOpen: true, mode: 'gate' });
      return false;
    },
    [user]
  );

  const completeAuthRedirect = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = undefined;
    setAuthGate({ isOpen: false, mode: 'gate' });
    if (action) {
      setTimeout(() => action(), 50);
    }
  }, []);

  const login = useCallback(
    async (identifier: string, password: string, rememberMe: boolean) => {
      const data = await apiRequest<{
        user: AuthUser;
        roles: string[];
        permissions: string[];
        message: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, rememberMe }),
      });
      setUser(data.user);
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      showToast('success', 'Signed In', data.message);
      completeAuthRedirect();
    },
    [completeAuthRedirect, showToast]
  );

  const loginWithGoogle = useCallback(
    async (rememberMe = true) => {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const data = await apiRequest<{
        user: AuthUser;
        roles: string[];
        permissions: string[];
        message: string;
      }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken, rememberMe }),
      });
      setUser(data.user);
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      showToast('success', 'Google Sign-In', data.message);
      completeAuthRedirect();
    },
    [completeAuthRedirect, showToast]
  );

  const register = useCallback(
    async (payload: {
      fullName: string;
      username: string;
      email: string;
      phone: string;
      password: string;
      confirmPassword: string;
      rememberMe: boolean;
    }) => {
      const data = await apiRequest<{
        user: AuthUser;
        roles: string[];
        permissions: string[];
        verificationTokenPreview?: string;
        message: string;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setUser(data.user);
      setRoles(data.roles || []);
      setPermissions(data.permissions || []);
      showToast('success', 'Account Created', data.message);
      if (data.verificationTokenPreview && !pendingActionRef.current) {
        setAuthGate({
          isOpen: true,
          mode: 'verify',
          verificationTokenPreview: data.verificationTokenPreview,
        });
      } else {
        completeAuthRedirect();
      }
    },
    [completeAuthRedirect, showToast]
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setRoles([]);
      setPermissions([]);
      showToast('info', 'Logged Out', 'Your session has been securely ended.');
    }
  }, [showToast]);

  const logoutAllDevices = useCallback(async () => {
    await apiRequest('/api/auth/logout-all', { method: 'POST' });
    setUser(null);
    setRoles([]);
    setPermissions([]);
    showToast(
      'info',
      'All Devices Logged Out',
      'Every active session across all devices has been invalidated.'
    );
  }, [showToast]);

  const isAdmin = Boolean(
    user?.isAdmin &&
      roles.some((r) => ['super_admin', 'auction_manager', 'user_manager'].includes(r))
  );

  const hasPermission = useCallback(
    (permCode: string) => {
      if (!isAdmin) return false;
      if (roles.includes('super_admin')) return true;
      return permissions.includes(permCode);
    },
    [isAdmin, permissions, roles]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        isAuthenticated: Boolean(user),
        isAdmin,
        isLoading,
        adminInitialized,
        websiteSettings,
        socket,
        authGate,
        toast,
        showToast,
        dismissToast,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        requireAuthentication,
        hasPermission,
        refreshSession,
        refreshSettings,
        refreshSetupStatus,
        login,
        loginWithGoogle,
        register,
        logout,
        logoutAllDevices,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
