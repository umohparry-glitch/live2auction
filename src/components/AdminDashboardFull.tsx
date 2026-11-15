import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  BarChart3,
  Bell,
  CheckCircle2,
  Edit3,
  Gavel,
  History,
  KeyRound,
  Lock,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Trophy,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth, WebsiteSettingsData } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { readAndCompressImageFiles } from '../utils/imageUpload';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';

type AdminTab =
  | 'overview'
  | 'users'
  | 'admins'
  | 'auctions'
  | 'winners'
  | 'alerts'
  | 'categories'
  | 'logs'
  | 'settings';

const STUDIO_IMAGE_PRESETS = [
  { label: 'Flagship Phone', url: '/src/assets/images/auction_iphone_pro_1794582939193.jpg' },
  { label: 'Pro Laptop', url: '/src/assets/images/auction_macbook_pro_1794582937883.jpg' },
  { label: 'Swiss Watch', url: '/src/assets/images/auction_luxury_watch_1794582939778.jpg' },
  { label: 'Solar Station', url: '/src/assets/images/auction_solar_station_1794582938882.jpg' },
  { label: 'Hero Showcase', url: '/src/assets/images/hero_auction_showcase_1794582937386.jpg' },
];

export const AdminDashboardFull: React.FC = () => {
  const {
    user,
    roles,
    isAuthenticated,
    isAdmin,
    adminInitialized,
    hasPermission,
    login,
    refreshSetupStatus,
    refreshSettings,
    showToast,
    socket,
  } = useAuth();

  // Setup / Login gate state when unauthenticated
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupEmail, setSetupEmail] = useState('damwad@naijaauction.ng');
  const [adminLoginId, setAdminLoginId] = useState('damwad');
  const [adminLoginPwd, setAdminLoginPwd] = useState('');
  const [gateBusy, setGateBusy] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);

  // Active tab
  const [tab, setTab] = useState<AdminTab>('overview');

  // Overview state
  const [overview, setOverview] = useState<any>(null);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'buyer',
  });
  const [editUserTarget, setEditUserTarget] = useState<any | null>(null);
  const [resetPwdTarget, setResetPwdTarget] = useState<any | null>(null);
  const [resetPwdInput, setResetPwdInput] = useState('');
  const [historyTarget, setHistoryTarget] = useState<{ user: any; history: any[] } | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<any | null>(null);

  // Admins state
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [availablePerms, setAvailablePerms] = useState<{ code: string; description: string }[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    roleName: 'auction_manager',
    permissions: [] as string[],
  });
  const [editAdminTarget, setEditAdminTarget] = useState<any | null>(null);
  const [logsList, setLogsList] = useState<any[]>([]);

  // Auctions, Approvals, Queue Ordering & Categories state
  const [auctionsList, setAuctionsList] = useState<any[]>([]);
  const [auctionFilter, setAuctionFilter] = useState<'all' | 'pending' | 'live' | 'scheduled' | 'ended'>('all');
  const [reorderingSaving, setReorderingSaving] = useState(false);
  const [rejectProductTarget, setRejectProductTarget] = useState<any | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [editingAuctionId, setEditingAuctionId] = useState<number | null>(null);
  const [auctionForm, setAuctionForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    categoryName: 'Phones',
    condition: 'Brand New',
    brand: '',
    location: 'Ikeja, Lagos',
    sellerName: 'NaijaAuction Verified',
    startingPrice: '500000',
    bidIncrement: '10000',
    reservePrice: '',
    estimatedMarketValue: '750000',
    status: 'live',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
    isFeatured: true,
    putFirst: false,
    queueOrder: '10',
    images: [STUDIO_IMAGE_PRESETS[0].url],
    newImageUrl: '',
    specsText: '',
  });
  const [inspectBidsAuction, setInspectBidsAuction] = useState<{ auction: any; bids: any[] } | null>(
    null
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Winners & Admin Notifications state
  const [winnersList, setWinnersList] = useState<any[]>([]);
  const [adminAlerts, setAdminAlerts] = useState<any[]>([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  // Website Settings state
  const [settingsForm, setSettingsForm] = useState<WebsiteSettingsData | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Admin Self Change Password Modal state
  const [showChangeMyPwdModal, setShowChangeMyPwdModal] = useState(false);
  const [myPwdForm, setMyPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingMyPwd, setSavingMyPwd] = useState(false);

  const loadAdminAlerts = async () => {
    try {
      const res = await apiRequest<{ notifications: any[]; unreadCount: number }>(
        '/api/admin/notifications'
      );
      setAdminAlerts(res.notifications || []);
      setUnreadAlertsCount(res.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  const loadTabData = async (currentTab: AdminTab) => {
    try {
      if (currentTab === 'overview') {
        const res = await apiRequest('/api/admin/overview');
        setOverview(res);
      } else if (currentTab === 'users' && hasPermission('manage_users')) {
        const res = await apiRequest<{ users: any[] }>(
          `/api/admin/users?q=${encodeURIComponent(userSearch)}`
        );
        setUsersList(res.users);
      } else if (currentTab === 'admins' && hasPermission('manage_admins')) {
        const res = await apiRequest<{ admins: any[]; availablePermissions: any[] }>(
          '/api/admin/admins'
        );
        setAdminsList(res.admins);
        setAvailablePerms(res.availablePermissions);
      } else if (currentTab === 'auctions' && hasPermission('manage_auctions')) {
        const [aucs, cats] = await Promise.all([
          apiRequest<{ auctions: any[] }>('/api/admin/auctions'),
          apiRequest<{ categories: any[] }>('/api/public/categories'),
        ]);
        setAuctionsList(aucs.auctions);
        setCategoriesList(cats.categories);
      } else if (currentTab === 'winners' && hasPermission('manage_bids')) {
        const res = await apiRequest<{ winners: any[] }>('/api/admin/winners');
        setWinnersList(res.winners || []);
      } else if (currentTab === 'alerts') {
        await loadAdminAlerts();
      } else if (currentTab === 'categories' && hasPermission('manage_categories')) {
        const cats = await apiRequest<{ categories: any[] }>('/api/admin/categories');
        setCategoriesList(cats.categories);
      } else if (currentTab === 'logs' && hasPermission('view_logs')) {
        const res = await apiRequest<{ logs: any[] }>('/api/admin/logs');
        setLogsList(res.logs);
      } else if (currentTab === 'settings' && hasPermission('manage_settings')) {
        const res = await apiRequest<{ settings: WebsiteSettingsData }>('/api/admin/settings');
        setSettingsForm(res.settings);
      }
    } catch (err: any) {
      if (err?.code !== 'MUST_CHANGE_PASSWORD') {
        showToast('error', 'Admin Error', err?.message || 'Failed to load data.');
      }
    }
  };

  useEffect(() => {
    if (isAdmin && !user?.mustChangePassword) {
      loadTabData(tab);
      loadAdminAlerts();
    }
  }, [tab, isAdmin, user?.mustChangePassword]);

  useEffect(() => {
    if (!socket || !isAdmin) return;
    const onAdminEvent = () => {
      void loadAdminAlerts();
      if (tab === 'overview' || tab === 'winners' || tab === 'auctions' || tab === 'users') {
        void loadTabData(tab);
      }
    };
    const onOverviewActivity = () => {
      if (tab === 'overview') {
        void loadTabData('overview');
      }
    };
    socket.on('notification:admin', onAdminEvent);
    socket.on('auction:closed', onAdminEvent);
    socket.on('slots:updated', onAdminEvent);
    socket.on('auction:bid_placed', onOverviewActivity);
    socket.on('auction:discussion', onOverviewActivity);
    return () => {
      socket.off('notification:admin', onAdminEvent);
      socket.off('auction:closed', onAdminEvent);
      socket.off('slots:updated', onAdminEvent);
      socket.off('auction:bid_placed', onOverviewActivity);
      socket.off('auction:discussion', onOverviewActivity);
    };
  }, [socket, isAdmin, tab]);

  // Initial Setup submit for 'damwad' when INITIAL_ADMIN_PASSWORD wasn't provided in env
  const handleOneTimeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setGateBusy(true);
    try {
      await apiRequest('/api/auth/setup-admin', {
        method: 'POST',
        body: JSON.stringify({
          email: setupEmail,
          password: setupPassword,
          confirmPassword: setupConfirmPassword,
        }),
      });
      await refreshSetupStatus();
      showToast('success', 'Super Admin Initialized', 'Now sign in with username damwad.');
      setAdminLoginId('damwad');
      setAdminLoginPwd(setupPassword);
    } catch (err: any) {
      setGateError(err?.message || 'Setup failed.');
    } finally {
      setGateBusy(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError(null);
    setGateBusy(true);
    try {
      await login(adminLoginId, adminLoginPwd, false);
    } catch (err: any) {
      setGateError(err?.message || 'Sign in failed.');
    } finally {
      setGateBusy(false);
    }
  };

  // ================= GATE SCREENS =================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                {adminInitialized ? 'Administrator Portal' : 'One-Time Super Admin Setup'}
              </h1>
              <p className="text-xs text-slate-500">
                {adminInitialized
                  ? 'Sign in with an authorized administrator account.'
                  : 'Initialize the default Super Admin account (damwad).'}
              </p>
            </div>
          </div>

          {gateError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {gateError}
            </div>
          )}

          {!adminInitialized ? (
            <form onSubmit={handleOneTimeSetup} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Super Admin Username
                </label>
                <input
                  type="text"
                  disabled
                  value="damwad"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Initial Password
                </label>
                <input
                  type="password"
                  required
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="Confirm initial password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={gateBusy}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
              >
                {gateBusy ? 'Provisioning...' : 'Provision Super Admin (damwad)'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSignIn} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={adminLoginId}
                  onChange={(e) => setAdminLoginId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminLoginPwd}
                  onChange={(e) => setAdminLoginPwd(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={gateBusy}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
              >
                {gateBusy ? 'Authenticating...' : 'Sign In to Admin Panel'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <h1 className="text-2xl font-bold text-slate-900">Administrator Access Denied</h1>
        <p className="text-sm text-slate-600">
          Your account (@{user?.username}) does not hold administrator privileges.
        </p>
      </div>
    );
  }

  // ================= ADMIN HANDLERS =================

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUserForm),
      });
      showToast('success', 'User Created', `Registered @${newUserForm.username}`);
      setShowAddUserModal(false);
      setNewUserForm({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        roleName: 'buyer',
      });
      loadTabData('users');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to create user.');
    }
  };

  const handleUpdateUserStatus = async (userId: number, status: string) => {
    try {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast('success', 'User Updated', `Account status set to ${status}.`);
      loadTabData('users');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Update failed.');
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserTarget) return;
    try {
      await apiRequest(`/api/admin/users/${editUserTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editUserTarget.fullName,
          email: editUserTarget.email,
          phone: editUserTarget.phone,
          status: editUserTarget.status,
          emailVerified: editUserTarget.emailVerified,
          canPostProducts: Boolean(editUserTarget.canPostProducts),
        }),
      });
      showToast('success', 'User Updated', `Saved changes for @${editUserTarget.username}`);
      setEditUserTarget(null);
      loadTabData('users');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to save user.');
    }
  };

  const handleToggleUserPostingPermission = async (u: any) => {
    const nextVal = !Boolean(u.canPostProducts);
    try {
      await apiRequest(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ canPostProducts: nextVal }),
      });
      showToast(
        'success',
        nextVal ? 'User Approved to Post' : 'Posting Permission Revoked',
        nextVal
          ? `@${u.username} can now post products for bidding.`
          : `Revoked product posting permission for @${u.username}.`
      );
      loadTabData('users');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Unable to update posting permission.');
    }
  };

  const handleResetUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdTarget) return;
    try {
      await apiRequest(`/api/admin/users/${resetPwdTarget.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword: resetPwdInput }),
      });
      showToast('success', 'Password Reset', `Password updated for @${resetPwdTarget.username}`);
      setResetPwdTarget(null);
      setResetPwdInput('');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Password reset failed.');
    }
  };

  const handleViewUserHistory = async (u: any) => {
    try {
      const res = await apiRequest<{ history: any[] }>(`/api/admin/users/${u.id}/history`);
      setHistoryTarget({ user: u, history: res.history });
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to load history.');
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      await apiRequest(`/api/admin/users/${deleteUserTarget.id}`, { method: 'DELETE' });
      showToast('success', 'User Deleted', `Removed @${deleteUserTarget.username}`);
      setDeleteUserTarget(null);
      loadTabData('users');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Delete failed.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/admins', {
        method: 'POST',
        body: JSON.stringify(newAdminForm),
      });
      showToast('success', 'Administrator Added', `Created @${newAdminForm.username}`);
      setShowAddAdminModal(false);
      setNewAdminForm({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        roleName: 'auction_manager',
        permissions: [],
      });
      loadTabData('admins');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to create administrator.');
    }
  };

  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdminTarget) return;
    try {
      await apiRequest(`/api/admin/admins/${editAdminTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editAdminTarget.fullName,
          email: editAdminTarget.email,
          phone: editAdminTarget.phone,
          status: editAdminTarget.status,
          roleName: editAdminTarget.roleName,
          permissions: editAdminTarget.permissions,
        }),
      });
      showToast('success', 'Admin Updated', `Saved changes for @${editAdminTarget.username}`);
      setEditAdminTarget(null);
      loadTabData('admins');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to update administrator.');
    }
  };

  const handleAdminUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const uploaded = await readAndCompressImageFiles(e.target.files);
      if (uploaded.length > 0) {
        setAuctionForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uploaded].slice(0, 8),
        }));
        showToast('success', 'Images Added', `Uploaded ${uploaded.length} product photo(s).`);
      }
    } catch (err: any) {
      showToast('error', 'Upload Failed', err?.message || 'Unable to read image files.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: auctionForm.title,
      description: auctionForm.description,
      categoryId: auctionForm.categoryId ? Number(auctionForm.categoryId) : null,
      categoryName: auctionForm.categoryName,
      condition: auctionForm.condition,
      brand: auctionForm.brand,
      location: auctionForm.location,
      sellerName: auctionForm.sellerName,
      startingPrice: Number(auctionForm.startingPrice),
      bidIncrement: Number(auctionForm.bidIncrement),
      reservePrice: auctionForm.reservePrice ? Number(auctionForm.reservePrice) : null,
      estimatedMarketValue: Number(auctionForm.estimatedMarketValue),
      status: auctionForm.status,
      startTime: new Date(auctionForm.startTime).toISOString(),
      endTime: new Date(auctionForm.endTime).toISOString(),
      isFeatured: auctionForm.isFeatured,
      putFirst: auctionForm.putFirst,
      queueOrder: Number(auctionForm.queueOrder) || 100,
      images: auctionForm.images,
      specs: auctionForm.specsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editingAuctionId) {
        await apiRequest(`/api/admin/auctions/${editingAuctionId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Auction Updated', 'Listing changes saved.');
      } else {
        await apiRequest('/api/admin/auctions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('success', 'Auction Created', 'New auction listing published.');
      }
      setShowAuctionModal(false);
      setEditingAuctionId(null);
      loadTabData('auctions');
    } catch (err: any) {
      showToast('error', 'Save Failed', err?.message || 'Could not save auction.');
    }
  };

  const handleReorderAuction = async (auctionId: number, direction: 'first' | 'up' | 'down') => {
    const idx = auctionsList.findIndex((a) => a.id === auctionId);
    if (idx === -1) return;
    const copy = [...auctionsList];
    const [item] = copy.splice(idx, 1);

    if (direction === 'first') {
      copy.unshift(item);
    } else if (direction === 'up' && idx > 0) {
      copy.splice(idx - 1, 0, item);
    } else if (direction === 'down' && idx < auctionsList.length - 1) {
      copy.splice(idx + 1, 0, item);
    } else {
      return;
    }

    setAuctionsList(copy.map((a, i) => ({ ...a, queueOrder: i + 1 })));
    setReorderingSaving(true);
    try {
      await apiRequest('/api/admin/auctions/reorder', {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: copy.map((a) => a.id) }),
      });
      showToast('success', 'Display Order Saved', 'Product order updated for homepage & catalog.');
    } catch (err: any) {
      showToast('error', 'Reorder Failed', err?.message || 'Could not save order.');
      loadTabData('auctions');
    } finally {
      setReorderingSaving(false);
    }
  };

  const handleApproveProduct = async (auctionId: number, targetStatus: 'live' | 'scheduled') => {
    try {
      await apiRequest(`/api/admin/auctions/${auctionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ approvalStatus: 'approved', status: targetStatus }),
      });
      showToast(
        'success',
        'Product Approved',
        `Product approved and set to ${targetStatus}. Seller notified.`
      );
      loadTabData('auctions');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to approve product.');
    }
  };

  const handleConfirmRejectProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectProductTarget) return;
    try {
      await apiRequest(`/api/admin/auctions/${rejectProductTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          approvalStatus: 'rejected',
          rejectionReason: rejectReasonInput.trim() || 'Does not meet listing guidelines.',
          status: 'draft',
        }),
      });
      showToast('info', 'Product Rejected', 'Seller has been notified.');
      setRejectProductTarget(null);
      setRejectReasonInput('');
      loadTabData('auctions');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to reject product.');
    }
  };

  const handleUpdateWinnerStatus = async (auctionId: number, winnerStatus: string) => {
    try {
      await apiRequest(`/api/admin/winners/${auctionId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ winnerStatus }),
      });
      showToast('success', 'Winner Status Updated', `Marked settlement as ${winnerStatus}.`);
      loadTabData('winners');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to update status.');
    }
  };

  const handleNotifyWinnerAndAdmins = async (auctionId: number) => {
    try {
      const res = await apiRequest<{ message: string }>(`/api/admin/winners/${auctionId}/notify`, {
        method: 'POST',
      });
      showToast('success', 'Notifications Dispatched', res.message);
      loadTabData('winners');
      void loadAdminAlerts();
    } catch (err: any) {
      showToast('error', 'Notification Failed', err?.message || 'Unable to notify winner.');
    }
  };

  const handleAuctionAction = async (auctionId: number, status: string) => {
    try {
      await apiRequest(`/api/admin/auctions/${auctionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast('success', 'Auction Status Updated', `Auction marked as ${status}.`);
      loadTabData('auctions');
      void loadAdminAlerts();
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Action failed.');
    }
  };

  const handleInspectBids = async (auction: any) => {
    try {
      const res = await apiRequest<{ bids: any[] }>(`/api/admin/auctions/${auction.id}/bids`);
      setInspectBidsAuction({ auction, bids: res.bids });
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Unable to fetch bids.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
      });
      setNewCategoryName('');
      setNewCategoryDesc('');
      showToast('success', 'Category Created', 'New auction category added.');
      loadTabData('categories');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Could not create category.');
    }
  };

  const handleSaveWebsiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      const res = await apiRequest<{ settings: WebsiteSettingsData }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsForm),
      });
      setSettingsForm(res.settings);
      await refreshSettings();
      showToast('success', 'Settings Saved', 'Website settings updated across the platform.');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangeMyAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myPwdForm.newPassword !== myPwdForm.confirmPassword) {
      showToast('error', 'Mismatch', 'New passwords do not match.');
      return;
    }
    setSavingMyPwd(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: user?.username,
          currentPassword: myPwdForm.currentPassword,
          newPassword: myPwdForm.newPassword,
          confirmPassword: myPwdForm.confirmPassword,
        }),
      });
      setShowChangeMyPwdModal(false);
      setMyPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('success', 'Password Updated', res.message || 'Administrator password updated.');
    } catch (err: any) {
      showToast('error', 'Password Update Failed', err?.message || 'Unable to change password.');
    } finally {
      setSavingMyPwd(false);
    }
  };

  const openEditAuctionModal = (a: any) => {
    setEditingAuctionId(a.id);
    setAuctionForm({
      title: a.title,
      description: a.description,
      categoryId: a.categoryId ? String(a.categoryId) : '',
      categoryName: a.categoryName,
      condition: a.condition,
      brand: a.brand,
      location: a.location,
      sellerName: a.sellerName,
      startingPrice: String(a.startingPrice),
      bidIncrement: String(a.bidIncrement),
      reservePrice: a.reservePrice ? String(a.reservePrice) : '',
      estimatedMarketValue: String(a.estimatedMarketValue),
      status: a.status,
      startTime: new Date(a.startTime).toISOString().slice(0, 16),
      endTime: new Date(a.endTime).toISOString().slice(0, 16),
      isFeatured: a.isFeatured,
      putFirst: false,
      queueOrder: String(a.queueOrder ?? 100),
      images: a.images && a.images.length > 0 ? a.images : [STUDIO_IMAGE_PRESETS[0].url],
      newImageUrl: '',
      specsText: Array.isArray(a.specs) ? a.specs.join('\n') : '',
    });
    setShowAuctionModal(true);
  };

  const sidebarTabs: {
    key: AdminTab;
    label: string;
    icon: React.ReactNode;
    allowed: boolean;
    badge?: number;
  }[] = [
    { key: 'overview', label: 'Overview & Analytics', icon: <BarChart3 className="w-4 h-4" />, allowed: true },
    {
      key: 'alerts',
      label: 'Admin Notifications',
      icon: <Bell className="w-4 h-4" />,
      allowed: true,
      badge: unreadAlertsCount,
    },
    {
      key: 'auctions',
      label: 'Products & Queue Order',
      icon: <Gavel className="w-4 h-4" />,
      allowed: hasPermission('manage_auctions'),
      badge: overview?.kpis?.pendingProducts || 0,
    },
    {
      key: 'winners',
      label: 'Winners & Tracking',
      icon: <Trophy className="w-4 h-4" />,
      allowed: hasPermission('manage_bids'),
    },
    {
      key: 'users',
      label: 'Users & Seller Approval',
      icon: <Users className="w-4 h-4" />,
      allowed: hasPermission('manage_users'),
      badge: overview?.kpis?.pendingSellerRequests || 0,
    },
    {
      key: 'admins',
      label: 'Admin Accounts (RBAC)',
      icon: <ShieldCheck className="w-4 h-4" />,
      allowed: hasPermission('manage_admins'),
    },
    {
      key: 'categories',
      label: 'Auction Categories',
      icon: <Activity className="w-4 h-4" />,
      allowed: hasPermission('manage_categories'),
    },
    {
      key: 'logs',
      label: 'Admin Activity Logs',
      icon: <History className="w-4 h-4" />,
      allowed: hasPermission('view_logs'),
    },
    {
      key: 'settings',
      label: 'Website Settings',
      icon: <Settings className="w-4 h-4" />,
      allowed: hasPermission('manage_settings'),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header Bar */}
      <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-emerald-400 font-semibold">
            Protected Admin Console · Role: {roles.join(', ')}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display mt-0.5">
            Platform Administration (@{user?.username})
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowChangeMyPwdModal(true)}
            className="px-3 py-2 min-h-[40px] rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Change My Password</span>
          </button>
          <div className="text-xs text-slate-300">
            Server-Side RBAC Enforced
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Mobile Horizontal Tabs + Desktop Sidebar */}
        <aside className="lg:col-span-3">
          <div className="border border-slate-200 rounded-2xl p-2 bg-white flex lg:flex-col gap-1.5 lg:gap-1 overflow-x-auto no-scrollbar">
            {sidebarTabs
              .filter((t) => t.allowed)
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-auto lg:w-full px-3 py-2.5 min-h-[40px] rounded-xl text-xs font-semibold flex items-center justify-between gap-2 whitespace-nowrap shrink-0 transition cursor-pointer ${
                    tab === t.key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {t.icon}
                    <span>{t.label}</span>
                  </span>
                  {t.badge !== undefined && t.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        tab === t.key
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
          </div>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-9 border border-slate-200 rounded-2xl p-4 sm:p-6 bg-white min-h-[540px] min-w-0">
          {/* ================= OVERVIEW ================= */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold text-slate-900">Dashboard Overview</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Total Users', value: overview?.kpis?.totalUsers ?? 0 },
                  { label: 'Total Admins', value: overview?.kpis?.totalAdmins ?? 0 },
                  { label: 'Active Auctions', value: overview?.kpis?.activeAuctions ?? 0 },
                  { label: 'Upcoming Lots', value: overview?.kpis?.upcomingAuctions ?? 0 },
                  { label: 'Completed Lots', value: overview?.kpis?.completedAuctions ?? 0 },
                  { label: 'Total Bids', value: overview?.kpis?.totalBids ?? 0 },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div className="text-[11px] text-slate-500">{k.label}</div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                      {k.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recharts Marketplace Data Visualizations: Bidding Velocity, Volume & Daily Participation */}
              <AdminAnalyticsCharts
                analytics={overview?.analytics}
                categoryStats={overview?.categoryStats || []}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Registrations */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Recent Registrations</h3>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-4">
                    {(overview?.recentRegistrations || []).map((u: any) => (
                      <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">
                            @{u.username} · {u.fullName}
                          </div>
                          <div className="text-slate-500">{u.email}</div>
                        </div>
                        <span className="text-slate-500 tabular-nums">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Auction Activities */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Recent Auction Bids</h3>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-4">
                    {(overview?.recentBids || []).length === 0 ? (
                      <p className="py-6 text-xs text-slate-400 text-center">No bids yet.</p>
                    ) : (
                      overview.recentBids.map((b: any) => (
                        <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-900">
                              @{b.username} on {b.auctionCode}
                            </div>
                            <div className="text-slate-500 truncate max-w-[200px]">
                              {b.auctionTitle}
                            </div>
                          </div>
                          <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                            ₦{Number(b.amount).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Queues & Recent Confirmed Winners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/50 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Pending Admin Approvals</h3>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">Users requesting product posting access</span>
                    <button
                      onClick={() => setTab('users')}
                      className="font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      {overview?.kpis?.pendingSellerRequests ?? 0} pending →
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">User-submitted products awaiting review</span>
                    <button
                      onClick={() => {
                        setAuctionFilter('pending');
                        setTab('auctions');
                      }}
                      className="font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      {overview?.kpis?.pendingProducts ?? 0} pending →
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Recent Auction Winners</h3>
                    {hasPermission('manage_bids') && (
                      <button
                        onClick={() => setTab('winners')}
                        className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                      >
                        Track All →
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-4">
                    {(overview?.recentWinners || []).length === 0 ? (
                      <p className="py-5 text-xs text-slate-400 text-center">
                        No completed winning bids yet.
                      </p>
                    ) : (
                      overview.recentWinners.map((w: any) => (
                        <div
                          key={w.auctionId}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              @{w.winnerUsername} won {w.code}
                            </div>
                            <div className="text-slate-500 truncate max-w-[200px]">{w.title}</div>
                          </div>
                          <span className="font-mono font-bold text-emerald-700 tabular-nums">
                            ₦{Number(w.winningBidAmount).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= ADMIN NOTIFICATIONS INBOX ================= */}
          {tab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Administrator Alerts & Winner Notifications
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time alerts when auctions close with winners, users request seller access, or new products need approval.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await apiRequest('/api/admin/notifications/read', {
                      method: 'PATCH',
                      body: JSON.stringify({}),
                    });
                    await loadAdminAlerts();
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>

              {adminAlerts.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500 border border-slate-200 rounded-xl">
                  No administrator alerts yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {adminAlerts.map((n) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        if (!n.isRead) {
                          await apiRequest('/api/admin/notifications/read', {
                            method: 'PATCH',
                            body: JSON.stringify({ id: n.id }),
                          });
                          await loadAdminAlerts();
                        }
                      }}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                        n.isRead
                          ? 'border-slate-200 bg-white text-slate-600'
                          : 'border-emerald-300 bg-emerald-50/60 text-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{n.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= WINNER TRACKING & SETTLEMENTS ================= */}
          {tab === 'winners' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Bid Winner Tracking & Notifications
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track highest bidders on live lots and confirmed winners on closed auctions, send winner & admin notifications, and update escrow/delivery status.
                </p>
              </div>

              {winnersList.length === 0 ? (
                <p className="py-12 text-center text-xs text-slate-500 border border-slate-200 rounded-xl">
                  No bids or completed auction winners recorded yet.
                </p>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Product Lot</th>
                        <th className="py-2.5 px-3 font-semibold">Leading / Winning Bidder</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Winning Bid</th>
                        <th className="py-2.5 px-3 font-semibold">Settlement Tracking</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Notify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {winnersList.map((w) => (
                        <tr key={w.auctionId} className="hover:bg-slate-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {w.imageUrl && (
                                <img
                                  src={w.imageUrl}
                                  alt={w.title}
                                  className="w-11 h-9 rounded object-cover border border-slate-200 shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{w.title}</div>
                                <div className="text-slate-500">
                                  {w.code} ·{' '}
                                  <span
                                    className={
                                      w.status === 'ended'
                                        ? 'text-emerald-700 font-semibold'
                                        : 'text-amber-700 font-semibold'
                                    }
                                  >
                                    {w.status === 'ended' ? 'Final Winner' : `Currently Leading (${w.status})`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {w.winnerUsername ? (
                              <div>
                                <div className="font-semibold text-slate-900">
                                  @{w.winnerUsername}
                                  {w.winnerDetails?.fullName ? ` · ${w.winnerDetails.fullName}` : ''}
                                </div>
                                <div className="text-slate-500">
                                  {w.winnerDetails?.email || ''}
                                  {w.winnerDetails?.phone ? ` · ${w.winnerDetails.phone}` : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">Closed with 0 bids</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                            ₦{Number(w.winningBidAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            {w.winnerId ? (
                              <select
                                value={w.winnerStatus}
                                onChange={(e) =>
                                  handleUpdateWinnerStatus(w.auctionId, e.target.value)
                                }
                                className="px-2 py-1 border border-slate-300 rounded-lg bg-white font-semibold"
                              >
                                <option value="pending">Pending Contact</option>
                                <option value="notified">Winner Notified</option>
                                <option value="escrow_paid">Escrow Paid</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="settled">Completed & Settled</option>
                              </select>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            {w.winnerId && (
                              <button
                                onClick={() => handleNotifyWinnerAndAdmins(w.auctionId)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer"
                              >
                                Notify Winner & Admin
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= USER MANAGEMENT ================= */}
          {tab === 'users' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadTabData('users')}
                      placeholder="Search username, email, phone..."
                      className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs w-56"
                    />
                  </div>
                  <button
                    onClick={() => loadTabData('users')}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Search
                  </button>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register User</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">User</th>
                      <th className="py-2.5 px-3 font-semibold">Contact</th>
                      <th className="py-2.5 px-3 font-semibold">Role & Status</th>
                      <th className="py-2.5 px-3 font-semibold">Product Posting</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">@{u.username}</div>
                          <div className="text-slate-500">{u.fullName}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div>{u.email}</div>
                          <div className="text-slate-500">{u.phone || 'No phone'}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{u.roles.join(', ')}</div>
                          <div
                            className={`font-semibold ${
                              u.status === 'active'
                                ? 'text-emerald-700'
                                : u.status === 'suspended'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {u.status}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {u.canPostProducts ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                              Approved Seller
                            </span>
                          ) : u.sellerApprovalRequested ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                              Requested Approval
                            </span>
                          ) : (
                            <span className="text-slate-400">Bidder Only</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                          {!u.isAdmin && (
                            <button
                              onClick={() => handleToggleUserPostingPermission(u)}
                              className={`px-2 py-1 rounded font-semibold cursor-pointer border ${
                                u.canPostProducts
                                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                  : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {u.canPostProducts ? 'Revoke Posting' : 'Approve to Post'}
                            </button>
                          )}
                          <button
                            onClick={() => handleViewUserHistory(u)}
                            title="View Auction History"
                            className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5 text-slate-700" />
                          </button>
                          <button
                            onClick={() => setEditUserTarget({ ...u })}
                            title="Edit User"
                            className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                          </button>
                          <button
                            onClick={() => setResetPwdTarget(u)}
                            title="Reset Password"
                            className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                          </button>
                          {u.status === 'active' ? (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                              className="px-2 py-1 border border-amber-300 text-amber-800 rounded hover:bg-amber-50 font-semibold cursor-pointer"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserStatus(u.id, 'active')}
                              className="px-2 py-1 border border-emerald-300 text-emerald-800 rounded hover:bg-emerald-50 font-semibold cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                          {u.username !== 'damwad' && (
                            <button
                              onClick={() => setDeleteUserTarget(u)}
                              title="Delete User"
                              className="p-1.5 border border-rose-200 text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= ADMIN ACCOUNT MANAGEMENT ================= */}
          {tab === 'admins' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Administrator Account Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Register administrators and assign role-based permissions.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Administrator</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Admin</th>
                      <th className="py-2.5 px-3 font-semibold">Role</th>
                      <th className="py-2.5 px-3 font-semibold">Permissions</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminsList.map((adm) => (
                      <tr key={adm.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">@{adm.username}</div>
                          <div className="text-slate-500">
                            {adm.fullName} · {adm.email}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {adm.roles.join(', ')}
                        </td>
                        <td className="py-3 px-3 text-slate-600 max-w-xs">
                          {adm.permissions.join(', ')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`font-semibold ${
                              adm.status === 'active' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setEditAdminTarget({
                                ...adm,
                                roleName: adm.roles[0] || 'auction_manager',
                              })
                            }
                            className="px-2.5 py-1 border border-slate-300 rounded font-semibold hover:bg-slate-100 cursor-pointer"
                          >
                            Edit / Permissions
                          </button>
                          <button
                            onClick={() => setResetPwdTarget(adm)}
                            className="px-2.5 py-1 border border-amber-300 text-amber-800 rounded font-semibold hover:bg-amber-50 cursor-pointer"
                          >
                            Reset Pwd
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= AUCTION MANAGEMENT, APPROVALS & QUEUE ORDERING ================= */}
          {tab === 'auctions' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Products, Approvals & Display Order
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload new auction products, review user-submitted items, and arrange which product appears first (#1) on the homepage & auction queue.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingAuctionId(null);
                    setAuctionForm({
                      title: '',
                      description: '',
                      categoryId: categoriesList[0]?.id ? String(categoriesList[0].id) : '',
                      categoryName: categoriesList[0]?.name || 'Phones',
                      condition: 'Brand New',
                      brand: '',
                      location: 'Ikeja, Lagos',
                      sellerName: 'NaijaAuction Verified',
                      startingPrice: '500000',
                      bidIncrement: '10000',
                      reservePrice: '',
                      estimatedMarketValue: '750000',
                      status: 'live',
                      startTime: new Date().toISOString().slice(0, 16),
                      endTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
                      isFeatured: true,
                      putFirst: false,
                      queueOrder: String(auctionsList.length + 1),
                      images: [STUDIO_IMAGE_PRESETS[0].url],
                      newImageUrl: '',
                      specsText: '',
                    });
                    setShowAuctionModal(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Product for Auction</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { key: 'all', label: `All (${auctionsList.length})` },
                  {
                    key: 'pending',
                    label: `Pending Approval (${
                      auctionsList.filter((a) => a.approvalStatus === 'pending').length
                    })`,
                  },
                  { key: 'live', label: 'Live Now' },
                  { key: 'scheduled', label: 'Scheduled' },
                  { key: 'ended', label: 'Ended' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAuctionFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer border transition ${
                      auctionFilter === f.key
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                {reorderingSaving && (
                  <span className="text-emerald-700 font-semibold ml-2">Saving order...</span>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Order</th>
                      <th className="py-2.5 px-3 font-semibold">Lot & Seller</th>
                      <th className="py-2.5 px-3 font-semibold">Approval / Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Current Bid</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Bids</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auctionsList
                      .filter((a) => {
                        if (auctionFilter === 'all') return true;
                        if (auctionFilter === 'pending') return a.approvalStatus === 'pending';
                        return a.status === auctionFilter;
                      })
                      .map((a) => {
                        const globalIndex = auctionsList.findIndex((x) => x.id === a.id);
                        return (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-slate-900 w-7">
                                #{globalIndex + 1}
                              </span>
                              <button
                                onClick={() => handleReorderAuction(a.id, 'first')}
                                disabled={globalIndex === 0}
                                title="Put First (#1)"
                                className="p-1 border border-slate-200 rounded hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <ArrowUpToLine className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleReorderAuction(a.id, 'up')}
                                disabled={globalIndex <= 0}
                                title="Move Up"
                                className="p-1 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleReorderAuction(a.id, 'down')}
                                disabled={globalIndex === auctionsList.length - 1}
                                title="Move Down"
                                className="p-1 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {a.images?.[0] && (
                                <img
                                  src={a.images[0]}
                                  alt={a.title}
                                  className="w-11 h-9 rounded object-cover border border-slate-200 shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-slate-900">{a.title}</div>
                                <div className="text-slate-500">
                                  {a.code} · {a.categoryName} ·{' '}
                                  {a.sellerUsername ? `Posted by @${a.sellerUsername}` : a.sellerName}
                                </div>
                                <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                                  Slot: {new Date(a.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} –{' '}
                                  {new Date(a.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{a.status}</div>
                            {a.approvalStatus === 'pending' && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                                Pending Approval
                              </span>
                            )}
                            {a.approvalStatus === 'rejected' && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold text-[10px]">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                            ₦{Number(a.currentBid).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">{a.bidsCount}</td>
                          <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                            {a.approvalStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveProduct(a.id, 'live')}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded font-semibold cursor-pointer"
                                >
                                  Approve & Live
                                </button>
                                <button
                                  onClick={() => handleApproveProduct(a.id, 'scheduled')}
                                  className="px-2 py-1 border border-emerald-600 text-emerald-700 rounded font-semibold cursor-pointer"
                                >
                                  Approve Scheduled
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectProductTarget(a);
                                    setRejectReasonInput('');
                                  }}
                                  className="px-2 py-1 border border-rose-300 text-rose-700 rounded font-semibold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleInspectBids(a)}
                              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-100 font-semibold cursor-pointer"
                            >
                              Bids
                            </button>
                            <button
                              onClick={() => openEditAuctionModal(a)}
                              className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-100 font-semibold cursor-pointer"
                            >
                              Edit
                            </button>
                            {a.approvalStatus === 'approved' &&
                              a.status !== 'live' &&
                              a.status !== 'ended' && (
                                <button
                                  onClick={() => handleAuctionAction(a.id, 'live')}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded font-semibold cursor-pointer"
                                >
                                  Start
                                </button>
                              )}
                            {a.status === 'live' && (
                              <button
                                onClick={() => handleAuctionAction(a.id, 'ended')}
                                className="px-2 py-1 bg-slate-900 text-white rounded font-semibold cursor-pointer"
                              >
                                Close
                              </button>
                            )}
                            {a.status !== 'cancelled' && a.status !== 'ended' && (
                              <button
                                onClick={() => handleAuctionAction(a.id, 'cancelled')}
                                className="px-2 py-1 border border-rose-300 text-rose-700 rounded font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= CATEGORIES ================= */}
          {tab === 'categories' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Auction Categories</h2>

              <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-2 text-xs">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name (e.g. Cameras)"
                  className="px-3 py-2 border border-slate-300 rounded-lg flex-1"
                />
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Short description"
                  className="px-3 py-2 border border-slate-300 rounded-lg flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Add Category
                </button>
              </form>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-4">
                {categoriesList.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-slate-500">{c.description}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await apiRequest(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
                        loadTabData('categories');
                      }}
                      className="text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= ADMIN ACTIVITY LOGS ================= */}
          {tab === 'logs' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Administrator Activity Logs</h2>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Admin</th>
                      <th className="py-2.5 px-3 font-semibold">Action</th>
                      <th className="py-2.5 px-3 font-semibold">Details</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logsList.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          @{l.adminUsername}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {l.action}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{l.details}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= WEBSITE SETTINGS ================= */}
          {tab === 'settings' && settingsForm && (
            <form onSubmit={handleSaveWebsiteSettings} className="space-y-5 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Website Settings</h2>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {savingSettings ? 'Saving...' : 'Save All Settings'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Website Name</label>
                  <input
                    type="text"
                    value={settingsForm.siteName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, siteName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={settingsForm.logoUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, logoUrl: e.target.value })
                    }
                    placeholder="Optional image URL"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Homepage Hero Banner Title
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroBannerTitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, heroBannerTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Homepage Hero Banner Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.heroBannerSubtitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, heroBannerSubtitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={settingsForm.contactEmail}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={settingsForm.contactPhone}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Office Address
                  </label>
                  <input
                    type="text"
                    value={settingsForm.contactAddress}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contactAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Bid Increment (₦)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.defaultBidIncrement}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        defaultBidIncrement: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Anti-Sniping Extension (Seconds)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={settingsForm.antiSnipingSeconds}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        antiSnipingSeconds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                {/* Live Auction Slot & Gap Timing Controls */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <label className="block font-bold text-slate-900">
                    Time Between Auctions (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={settingsForm.timeBetweenAuctionsMinutes ?? 15}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        timeBetweenAuctionsMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[0, 5, 15, 30, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setSettingsForm({ ...settingsForm, timeBetweenAuctionsMinutes: m })
                        }
                        className={`px-2 py-0.5 rounded border text-[11px] font-semibold cursor-pointer ${
                          (settingsForm.timeBetweenAuctionsMinutes ?? 15) === m
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {m === 0 ? 'No Gap' : `${m}m gap`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Real-time cooldown interval enforced between sequential live auction slots.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <label className="block font-bold text-slate-900">
                    Default Live Auction Slot Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={settingsForm.defaultSlotDurationMinutes ?? 60}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        defaultSlotDurationMinutes: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[15, 30, 60, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setSettingsForm({ ...settingsForm, defaultSlotDurationMinutes: m })
                        }
                        className={`px-2 py-0.5 rounded border text-[11px] font-semibold cursor-pointer ${
                          (settingsForm.defaultSlotDurationMinutes ?? 60) === m
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {m}m slot
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Length of each live auction slot offered to sellers when posting products.
                  </p>
                </div>

                <div className="sm:col-span-2 flex flex-wrap gap-6 py-2">
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.allowRegistration}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          allowRegistration: e.target.checked,
                        })
                      }
                    />
                    <span>Allow New User Registrations</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsForm.requireEmailVerification}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          requireEmailVerification: e.target.checked,
                        })
                      }
                    />
                    <span>Require Email Verification Before Sign-In</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">About Us</label>
                  <textarea
                    rows={3}
                    value={settingsForm.aboutUs}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, aboutUs: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Auction Rules</label>
                  <textarea
                    rows={3}
                    value={settingsForm.auctionRules}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, auctionRules: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    rows={3}
                    value={settingsForm.termsAndConditions}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, termsAndConditions: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Privacy Policy</label>
                  <textarea
                    rows={3}
                    value={settingsForm.privacyPolicy}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, privacyPolicy: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* ================= MODALS ================= */}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 text-xs border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register New User</h3>
              <button type="button" onClick={() => setShowAddUserModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              required
              placeholder="Username"
              value={newUserForm.username}
              onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={newUserForm.phone}
              onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="password"
              required
              placeholder="Password (min 8 chars + number)"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <select
              value={newUserForm.roleName}
              onChange={(e) => setNewUserForm({ ...newUserForm, roleName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="buyer">Registered Bidder (Buyer)</option>
              <option value="seller">Verified Seller</option>
            </select>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer"
            >
              Create User Account
            </button>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditUser}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 text-xs border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Edit User @{editUserTarget.username}
              </h3>
              <button type="button" onClick={() => setEditUserTarget(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              value={editUserTarget.fullName}
              onChange={(e) => setEditUserTarget({ ...editUserTarget, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="email"
              required
              value={editUserTarget.email}
              onChange={(e) => setEditUserTarget({ ...editUserTarget, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="tel"
              value={editUserTarget.phone}
              onChange={(e) => setEditUserTarget({ ...editUserTarget, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <select
              value={editUserTarget.status}
              onChange={(e) => setEditUserTarget({ ...editUserTarget, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <label className="flex items-center gap-2 font-semibold text-slate-800 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(editUserTarget.canPostProducts)}
                onChange={(e) =>
                  setEditUserTarget({ ...editUserTarget, canPostProducts: e.target.checked })
                }
              />
              <span>Approve User to Post Products for Bidding</span>
            </label>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPwdTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleResetUserPassword}
            className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3 text-xs border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Reset Password: @{resetPwdTarget.username}
              </h3>
              <button type="button" onClick={() => setResetPwdTarget(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="password"
              required
              value={resetPwdInput}
              onChange={(e) => setResetPwdInput(e.target.value)}
              placeholder="New temporary password (min 8 chars + number)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
            >
              Confirm Password Reset
            </button>
          </form>
        </div>
      )}

      {/* User Auction History Modal */}
      {historyTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs border border-slate-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  @{historyTarget.user.username} — Auction History
                </h3>
                <p className="text-slate-500">
                  Registered: {new Date(historyTarget.user.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setHistoryTarget(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {historyTarget.history.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No bids placed by this user.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {historyTarget.history.map((h) => (
                  <div key={h.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{h.auctionTitle}</div>
                      <div className="text-slate-500">
                        {h.auctionCode} · {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="font-mono font-semibold tabular-nums">
                      ₦{Number(h.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-xs border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Confirm User Deletion</h3>
            <p className="text-slate-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-slate-900">@{deleteUserTarget.username}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteUserTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Administrator Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateAdmin}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 text-xs border border-slate-200 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Administrator</h3>
              <button type="button" onClick={() => setShowAddAdminModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={newAdminForm.fullName}
              onChange={(e) => setNewAdminForm({ ...newAdminForm, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              required
              placeholder="Username"
              value={newAdminForm.username}
              onChange={(e) => setNewAdminForm({ ...newAdminForm, username: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="email"
              required
              placeholder="Email Address"
              value={newAdminForm.email}
              onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={newAdminForm.phone}
              onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                required
                placeholder="Password"
                value={newAdminForm.password}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="password"
                required
                placeholder="Confirm Password"
                value={newAdminForm.confirmPassword}
                onChange={(e) =>
                  setNewAdminForm({ ...newAdminForm, confirmPassword: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrator Role</label>
              <select
                value={newAdminForm.roleName}
                onChange={(e) => setNewAdminForm({ ...newAdminForm, roleName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="super_admin">Super Admin</option>
                <option value="auction_manager">Auction Manager</option>
                <option value="user_manager">User Manager</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">
                Additional Explicit Permissions (Optional)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {availablePerms.map((p) => (
                  <label key={p.code} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAdminForm.permissions.includes(p.code)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...newAdminForm.permissions, p.code]
                          : newAdminForm.permissions.filter((c) => c !== p.code);
                        setNewAdminForm({ ...newAdminForm, permissions: next });
                      }}
                    />
                    <span>{p.code}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
            >
              Create Administrator
            </button>
          </form>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editAdminTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditAdmin}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 text-xs border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Manage Admin @{editAdminTarget.username}
              </h3>
              <button type="button" onClick={() => setEditAdminTarget(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={editAdminTarget.fullName}
              onChange={(e) =>
                setEditAdminTarget({ ...editAdminTarget, fullName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <select
              value={editAdminTarget.roleName}
              disabled={editAdminTarget.username === 'damwad'}
              onChange={(e) =>
                setEditAdminTarget({ ...editAdminTarget, roleName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="super_admin">Super Admin</option>
              <option value="auction_manager">Auction Manager</option>
              <option value="user_manager">User Manager</option>
            </select>
            <select
              value={editAdminTarget.status}
              disabled={editAdminTarget.username === 'damwad'}
              onChange={(e) => setEditAdminTarget({ ...editAdminTarget, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="space-y-1">
              <label className="block font-semibold text-slate-700">Assigned Permissions</label>
              <div className="grid grid-cols-2 gap-1.5">
                {availablePerms.map((p) => (
                  <label key={p.code} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAdminTarget.permissions.includes(p.code)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...editAdminTarget.permissions, p.code]
                          : editAdminTarget.permissions.filter((c: string) => c !== p.code);
                        setEditAdminTarget({ ...editAdminTarget, permissions: next });
                      }}
                    />
                    <span>{p.code}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer"
            >
              Save Administrator Changes
            </button>
          </form>
        </div>
      )}

      {/* Create / Edit Auction Modal */}
      {showAuctionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveAuction}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs border border-slate-200 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingAuctionId ? 'Edit Auction Listing' : 'Create New Auction Listing'}
              </h3>
              <button type="button" onClick={() => setShowAuctionModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={auctionForm.title}
                  onChange={(e) => setAuctionForm({ ...auctionForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={auctionForm.description}
                  onChange={(e) => setAuctionForm({ ...auctionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={auctionForm.categoryName}
                  onChange={(e) => {
                    const cat = categoriesList.find((c) => c.name === e.target.value);
                    setAuctionForm({
                      ...auctionForm,
                      categoryName: e.target.value,
                      categoryId: cat ? String(cat.id) : '',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={auctionForm.status}
                  onChange={(e) => setAuctionForm({ ...auctionForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="live">Live Now</option>
                  <option value="scheduled">Scheduled (Upcoming)</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Starting Price (₦)</label>
                <input
                  type="number"
                  required
                  value={auctionForm.startingPrice}
                  onChange={(e) =>
                    setAuctionForm({ ...auctionForm, startingPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Min Bid Increment (₦)
                </label>
                <input
                  type="number"
                  required
                  value={auctionForm.bidIncrement}
                  onChange={(e) =>
                    setAuctionForm({ ...auctionForm, bidIncrement: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between pt-1">
                <span className="font-semibold text-slate-700">Live Auction Time Window</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await apiRequest<{ slots: any[] }>('/api/public/auction-slots?dayOffset=0');
                      const nextOpen = (res.slots || []).find((s) => s.state === 'available');
                      if (nextOpen) {
                        const toLocal = (iso: string) => {
                          const d = new Date(iso);
                          return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                            .toISOString()
                            .slice(0, 16);
                        };
                        setAuctionForm((prev) => ({
                          ...prev,
                          status: 'scheduled',
                          startTime: toLocal(nextOpen.startTime),
                          endTime: toLocal(nextOpen.endTime),
                        }));
                        showToast('success', 'Slot Selected', 'Snapped to next open live auction slot.');
                      } else {
                        showToast('info', 'No Slots Today', 'No open slots left today; adjust times manually.');
                      }
                    } catch {
                      showToast('error', 'Error', 'Unable to load available slots.');
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hover:bg-emerald-100 cursor-pointer"
                >
                  Snap to Next Open Live Slot
                </button>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={auctionForm.startTime}
                  onChange={(e) => setAuctionForm({ ...auctionForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Closing Time</label>
                <input
                  type="datetime-local"
                  required
                  value={auctionForm.endTime}
                  onChange={(e) => setAuctionForm({ ...auctionForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Display Order Priority (#1 Comes First)
                </label>
                <input
                  type="number"
                  min={1}
                  value={auctionForm.queueOrder}
                  onChange={(e) => setAuctionForm({ ...auctionForm, queueOrder: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex items-end pb-2">
                {!editingAuctionId && (
                  <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={auctionForm.putFirst}
                      onChange={(e) =>
                        setAuctionForm({ ...auctionForm, putFirst: e.target.checked })
                      }
                    />
                    <span>Place This Product First (#1 in Catalog)</span>
                  </label>
                )}
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-semibold text-slate-700">
                  Upload Product Photos (Device Upload, Studio Presets, or URL)
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photos from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdminUploadImages}
                      className="hidden"
                    />
                  </label>
                  {STUDIO_IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() =>
                        setAuctionForm({
                          ...auctionForm,
                          images: auctionForm.images.includes(p.url)
                            ? auctionForm.images
                            : [...auctionForm.images, p.url],
                        })
                      }
                      className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      + {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={auctionForm.newImageUrl}
                    onChange={(e) =>
                      setAuctionForm({ ...auctionForm, newImageUrl: e.target.value })
                    }
                    placeholder="Or paste custom image URL..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!auctionForm.newImageUrl.trim()) return;
                      setAuctionForm({
                        ...auctionForm,
                        images: [...auctionForm.images, auctionForm.newImageUrl.trim()],
                        newImageUrl: '',
                      });
                    }}
                    className="px-3 py-2 bg-slate-900 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Add Image
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {auctionForm.images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-14 rounded border border-slate-200 overflow-hidden"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {idx > 0 && (
                        <button
                          type="button"
                          title="Set as primary photo"
                          onClick={() => {
                            const next = [...auctionForm.images];
                            const [picked] = next.splice(idx, 1);
                            next.unshift(picked);
                            setAuctionForm({ ...auctionForm, images: next });
                          }}
                          className="absolute bottom-0 left-0 bg-slate-900/80 text-white px-1 text-[9px] cursor-pointer"
                        >
                          Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setAuctionForm({
                            ...auctionForm,
                            images: auctionForm.images.filter((_, i) => i !== idx),
                          })
                        }
                        className="absolute top-0 right-0 bg-rose-600 text-white px-1 text-[10px] cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAuctionModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-semibold cursor-pointer"
              >
                {editingAuctionId ? 'Save Changes' : 'Publish Auction'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Submitted Product Modal */}
      {rejectProductTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmRejectProduct}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-3 text-xs border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Reject Product: {rejectProductTarget.code}
              </h3>
              <button type="button" onClick={() => setRejectProductTarget(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-600">
              Provide a reason why "{rejectProductTarget.title}" cannot be listed. The seller will be notified.
            </p>
            <textarea
              rows={3}
              required
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="e.g. Photos are blurry or starting price needs verification..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectProductTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 text-white rounded-lg font-semibold cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inspect Bids Modal */}
      {inspectBidsAuction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs border border-slate-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Bids for {inspectBidsAuction.auction.code}
              </h3>
              <button onClick={() => setInspectBidsAuction(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            {inspectBidsAuction.auction.winnerUsername && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 font-semibold text-emerald-900">
                Leading / Winning Bidder: @{inspectBidsAuction.auction.winnerUsername} (₦
                {Number(inspectBidsAuction.auction.currentBid).toLocaleString()})
              </div>
            )}
            {inspectBidsAuction.bids.length === 0 ? (
              <p className="text-slate-500 py-6 text-center">No bids placed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {inspectBidsAuction.bids.map((b) => (
                  <div key={b.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">@{b.username}</span>
                      <span className="text-slate-400 ml-2">IP: {b.ipAddress}</span>
                    </div>
                    <div className="font-mono font-semibold tabular-nums">
                      ₦{Number(b.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Self Change Password Modal */}
      {showChangeMyPwdModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleChangeMyAdminPassword}
            className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-3 text-xs border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Change Administrator Password
              </h3>
              <button type="button" onClick={() => setShowChangeMyPwdModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-slate-500">
              Update password for <span className="font-semibold text-slate-900">@{user?.username}</span>.
            </p>
            <input
              type="password"
              required
              value={myPwdForm.currentPassword}
              onChange={(e) => setMyPwdForm({ ...myPwdForm, currentPassword: e.target.value })}
              placeholder="Current password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="password"
              required
              value={myPwdForm.newPassword}
              onChange={(e) => setMyPwdForm({ ...myPwdForm, newPassword: e.target.value })}
              placeholder="New password (min 8 chars + number)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="password"
              required
              value={myPwdForm.confirmPassword}
              onChange={(e) => setMyPwdForm({ ...myPwdForm, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              disabled={savingMyPwd}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {savingMyPwd ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
