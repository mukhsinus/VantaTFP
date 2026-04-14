import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input, PageSkeleton } from '@shared/components/ui';
import { useLogin } from '@features/auth/hooks/useLogin';
import { authApi } from '@entities/auth/auth.api';
import { useAuthStore } from '@app/store/auth.store';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { resolvePostLoginRedirect } from '@shared/config/auth-routing';
const Logo = () => (_jsx("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: 8 }, children: _jsx("div", { style: {
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
        }, children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }) }));
const ErrorBanner = ({ message }) => (_jsxs("div", { style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--color-danger-subtle)',
        border: '1px solid var(--color-danger-border)',
        borderRadius: 'var(--radius-md)',
        animation: 'loginFadeIn 160ms ease',
    }, children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-danger)", strokeWidth: 2, style: { flexShrink: 0, marginTop: 1 }, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-danger)', lineHeight: 1.4 }, children: message })] }));
const BackButton = ({ onClick }) => (_jsxs("button", { type: "button", onClick: onClick, style: {
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
    }, children: [_jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M15 18l-6-6 6-6" }) }), "Back"] }));
export function LoginPage() {
    const isMobile = useIsMobile();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((s) => Boolean(s.user && s.accessToken));
    const setSession = useAuthStore((s) => s.setSession);
    const { login, isPending, error, clearError } = useLogin();
    const [mode, setMode] = useState('select');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [registerError, setRegisterError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);
    useEffect(() => {
        if (error || registerError) {
            clearError();
            setRegisterError(null);
        }
    }, [email, phone, password, name, companyName, mode]);
    if (isAuthenticated) {
        const u = useAuthStore.getState().user;
        if (!u)
            return _jsx(PageSkeleton, {});
        return _jsx(Navigate, { to: resolvePostLoginRedirect(u, searchParams.get('redirect')), replace: true });
    }
    const handleEmployerLogin = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password)
            return;
        const success = await login({ email: email.trim(), password });
        if (success) {
            const u = useAuthStore.getState().user;
            if (u)
                navigate(resolvePostLoginRedirect(u, searchParams.get('redirect')), { replace: true });
        }
    };
    const handleEmployeeLogin = async (e) => {
        e.preventDefault();
        if (!phone.trim() || !password)
            return;
        const success = await login({ phone: phone.trim(), password });
        if (success) {
            const u = useAuthStore.getState().user;
            if (u)
                navigate(resolvePostLoginRedirect(u, searchParams.get('redirect')), { replace: true });
        }
    };
    const handleRegisterEmployer = async (e) => {
        e.preventDefault();
        if (!name.trim() || !companyName.trim() || !password)
            return;
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
            const accessToken = response.accessToken ?? response.access_token ?? response.token;
            const refreshToken = response.refreshToken ?? response.refresh_token;
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
                setSession({
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
                }, accessToken, refreshToken ?? null);
                const u = useAuthStore.getState().user;
                if (u)
                    navigate(resolvePostLoginRedirect(u, searchParams.get('redirect')), { replace: true });
            }
            else {
                setRegisterError('Registration failed. Please try again.');
            }
        }
        catch (err) {
            const msg = err?.message ?? 'Registration failed. Please try again.';
            setRegisterError(msg.includes('already') ? msg : 'Registration failed. Please try again.');
        }
        finally {
            setIsRegistering(false);
        }
    };
    const containerStyle = {
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        animation: 'loginFadeIn 220ms ease',
    };
    const innerStyle = {
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? '24px 20px 40px' : '48px 56px',
        gap: 16,
        maxWidth: 480,
        margin: '0 auto',
    };
    const pwToggleBtn = (_jsx("button", { type: "button", onClick: () => setShowPassword((v) => !v), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }, "aria-label": showPassword ? 'Hide password' : 'Show password', children: showPassword ? (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" }), _jsx("path", { d: "M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" }), _jsx("line", { x1: "1", y1: "1", x2: "23", y2: "23" })] })) : (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })) }));
    const submitBtnStyle = {
        width: '100%',
        height: 52,
        borderRadius: 14,
        fontSize: 'var(--text-md)',
        fontWeight: 600,
        marginTop: 4,
    };
    return (_jsxs("div", { style: containerStyle, children: [_jsx("style", { children: `
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` }), _jsxs("div", { style: innerStyle, children: [_jsx(Logo, {}), mode === 'select' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: 8 }, children: [_jsx("h1", { style: { fontSize: isMobile ? 28 : 32, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }, children: "Welcome to TFP" }), _jsx("p", { style: { fontSize: 'var(--text-base)', color: 'var(--color-text-secondary)', marginTop: 8 }, children: "Who are you?" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [_jsxs("button", { type: "button", onClick: () => setMode('employer-login'), style: {
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
                                        }, onMouseDown: (e) => (e.currentTarget.style.opacity = '0.85'), onMouseUp: (e) => (e.currentTarget.style.opacity = '1'), onMouseLeave: (e) => (e.currentTarget.style.opacity = '1'), children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, children: [_jsx("rect", { x: "2", y: "7", width: "20", height: "14", rx: "2" }), _jsx("path", { d: "M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" })] }), "I am an Employer"] }), _jsxs("button", { type: "button", onClick: () => setMode('employee-login'), style: {
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
                                        }, onMouseEnter: (e) => (e.currentTarget.style.borderColor = 'var(--color-accent)'), onMouseLeave: (e) => (e.currentTarget.style.borderColor = 'var(--color-border)'), children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, children: [_jsx("path", { d: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }), "I am an Employee"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }, children: [_jsx("div", { style: { flex: 1, height: 1, background: 'var(--color-border)' } }), _jsx("span", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: "or" }), _jsx("div", { style: { flex: 1, height: 1, background: 'var(--color-border)' } })] }), _jsx("button", { type: "button", onClick: () => setMode('employer-register'), style: {
                                    width: '100%',
                                    height: 48,
                                    borderRadius: 12,
                                    border: '1.5px dashed var(--color-border)',
                                    background: 'transparent',
                                    color: 'var(--color-accent)',
                                    fontSize: 'var(--text-sm)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }, children: "Create an employer account" })] })), mode === 'employer-login' && (_jsxs(_Fragment, { children: [_jsx(BackButton, { onClick: () => setMode('select') }), _jsxs("div", { style: { textAlign: 'center', marginBottom: 4 }, children: [_jsx("h1", { style: { fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--color-text-primary)' }, children: "Employer Sign In" }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 6 }, children: "Sign in with your email and password" })] }), error && _jsx(ErrorBanner, { message: error }), _jsxs("form", { onSubmit: handleEmployerLogin, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [_jsx(Input, { label: "Email", type: "email", placeholder: "you@company.com", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email", autoFocus: true, required: true, style: { height: 48, fontSize: '16px' } }), _jsx(Input, { label: "Password", type: showPassword ? 'text' : 'password', placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", required: true, style: { height: 48, fontSize: '16px' }, rightIcon: pwToggleBtn }), _jsx("div", { style: { position: 'sticky', bottom: 0, paddingTop: 4, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--color-bg) 40%)' }, children: _jsx(Button, { variant: "primary", size: "lg", type: "submit", loading: isPending, disabled: !email.trim() || !password || isPending, style: submitBtnStyle, children: "Sign In" }) })] })] })), mode === 'employee-login' && (_jsxs(_Fragment, { children: [_jsx(BackButton, { onClick: () => setMode('select') }), _jsxs("div", { style: { textAlign: 'center', marginBottom: 4 }, children: [_jsx("h1", { style: { fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--color-text-primary)' }, children: "Employee Sign In" }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 6 }, children: "Enter your phone number and password" })] }), error && _jsx(ErrorBanner, { message: error }), _jsxs("form", { onSubmit: handleEmployeeLogin, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [_jsx(Input, { label: "Phone number", type: "tel", placeholder: "+1 555 000 0000", value: phone, onChange: (e) => setPhone(e.target.value), autoComplete: "tel", autoFocus: true, required: true, style: { height: 48, fontSize: '16px' } }), _jsx(Input, { label: "Password", type: showPassword ? 'text' : 'password', placeholder: "Your password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", required: true, style: { height: 48, fontSize: '16px' }, rightIcon: pwToggleBtn }), _jsx("div", { style: { position: 'sticky', bottom: 0, paddingTop: 4, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--color-bg) 40%)' }, children: _jsx(Button, { variant: "primary", size: "lg", type: "submit", loading: isPending, disabled: !phone.trim() || !password || isPending, style: submitBtnStyle, children: "Sign In" }) })] })] })), mode === 'employer-register' && (_jsxs(_Fragment, { children: [_jsx(BackButton, { onClick: () => setMode('select') }), _jsxs("div", { style: { textAlign: 'center', marginBottom: 4 }, children: [_jsx("h1", { style: { fontSize: isMobile ? 24 : 28, fontWeight: 700, color: 'var(--color-text-primary)' }, children: "Create Employer Account" }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 6 }, children: "Start your 15-day free trial. No credit card required." })] }), registerError && _jsx(ErrorBanner, { message: registerError }), _jsxs("form", { onSubmit: handleRegisterEmployer, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [_jsx(Input, { label: "Your name", type: "text", placeholder: "John Smith", value: name, onChange: (e) => setName(e.target.value), autoComplete: "name", autoFocus: true, required: true, style: { height: 48, fontSize: '16px' } }), _jsx(Input, { label: "Company name", type: "text", placeholder: "Acme Construction", value: companyName, onChange: (e) => setCompanyName(e.target.value), required: true, style: { height: 48, fontSize: '16px' } }), _jsx(Input, { label: "Email (or phone below)", type: "email", placeholder: "you@company.com", value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email", style: { height: 48, fontSize: '16px' } }), _jsx(Input, { label: "Phone (optional if email provided)", type: "tel", placeholder: "+1 555 000 0000", value: phone, onChange: (e) => setPhone(e.target.value), autoComplete: "tel", style: { height: 48, fontSize: '16px' } }), _jsx(Input, { label: "Password", type: showPassword ? 'text' : 'password', placeholder: "At least 8 characters", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "new-password", required: true, style: { height: 48, fontSize: '16px' }, rightIcon: pwToggleBtn }), _jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: -4 }, children: "By creating an account you agree to our Terms of Service." }), _jsx("div", { style: { position: 'sticky', bottom: 0, paddingTop: 4, background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--color-bg) 40%)' }, children: _jsx(Button, { variant: "primary", size: "lg", type: "submit", loading: isRegistering, disabled: !name.trim() || !companyName.trim() || !password || isRegistering, style: submitBtnStyle, children: "Create Account & Start Trial" }) })] })] }))] })] }));
}
