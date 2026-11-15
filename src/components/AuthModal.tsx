import React, { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

export const AuthModal: React.FC = () => {
  const {
    authGate,
    closeAuthModal,
    setAuthModalMode,
    login,
    loginWithGoogle,
    register,
    refreshSession,
    showToast,
    user,
  } = useAuth();

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);

  // Forgot / Reset / Verify state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [previewResetToken, setPreviewResetToken] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mandatory password change modal for initial admin login
  const showForcedAdminPasswordModal = Boolean(user && user.mustChangePassword);

  if (!authGate.isOpen && !showForcedAdminPasswordModal) return null;

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      await login(identifier, loginPassword, rememberMe);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetMessages();
    setSubmitting(true);
    try {
      await loginWithGoogle(rememberMe);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign-in was cancelled or failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (regPassword !== confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        fullName,
        username,
        email,
        phone,
        password: regPassword,
        confirmPassword,
        rememberMe,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string; previewResetToken?: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ identifier: forgotIdentifier }),
        }
      );
      setSuccessMsg(res.message);
      if (res.previewResetToken) {
        setPreviewResetToken(res.previewResetToken);
        setResetToken(res.previewResetToken);
      }
      setAuthModalMode('reset');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not process reset request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      setSuccessMsg(res.message);
      setPreviewResetToken(null);
      setTimeout(() => {
        resetMessages();
        setAuthModalMode('login');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setSubmitting(true);
    try {
      const tokenToUse = verifyToken || authGate.verificationTokenPreview || '';
      const res = await apiRequest<{ message: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: tokenToUse }),
      });
      await refreshSession();
      showToast('success', 'Email Verified', res.message);
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForcedPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: user?.username,
          currentPassword: loginPassword,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      await refreshSession();
      showToast('success', 'Password Updated', 'Your administrator account is now secured.');
      setNewPassword('');
      setConfirmNewPassword('');
      setLoginPassword('');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  // Forced First-Login Password Update Gate for Admin
  if (showForcedAdminPasswordModal && !authGate.isOpen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Change Initial Administrator Password
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                For security, you must replace the initial password for{' '}
                <span className="font-semibold text-slate-900">@{user?.username}</span> before
                accessing admin controls.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleForcedPasswordChange} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Initial Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPwd ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPwd(!showLoginPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Strong Password
              </label>
              <input
                type={showLoginPwd ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="Minimum 8 chars with letters & numbers"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showLoginPwd ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="Re-enter new password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating Password...' : 'Save New Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 my-8 relative">
        <button
          onClick={closeAuthModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GATE VIEW */}
        {authGate.mode === 'gate' && (
          <div className="space-y-5 pt-2 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create a free account or log in to participate in our live auctions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('login');
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('register');
                }}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold transition cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* LOGIN VIEW */}
        {authGate.mode === 'login' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-xs text-slate-500 mt-1">
                Sign in with your email or username to bid and manage your account.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or username"
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPwd ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPwd(!showLoginPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Remember me (stay signed in)</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setAuthModalMode('forgot');
                  }}
                  className="text-emerald-700 font-semibold hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Signing In...' : 'Login'}
              </button>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full py-2.5 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Continue with Google
            </button>

            <p className="text-center text-xs text-slate-600">
              New to NaijaAuction?{' '}
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('register');
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Create free account
              </button>
            </p>
          </div>
        )}

        {/* REGISTER VIEW */}
        {authGate.mode === 'register' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Free Account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Join verified bidders and participate in real-time escrow auctions.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Chinedu Okafor"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="chinedu_deals"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chinedu@example.com"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPwd ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Min 8 chars + number"
                      className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPwd(!showRegPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showRegPwd ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Keep me signed in on this browser (Remember Me)</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Creating Account...' : 'Create Account'}</span>
              </button>
            </form>

            <p className="text-center text-xs text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('login');
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Login here
              </button>
            </p>
          </div>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {authGate.mode === 'forgot' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your email or username to request a secure password reset token.
              </p>
            </div>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleForgotSubmit} className="space-y-3 text-sm">
              <input
                type="text"
                required
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder="Email or username"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition cursor-pointer"
              >
                {submitting ? 'Sending...' : 'Request Reset Token'}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setAuthModalMode('login');
              }}
              className="w-full text-center text-xs text-slate-600 hover:underline cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* RESET PASSWORD VIEW */}
        {authGate.mode === 'reset' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your reset token and choose a new password.
              </p>
            </div>
            {previewResetToken && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <div className="font-semibold">Reset Token Issued (Sandbox Delivery):</div>
                <div className="font-mono break-all mt-1 select-all">{previewResetToken}</div>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {successMsg}
              </div>
            )}
            <form onSubmit={handleResetSubmit} className="space-y-3 text-sm">
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars + number)"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition cursor-pointer"
              >
                {submitting ? 'Resetting...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* EMAIL VERIFICATION VIEW */}
        {authGate.mode === 'verify' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Verify Your Email</h2>
            </div>
            <p className="text-xs text-slate-600">
              Confirm your email address to complete your account verification.
            </p>
            {authGate.verificationTokenPreview && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <div className="font-semibold">Verification Token:</div>
                <div className="font-mono break-all mt-1 select-all">
                  {authGate.verificationTokenPreview}
                </div>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleVerifyEmailSubmit} className="space-y-3 text-sm">
              <input
                type="text"
                value={verifyToken || authGate.verificationTokenPreview || ''}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="Enter verification token"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition cursor-pointer"
                >
                  {submitting ? 'Verifying...' : 'Verify Email'}
                </button>
                <button
                  type="button"
                  onClick={closeAuthModal}
                  className="py-2.5 px-4 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Later
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
