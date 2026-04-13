import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, PageSkeleton } from '@shared/components/ui';
import { useLogin } from '@features/auth/hooks/useLogin';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { resolvePostLoginRedirect } from '@shared/config/auth-routing';

type AuthMode = 'select' | 'employer-login' | 'employee-login' | 'employer-register';

const Logo = () => (
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        background: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    </div>
  </div>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '10px 14px',
      background: 'var(--color-danger-subtle)',
      border: '1px solid var(--color-danger-border)',
      borderRadius: 'var(--radius-md)',
      animation: 'loginFadeIn 160ms ease',
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-danger)', lineHeight: 1.4 }}>{message}</p>
  </div>
);

const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--color-text-secondary)',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 'var(--text-sm)',
      padding: '4px 0',
      marginBottom: 4,
    }}
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
    Back
  </button>
);

export function LoginPage() {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => Boolean(s.user && s.accessToken));
  const setSession = useAuthStore((s) => s.setSession);

  const { login, isPending, error, clearError } = useLogin();

  const [mode, setMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (error || registerError) {
      clearError();
      setRegisterError(null);
    }
  }, [email, phone, password, name, companyName, mode]);

  if (isAuthenticated) {
    const u = useAuthStore.getState().user;
    if (!u) return <PageSkeleton />;
    return <Navigate to={resolvePostLoginRedirect(u, searchParams.get('redirect'))} replace />;
  }

  const handleEmployerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    const success = await login({ email: email.trim(), password });
    if (success) {
      const u = useAuthStore.getState().user;
      if (u) navigate(resolvePostLoginRedirect(u, searchParams.get('redirect')), { replace: true });
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password) return;
    const success = await login({ phone: phone.trim(), password });
    if (success) {
      const u = useAuthStore.getState().user;
      if (u) navigate(resolvePostLoginRedirect(u, searchParams.get('redirect')), { replace: true });
    }
  };

  const handleRegisterEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !companyName.trim() || !password) return;
    if (!email.trim() && !phone.trim()) {
      setRegisterError('Please enter your email or phone number');
      return;
    }
    setIsRegistering(true);
    setRegisterError(null);
    try {
      const response = await authApi.registerEmployer({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        companyName: companyName.trim(),
      });
      const accessToken =
        (response as any).accessToken ?? (response as any).access_token ?? (response as any).token;
      const refreshToken =
        (response as any).refreshToken ?? (response as any).refresh_token;
      if (response.user && accessToken) {
        const primaryMembership = response.memberships?.[0] ?? null;
        const tenant = response.tenant
          ? {
              id: response.tenant.id,
              name: response.tenant.name,
              slug: response.tenant.slug,
              planId: response.tenant.plan_id,
              isActive: response.tenant.is_active,
            }
          : null;
        setSession(
          {
            user: {
              userId: response.user.id,
              tenantId: tenant?.id ?? primaryMembership?.tenant_id ?? '',
              tenantName: tenant?.name ?? 'Platform',
              email: response.user.email,
              firstName: response.user.first_name,
              lastName: response.user.last_name,
              role: primaryMembership?.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
              systemRole: response.user.system_role,
            },
            tenant,
            memberships: (response.memberships ?? []).map((membership) => ({
              userId: membership.user_id,
              tenantId: membership.tenant_id,
              role: membership.role,
            })),
            activeTenantId: tenant?.id ?? primaryMembership?.tenant_id ?? null,
          },
          accessToken,
          refreshToken ?? null
        );
        const u = useAuthStore.getState().user;
        if (u) navigate(resolvePostLoginRedirect(u, searchParams.get('redirect')), { replace: true });
      } else {
        setRegisterError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Registration failed. Please try again.';
      setRegisterError(msg.includes('already') ? msg : 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100dvh',
    background: 'var(--color-bg)',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch' as any,
    animation: 'loginFadeIn 220ms ease',
  };

  const innerStyle: React.CSSProperties = {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: isMobile ? '24px 20px 40px' : '48px 56px',
    gap: 16,
    maxWidth: 480,
    margin: '0 auto',
  };

  const pwToggleBtn = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );

  const submitBtnStyle: React.CSSProperties = {
    width: '100%',
    height: 52,
    borderRadius: 14,
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    marginTop: 4,
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={innerStyle}>
        <Logo />

        {/* ── Mode: Select role ─────────────────────────────────────────── */}
        {mode === 'select' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <h1 style={{ fontSize: isMobile ? 28 : 32, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Welcome to TFP
              </h1>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginTop: 8 }}>
                Who are you?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <button
                type="button"
                onClick={() => setMode('employer-login')}
                style={{
                  width: '100%',
                  height: 64,
                  borderRadius: 16,
                  border: '2px solid var(--color-accent)',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  fontSize: 'var(--text-md)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'opacity 100ms ease',
                }}
                onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.85')}
                onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                </svg>
                I am an Employer
              </button>

              <button
                type="button"
                onClick={() => setMode('employee-login')}
                style={{
                  width: '100%',
                  height: 64,
                  borderRadius: 16,
                  border: '2px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--text-md)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'border-color 100ms ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-accent)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                I am an Employee
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            </div>

            <button
              type="button"
              onClick={() => setMode('employer-register')}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 12,
                border: '1.5px dashed var(--color-border)',
                background: 'transparent',
                color: 'var(--color-accent)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create an employer account
            </button>
          </>
        )}

        {/* ── Mode: Employer login ───────────────────────────────────────── */}
        {mode === 'employer-login' && (
          <>
            <BackButton onClick={() => setMode('select')} />
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Employer Sign In
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Sign in with your email and password
              </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <form onSubmit={handleEmployerLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
                style={{ height: 48, fontSize: '16px' }}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ height: 48, fontSize: '16px' }}
                rightIcon={pwToggleBtn}
              />
              <div style={{ position: 'sticky', bottom: 0, paddingTop: 4, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--color-bg) 40%)' }}>
                <Button variant="primary" size="lg" type="submit" loading={isPending} disabled={!email.trim() || !password || isPending} style={submitBtnStyle}>
                  Sign In
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── Mode: Employee login (phone) ──────────────────────────────── */}
        {mode === 'employee-login' && (
          <>
            <BackButton onClick={() => setMode('select')} />
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Employee Sign In
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Enter your phone number and password
              </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <form onSubmit={handleEmployeeLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Phone number"
                type="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                autoFocus
                required
                style={{ height: 48, fontSize: '16px' }}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ height: 48, fontSize: '16px' }}
                rightIcon={pwToggleBtn}
              />
              <div style={{ position: 'sticky', bottom: 0, paddingTop: 4, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--color-bg) 40%)' }}>
                <Button variant="primary" size="lg" type="submit" loading={isPending} disabled={!phone.trim() || !password || isPending} style={submitBtnStyle}>
                  Sign In
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── Mode: Employer registration ───────────────────────────────── */}
        {mode === 'employer-register' && (
          <>
            <BackButton onClick={() => setMode('select')} />
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Create Employer Account
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Start your 15-day free trial. No credit card required.
              </p>
            </div>

            {registerError && <ErrorBanner message={registerError} />}

            <form onSubmit={handleRegisterEmployer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Your name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                required
                style={{ height: 48, fontSize: '16px' }}
              />
              <Input
                label="Company name"
                type="text"
                placeholder="Acme Construction"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                style={{ height: 48, fontSize: '16px' }}
              />
              <Input
                label="Email (or phone below)"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{ height: 48, fontSize: '16px' }}
              />
              <Input
                label="Phone (optional if email provided)"
                type="tel"
                placeholder="+1 555 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                style={{ height: 48, fontSize: '16px' }}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{ height: 48, fontSize: '16px' }}
                rightIcon={pwToggleBtn}
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: -4 }}>
                By creating an account you agree to our Terms of Service.
              </p>
              <div style={{ position: 'sticky', bottom: 0, paddingTop: 4, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--color-bg) 40%)' }}>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  loading={isRegistering}
                  disabled={!name.trim() || !companyName.trim() || !password || isRegistering}
                  style={submitBtnStyle}
                >
                  Create Account & Start Trial
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
