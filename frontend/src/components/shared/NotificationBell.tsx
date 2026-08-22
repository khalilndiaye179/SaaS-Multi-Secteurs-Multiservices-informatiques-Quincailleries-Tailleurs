import React, { useState, useEffect, useRef } from 'react';
import { ApiClient } from '../../services/api-client';

interface INotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface Props {
  mode: 'super-admin' | 'tenant';
  themeColor?: string;
}

const TYPE_ICONS: Record<string, string> = {
  PAYMENT_PENDING: '\ud83e\uddfe',
  PAYMENT_APPROVED: '\u2705',
  PAYMENT_REJECTED: '\u274c',
  NEW_TENANT: '\ud83c\udfe2',
  SUBSCRIPTION_EXPIRING: '\u26a0\ufe0f',
  SUBSCRIPTION_EXPIRED: '\ud83d\udd34',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '\u00c0 l\u2019instant';
  if (mins < 60) return 'Il y a ' + mins + ' min';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return 'Il y a ' + hrs + 'h';
  return 'Il y a ' + Math.floor(hrs / 24) + 'j';
}

export const NotificationBell: React.FC<Props> = ({ mode, themeColor = '#312E81' }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const listUrl = mode === 'super-admin' ? '/api/notifications/super-admin' : '/api/notifications/tenant';
  const countUrl = mode === 'super-admin' ? '/api/notifications/super-admin/unread-count' : '/api/notifications/tenant/unread-count';
  const readAllUrl = mode === 'super-admin' ? '/api/notifications/super-admin/read-all' : '/api/notifications/tenant/read-all';

  const fetchCount = async () => {
    try {
      const data = await ApiClient.get<{ count: number }>(countUrl);
      setUnreadCount(data.count || 0);
    } catch (_) { /* silencieux */ }
  };

  const fetchAll = async () => {
    try {
      const data = await ApiClient.get<INotification[]>(listUrl);
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.isRead).length);
    } catch (_) { /* silencieux */ }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (open) fetchAll(); }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await ApiClient.post('/api/notifications/' + id + '/read', {});
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) { /* silencieux */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await ApiClient.post(readAllUrl, {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) { /* silencieux */ }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          position: 'relative', background: open ? '#F3F4F6' : 'transparent',
          border: '1px solid var(--border-color)', borderRadius: 10, padding: '8px 12px',
          cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
          transition: 'all 200ms', display: 'flex', alignItems: 'center',
        }}
        title="Notifications"
      >
        {'\ud83d\udd14'}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, background: '#EF4444',
            color: 'var(--text-inverse)', fontSize: '0.6rem', fontWeight: 800, borderRadius: '50%',
            minWidth: 16, height: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360,
          maxHeight: 480, overflowY: 'auto', background: 'var(--bg-card)',
          border: '1px solid var(--border-color)', borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)', zIndex: 9999,
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #F3F4F6',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {'\ud83d\udd14'} Notifications {unreadCount > 0 && <span style={{ color: '#EF4444' }}>({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead}
                style={{ fontSize: '0.72rem', color: themeColor, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>
                Tout marquer lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {'\u2728'} Aucune notification
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => { if (!notif.isRead) handleMarkAsRead(notif.id); }}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid #F9FAFB',
                  background: notif.isRead ? 'white' : '#EFF6FF',
                  cursor: notif.isRead ? 'default' : 'pointer',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '1.2rem', marginTop: 2 }}>{TYPE_ICONS[notif.type] || '\ud83d\udd14'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: notif.isRead ? 600 : 800, fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: 2 }}>
                    {notif.title}
                    {!notif.isRead && (
                      <span style={{
                        display: 'inline-block', width: 6, height: 6, background: '#3B82F6',
                        borderRadius: '50%', marginLeft: 6, verticalAlign: 'middle',
                      }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{notif.message}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>{timeAgo(notif.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
