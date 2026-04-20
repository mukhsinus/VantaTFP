import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@app/store/auth.store';
import { apiClient } from '@shared/api/client';

interface Conversation {
  id: string;
  name: string | null;
  type: 'direct' | 'group';
  updated_at: string;
}

interface Message {
  id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}

export function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingConvs(true);
    apiClient
      .get<{ data: Conversation[] }>('/api/v1/messages/conversations')
      .then((res) => setConversations(res.data ?? []))
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    apiClient
      .get<{ data: Message[] }>(`/api/v1/messages/conversations/${activeConv.id}/messages`)
      .then((res) => setMessages(res.data ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsgs(false));

    apiClient
      .post(`/api/v1/messages/conversations/${activeConv.id}/read`, {})
      .catch(() => {});
  }, [activeConv?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const msg = await apiClient.post<Message>(
        `/api/v1/messages/conversations/${activeConv.id}/messages`,
        { body: msgText.trim() }
      );
      setMessages((prev) => [...prev, msg]);
      setMsgText('');
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  const isMine = (msg: Message) => msg.sender_id === (user as any)?.id || msg.sender_id === (user as any)?.userId;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100dvh - 64px)',
        background: 'var(--color-bg)',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar: conversation list */}
      <div
        style={{
          width: activeConv ? 'clamp(72px, 30%, 280px)' : '100%',
          maxWidth: 320,
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-surface)',
          flexShrink: 0,
          transition: 'width 200ms ease',
        }}
      >
        <div
          style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid var(--color-border)',
            fontWeight: 700,
            fontSize: 'var(--text-md)',
            color: 'var(--color-text-primary)',
          }}
        >
          {t('messages.title')}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
          {loadingConvs ? (
            <div style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              {t('messages.loadingConversations')}
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
              {t('messages.noConversations')}
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveConv(conv)}
                style={{
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
                }}
              >
                <div
                  style={{
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
                  }}
                >
                  {conv.type === 'group' ? '#' : (conv.name?.[0]?.toUpperCase() ?? '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {conv.name ?? (conv.type === 'group' ? t('messages.groupChat') : t('messages.directMessage'))}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {formatDate(conv.updated_at)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeConv ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Chat header */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--color-surface)',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveConv(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>
              {activeConv.name ?? t('messages.chat')}
            </span>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              WebkitOverflowScrolling: 'touch' as any,
            }}
          >
            {loadingMsgs ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 40 }}>
                {t('messages.loadingMessages')}
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 40 }}>
                {t('messages.noMessages')}
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMine(msg) ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: isMine(msg) ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMine(msg) ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: isMine(msg) ? '#fff' : 'var(--color-text-primary)',
                      border: isMine(msg) ? 'none' : '1px solid var(--color-border)',
                      fontSize: 'var(--text-sm)',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.body && <p style={{ margin: 0 }}>{msg.body}</p>}
                    {msg.attachment_url && (
                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: isMine(msg) ? '#fff' : 'var(--color-accent)', fontSize: 'var(--text-xs)', display: 'block', marginTop: 4 }}
                      >
                        {msg.attachment_name ?? t('messages.attachment')}
                      </a>
                    )}
                    <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4, textAlign: 'right' }}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar (sticky CTA) */}
          <form
            onSubmit={sendMessage}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
              <input
              type="text"
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              placeholder={t('messages.typePlaceholder')}
              style={{
                flex: 1,
                height: 44,
                padding: '0 16px',
                borderRadius: 22,
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
              onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = 'var(--color-accent)')}
              onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = 'var(--color-border)')}
            />
            <button
              type="submit"
              disabled={!msgText.trim() || sending}
              style={{
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
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            gap: 12,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{t('messages.selectConversation')}</p>
          <p style={{ fontSize: 'var(--text-sm)' }}>{t('messages.chooseConversation')}</p>
        </div>
      )}
    </div>
  );
}
