import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
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
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth, WebsiteSettingsData } from '../context/AuthContext';
import { apiRequest } from '../services/api';

type AdminTab = 'overview' | 'users' | 'admins' | 'auctions' | 'categories' | 'logs' | 'settings';

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

  // Auctions & Categories state
  const [auctionsList, setAuctionsList] = useState<any[]>([]);
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
    images: [STUDIO_IMAGE_PRESETS[0].url],
    newImageUrl: '',
    specsText: '',
  });
  const [inspectBidsAuction, setInspectBidsAuction] = useState<{ auction: any; bids: any[] } | null>(
    null
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Website Settings state
  const [settingsForm, setSettingsForm] = useState<WebsiteSettingsData | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

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
    }
  }, [tab, isAdmin, user?.mustChangePassword]);

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
        }),
      });
      showToast('success', 'User Updated', `Saved changes for @${editUserTarget.username}`);
      setEditUserTarget(null);
      loadTabData('users');
    } catch (err: any) {
      showToast('error', 'Error', err?.message || 'Failed to save user.');
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

  const handleAuctionAction = async (auctionId: number, status: string) => {
    try {
      await apiRequest(`/api/admin/auctions/${auctionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast('success', 'Auction Status Updated', `Auction marked as ${status}.`);
      loadTabData('auctions');
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
      images: a.images && a.images.length > 0 ? a.images : [STUDIO_IMAGE_PRESETS[0].url],
      newImageUrl: '',
      specsText: Array.isArray(a.specs) ? a.specs.join('\n') : '',
    });
    setShowAuctionModal(true);
  };

  const sidebarTabs: { key: AdminTab; label: string; icon: React.ReactNode; allowed: boolean }[] = [
    { key: 'overview', label: 'Overview & Analytics', icon: <BarChart3 className="w-4 h-4" />, allowed: true },
    {
      key: 'users',
      label: 'User Management',
      icon: <Users className="w-4 h-4" />,
      allowed: hasPermission('manage_users'),
    },
    {
      key: 'admins',
      label: 'Admin Accounts (RBAC)',
      icon: <ShieldCheck className="w-4 h-4" />,
      allowed: hasPermission('manage_admins'),
    },
    {
      key: 'auctions',
      label: 'Auction Management',
      icon: <Gavel className="w-4 h-4" />,
      allowed: hasPermission('manage_auctions'),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="border border-slate-200 rounded-2xl p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-emerald-400 font-semibold">
            Protected Admin Console · Role: {roles.join(', ')}
          </div>
          <h1 className="text-2xl font-bold font-display mt-0.5">
            Platform Administration (@{user?.username})
          </h1>
        </div>
        <div className="text-xs text-slate-300">
          Server-Side RBAC Enforced · Session Rotated Automatically
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="border border-slate-200 rounded-2xl p-2 bg-white space-y-1">
            {sidebarTabs
              .filter((t) => t.allowed)
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                    tab === t.key
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
          </div>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-9 border border-slate-200 rounded-2xl p-6 bg-white min-h-[540px]">
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

              {/* Analytics Chart */}
              {overview?.categoryStats?.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Auction Volume by Category (₦)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview.categoryStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="totalBidVolume" fill="#059669" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

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
                      <th className="py-2.5 px-3 font-semibold">Registered</th>
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
                        <td className="py-2.5 px-3 tabular-nums text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
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

          {/* ================= AUCTION MANAGEMENT ================= */}
          {tab === 'auctions' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Auction Management</h2>
                <button
                  onClick={() => {
                    setEditingAuctionId(null);
                    setShowAuctionModal(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Auction Listing</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Lot</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Current Bid</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Bids</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auctionsList.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{a.title}</div>
                          <div className="text-slate-500">
                            {a.code} · {a.categoryName} · Closes{' '}
                            {new Date(a.effectiveEndTime).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{a.status}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums">
                          ₦{Number(a.currentBid).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">{a.bidsCount}</td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
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
                          {a.status !== 'live' && a.status !== 'ended' && (
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
                    ))}
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
              <div className="sm:col-span-2 space-y-2">
                <label className="block font-semibold text-slate-700">
                  Product Images (Multiple Supported)
                </label>
                <div className="flex flex-wrap gap-1.5">
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
                      className="relative w-16 h-12 rounded border border-slate-200 overflow-hidden"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
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
    </div>
  );
};
