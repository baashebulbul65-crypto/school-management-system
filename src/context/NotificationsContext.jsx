import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { subscribeToAllNotifications, markNotificationsRead, deleteNotificationDoc } from '../firebase/notifications';

const NotificationsContext = createContext(null);

const LINKS = { fee: '/dashboard/finance', absent: '/dashboard/attendance' };
const MESSAGE_KEYS = { fee: 'notifications.feeMessage', absent: 'notifications.absentMessage' };

export function NotificationsProvider({ children }) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { showError } = useToast();
  const [rawNotifications, setRawNotifications] = useState([]);

  const reportError = (message, err) => {
    console.error(message, err);
    showError(message);
  };

  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setRawNotifications([]);
      return undefined;
    }
    const unsubscribe = subscribeToAllNotifications(
      profile.schoolCode,
      setRawNotifications,
      (err) => reportError('Khalad ayaa dhacay markii ogeysiisyada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType]);

  const notifications = useMemo(
    () =>
      rawNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: t(`notifications.types.${n.type}.title`, n.type),
        description: MESSAGE_KEYS[n.type]
          ? t(MESSAGE_KEYS[n.type], { name: n.studentName, className: n.className })
          : '',
        time: n.createdAt,
        read: n.readByStaff,
        link: LINKS[n.type],
      })),
    [rawNotifications, t]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAsRead = async (id) => {
    try {
      await markNotificationsRead([id], 'staff');
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ogeysiiska la calaamadinayay in la akhriyay:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = rawNotifications.filter((n) => !n.readByStaff).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await markNotificationsRead(unreadIds, 'staff');
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ogeysiisyada la calaamadinayay in la akhriyay:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await deleteNotificationDoc(id);
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ogeysiiska la tirtirayay:', err);
    }
  };

  const value = { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications waa in loo isticmaalaa gudaha <NotificationsProvider>');
  }
  return context;
}
