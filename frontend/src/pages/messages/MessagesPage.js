import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@app/store/auth.store';
import { apiClient } from '@shared/api/client';
export function MessagesPage() {
    const user = useAuthStore((s) => s.user);
        const { t } = useTranslation();
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msgText, setMsgText] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        setLoadingConvs(true);
        apiClient
            .get('/api/v1/messages/conversations')
            .then((res) => setConversations(res.data ?? []))
            .catch(() => setConversations([]))
            .finally(() => setLoadingConvs(false));
    }, []);
    useEffect(() => {
        if (!activeConv)
            return;
        setLoadingMsgs(true);
        apiClient
            .get(`/api/v1/messages/conversations/${activeConv.id}/messages`)
            .then((res) => setMessages(res.data ?? []))
            .catch(() => setMessages([]))
            .finally(() => setLoadingMsgs(false));
        apiClient
            .post(`/api/v1/messages/conversations/${activeConv.id}/read`, {})
            .catch(() => { });
    }, [activeConv?.id]);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!msgText.trim() || !activeConv || sending)
            return;
        setSending(true);
        try {
            const msg = await apiClient.post(`/api/v1/messages/conversations/${activeConv.id}/messages`, { body: msgText.trim() });
            setMessages((prev) => [...prev, msg]);
            setMsgText('');
        }
        catch {
            // ignore
        }
        finally {
            setSending(false);
        }
    };
    const isMine = (msg) => msg.sender_id === user?.id || msg.sender_id === user?.userId;
    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formatDate = (iso) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
    return (_jsxs("div", { style: {
            display: 'flex',
            height: 'calc(100dvh - 64px)',
            background: 'var(--color-bg)',
            overflow: 'hidden',
        }, children: [_jsxs("div", { style: {
                    width: activeConv ? 'clamp(72px, 30%, 280px)' : '100%',
                    maxWidth: 320,
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--color-surface)',
                    flexShrink: 0,
                    transition: 'width 200ms ease',
                }, children: [_jsx("div", { style: {
                            padding: '16px 16px 12px',
                            borderBottom: '1px solid var(--color-border)',
                            fontWeight: 700,
                            fontSize: 'var(--text-md)',
                            color: 'var(--color-text-primary)',
                        }, children: "Messages" }), _jsx("div", { style: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }, children: loadingConvs ? (_jsx("div", { style: { padding: 20, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }, children: "Loading..." })) : conversations.length === 0 ? (_jsx("div", { style: { padding: '40px 20px', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }, children: "No conversations yet" })) : (conversations.map((conv) => (_jsxs("button", { type: "button", onClick: () => setActiveConv(conv), style: {
                                width: '100%',
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                border: 'none',
                                background: activeConv?.id === conv.id ? 'var(--color-accent-subtle)' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                borderBottom: '1px solid var(--color-border)',
                                transition: 'background 100ms ease',
                            }, children: [_jsx("div", { style: {
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        background: 'var(--color-accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: 'var(--text-sm)',
                                        flexShrink: 0,
                                    }, children: conv.type === 'group' ? '#' : (conv.name?.[0]?.toUpperCase() ?? '?') }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                                fontWeight: 600,
                                                fontSize: 'var(--text-sm)',
                                                color: 'var(--color-text-primary)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }, children: conv.name ?? (conv.type === 'group' ? 'Group chat' : 'Direct message') }), _jsx("div", { style: { fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }, children: formatDate(conv.updated_at) })] })] }, conv.id)))) })] }), activeConv ? (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }, children: [_jsxs("div", { style: {
                            padding: '14px 20px',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: 'var(--color-surface)',
                            flexShrink: 0,
                        }, children: [_jsx("button", { type: "button", onClick: () => setActiveConv(null), style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }, children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { d: "M15 18l-6-6 6-6" }) }) }), _jsx("span", { style: { fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }, children: activeConv.name ?? 'Chat' })] }), _jsxs("div", { style: {
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            WebkitOverflowScrolling: 'touch',
                        }, children: [loadingMsgs ? (_jsx("div", { style: { textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 40 }, children: "Loading messages..." })) : messages.length === 0 ? (_jsx("div", { style: { textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 40 }, children: "No messages yet. Say hello!" })) : (messages.map((msg) => (_jsx("div", { style: {
                                    display: 'flex',
                                    justifyContent: isMine(msg) ? 'flex-end' : 'flex-start',
                                }, children: _jsxs("div", { style: {
                                        maxWidth: '75%',
                                        padding: '10px 14px',
                                        borderRadius: isMine(msg) ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                        background: isMine(msg) ? 'var(--color-accent)' : 'var(--color-surface)',
                                        color: isMine(msg) ? '#fff' : 'var(--color-text-primary)',
                                        border: isMine(msg) ? 'none' : '1px solid var(--color-border)',
                                        fontSize: 'var(--text-sm)',
                                        lineHeight: 1.5,
                                        wordBreak: 'break-word',
                                    }, children: [msg.body && _jsx("p", { style: { margin: 0 }, children: msg.body }), msg.attachment_url && (_jsx("a", { href: msg.attachment_url, target: "_blank", rel: "noopener noreferrer", style: { color: isMine(msg) ? '#fff' : 'var(--color-accent)', fontSize: 'var(--text-xs)', display: 'block', marginTop: 4 }, children: msg.attachment_name ?? 'Attachment' })), _jsx("div", { style: { fontSize: 11, opacity: 0.65, marginTop: 4, textAlign: 'right' }, children: formatTime(msg.created_at) })] }) }, msg.id)))), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { onSubmit: sendMessage, style: {
                            padding: '12px 16px',
                            borderTop: '1px solid var(--color-border)',
                            background: 'var(--color-surface)',
                            display: 'flex',
                            gap: 10,
                            alignItems: 'center',
                            flexShrink: 0,
                        }, children: [_jsx("input", { type: "text", value: msgText, onChange: (e) => setMsgText(e.target.value), placeholder: "Type a message...", style: {
                                    flex: 1,
                                    height: 44,
                                    padding: '0 16px',
                                    borderRadius: 22,
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg)',
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--color-text-primary)',
                                    outline: 'none',
                                }, onFocus: (e) => (e.currentTarget.style.borderColor = 'var(--color-accent)'), onBlur: (e) => (e.currentTarget.style.borderColor = 'var(--color-border)') }), _jsx("button", { type: "submit", disabled: !msgText.trim() || sending, style: {
                                    width: 44,
                                    height: 44,
                                    borderRadius: '50%',
                                    background: msgText.trim() && !sending ? 'var(--color-accent)' : 'var(--color-border)',
                                    border: 'none',
                                    cursor: msgText.trim() && !sending ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'background 120ms ease',
                                }, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: 2.5, children: [_jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), _jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })] }) })] })] })) : (_jsxs("div", { style: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-muted)',
                    gap: 12,
                }, children: [_jsx("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, children: _jsx("path", { d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" }) }), _jsx("p", { style: { fontSize: 'var(--text-base)', fontWeight: 600 }, children: "Select a conversation" }), _jsx("p", { style: { fontSize: 'var(--text-sm)' }, children: "Choose a chat from the left to start messaging" })] }))] }));
}
