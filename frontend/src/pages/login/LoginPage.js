import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@shared/components/ui';
import { useLogin } from '@features/auth/hooks/useLogin';
import { useAuthStore } from '@app/store/auth.store';
import { useIsMobile } from '@shared/hooks/useIsMobile';
export function LoginPage() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') ?? '/dashboard';
    const isAuthenticated = useAuthStore((s) => s.user !== null && s.accessToken !== null);
    const navigate = useNavigate();
    const { login, isPending, error, clearError } = useLogin();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Clear error when the user starts typing again
    useEffect(() => {
        if (error)
            clearError();
    }, [email, password]);
    // Already signed in — skip the login page entirely
    if (isAuthenticated) {
        return _jsx(Navigate, { to: redirectTo, replace: true });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password)
            return;
        const success = await login({ email: email.trim(), password });
        if (success)
            navigate(redirectTo, { replace: true });
    };
    if (isMobile) {
        return (_jsxs("div", { style: {
                minHeight: '100dvh',
                background: 'var(--color-bg)',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                animation: 'mobileLoginFadeIn 220ms ease',
            }, children: [_jsx("style", { children: `
          @keyframes mobileLoginFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        ` }), _jsxs("div", { style: {
                        minHeight: '100dvh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '20px 16px',
                        gap: 18,
                        maxWidth: 460,
                        margin: '0 auto',
                    }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: 4 }, children: _jsx("div", { style: {
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    background: 'var(--color-accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: 'var(--shadow-sm)',
                                }, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }) }), _jsxs("div", { style: { textAlign: 'center', marginBottom: 2 }, children: [_jsx("h1", { style: {
                                        fontSize: 30,
                                        fontWeight: 700,
                                        color: 'var(--color-text-primary)',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.2,
                                    }, children: t('login.form.title') }), _jsx("p", { style: {
                                        fontSize: 'var(--text-base)',
                                        color: 'var(--color-text-secondary)',
                                        marginTop: 8,
                                        lineHeight: 1.45,
                                    }, children: t('login.form.subtitle') })] }), error && (_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '10px 12px',
                                background: 'var(--color-danger-subtle)',
                                border: '1px solid var(--color-danger-border)',
                                borderRadius: 'var(--radius-md)',
                                animation: 'mobileLoginFadeIn 160ms ease',
                            }, children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-danger)", strokeWidth: 2, style: { flexShrink: 0, marginTop: 1 }, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-danger)', lineHeight: 1.4 }, children: error })] })), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 14 }, children: [_jsx(Input, { label: t('login.form.email'), type: "email", placeholder: t('auth.placeholders.email'), value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email", autoFocus: true, required: true, style: { height: 48, fontSize: '16px' } }), _jsx(Input, { label: t('login.form.password'), type: showPassword ? 'text' : 'password', placeholder: t('auth.placeholders.passwordMasked'), value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", required: true, style: { height: 48, fontSize: '16px' }, rightIcon: _jsx("button", { type: "button", onClick: () => setShowPassword((v) => !v), style: {
                                            width: 24,
                                            height: 24,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            pointerEvents: 'auto',
                                        }, "aria-label": showPassword ? t('auth.password.hide') : t('auth.password.show'), children: showPassword ? (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" }), _jsx("path", { d: "M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" }), _jsx("line", { x1: "1", y1: "1", x2: "23", y2: "23" })] })) : (_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })) }) }), _jsx("div", { style: {
                                        position: 'sticky',
                                        bottom: 0,
                                        paddingTop: 6,
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, var(--color-bg) 30%)',
                                    }, children: _jsx(Button, { variant: "primary", size: "lg", type: "submit", loading: isPending, disabled: !email.trim() || !password || isPending, style: {
                                            width: '100%',
                                            height: 50,
                                            borderRadius: 12,
                                            fontSize: 'var(--text-md)',
                                            fontWeight: 600,
                                            transition: 'transform 80ms ease',
                                        }, onMouseDown: (e) => (e.currentTarget.style.transform = 'scale(0.985)'), onMouseUp: (e) => (e.currentTarget.style.transform = 'scale(1)'), onMouseLeave: (e) => (e.currentTarget.style.transform = 'scale(1)'), children: t('login.form.submit') }) })] }), _jsx("p", { style: {
                                marginTop: 2,
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-muted)',
                                textAlign: 'center',
                                lineHeight: 1.4,
                            }, children: t('login.form.hint') })] })] }));
    }
    return (_jsxs("div", { style: {
            minHeight: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
        }, children: [_jsxs("div", { style: {
                    background: 'var(--color-gray-900)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '48px 56px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("div", { style: {
                                    width: 32,
                                    height: 32,
                                    borderRadius: 'var(--radius)',
                                    background: 'var(--color-accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }, children: _jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, children: _jsx("polyline", { points: "22 12 18 12 15 21 9 3 6 12 2 12" }) }) }), _jsx("span", { style: { fontSize: 'var(--text-md)', fontWeight: 700, color: '#fff' }, children: t('common.brand.shortName') })] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }, children: [_jsx("p", { style: {
                                    fontSize: 'var(--text-3xl)',
                                    fontWeight: 700,
                                    color: '#fff',
                                    lineHeight: 1.25,
                                    marginBottom: 16,
                                }, children: t('login.hero.headline') }), _jsx("p", { style: { fontSize: 'var(--text-md)', color: 'var(--color-gray-400)', lineHeight: 1.65 }, children: t('login.hero.subheadline') }), _jsx("div", { style: { marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }, children: [
                                    t('login.hero.feature1'),
                                    t('login.hero.feature2'),
                                    t('login.hero.feature3'),
                                ].map((feature) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("div", { style: {
                                                width: 20,
                                                height: 20,
                                                borderRadius: '50%',
                                                background: 'rgba(37,99,235,0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }, children: _jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", strokeWidth: 3, children: _jsx("path", { d: "M5 12l5 5L19 7" }) }) }), _jsx("span", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-gray-300)' }, children: feature })] }, feature))) })] }), _jsx("p", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }, children: t('footer.copyright', {
                            year: new Date().getFullYear(),
                            brandShort: t('common.brand.shortName'),
                            brandFull: t('common.brand.fullName'),
                        }) })] }), _jsx("div", { style: {
                    background: 'var(--color-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 56px',
                }, children: _jsxs("div", { style: { width: '100%', maxWidth: 380 }, children: [_jsxs("div", { style: { marginBottom: 32 }, children: [_jsx("h1", { style: {
                                        fontSize: 'var(--text-2xl)',
                                        fontWeight: 700,
                                        color: 'var(--color-text-primary)',
                                        marginBottom: 6,
                                    }, children: t('login.form.title') }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }, children: t('login.form.subtitle') })] }), error && (_jsxs("div", { style: {
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '10px 14px',
                                background: 'var(--color-danger-subtle)',
                                border: '1px solid var(--color-danger-border)',
                                borderRadius: 'var(--radius)',
                                marginBottom: 20,
                                animation: 'fadeIn 150ms ease',
                            }, children: [_jsx("style", { children: `@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: translateY(0) } }` }), _jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-danger)", strokeWidth: 2, style: { flexShrink: 0, marginTop: 1 }, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 8v4M12 16h.01" })] }), _jsx("p", { style: { fontSize: 'var(--text-sm)', color: 'var(--color-danger)' }, children: error })] })), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx(Input, { label: t('login.form.email'), type: "email", placeholder: t('auth.placeholders.email'), value: email, onChange: (e) => setEmail(e.target.value), autoComplete: "email", autoFocus: true, required: true }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 4 }, children: _jsx(Input, { label: t('login.form.password'), type: showPassword ? 'text' : 'password', placeholder: t('auth.placeholders.passwordMasked'), value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "current-password", required: true, rightIcon: _jsx("button", { type: "button", onClick: () => setShowPassword((v) => !v), style: {
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: 0,
                                                color: 'var(--color-text-muted)',
                                                display: 'flex',
                                                pointerEvents: 'auto',
                                            }, "aria-label": showPassword ? t('auth.password.hide') : t('auth.password.show'), children: showPassword ? (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" }), _jsx("path", { d: "M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" }), _jsx("line", { x1: "1", y1: "1", x2: "23", y2: "23" })] })) : (_jsxs("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, children: [_jsx("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }), _jsx("circle", { cx: "12", cy: "12", r: "3" })] })) }) }) }), _jsx(Button, { variant: "primary", size: "lg", type: "submit", loading: isPending, disabled: !email.trim() || !password || isPending, style: { width: '100%', marginTop: 4 }, children: t('login.form.submit') })] }), _jsx("p", { style: {
                                marginTop: 24,
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-muted)',
                                textAlign: 'center',
                            }, children: t('login.form.hint') })] }) })] }));
}
