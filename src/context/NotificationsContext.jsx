import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSchoolData } from './SchoolDataContext';
import { useSettings } from './SettingsContext';
import { subscribeToAllNotifications, markNotificationsRead, deleteNotificationDoc, createFeeNotification } from '../firebase/notifications';
import { currentMonthValue } from '../utils/somaliDate';
import { getMonthlyFeeStatus } from '../utils/studentFee';

const NotificationsContext = createContext(null);

const LINKS = { fee: '/dashboard/finance', absent: '/dashboard/attendance' };
const MESSAGE_KEYS = { fee: 'notifications.feeMessage', absent: 'notifications.absentMessage' };

export function NotificationsProvider({ children }) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { showError } = useToast();
  const { students, feePayments } = useSchoolData();
  const { settings } = useSettings();
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

  // Xasuusinta Lacagta ("fee reminder") — otomaatig, ma aha gacan-gelin.
  // Bishii-bishii waxaan u wareegnaa ardayda "unpaid" ee dhabta ah (fiiri
  // getMonthlyFeeStatus, kaas oo ka soo xisaabiya feeType/feeAmount/
  // discountPercent + feePayments), oo haddii ogeysiin bishaas+ardaygaas ah
  // aanu horeba u jirin (fiiri rawNotifications), mid cusub ayaan abuuraa.
  // Hubinta "horeba ma jiraa" waa lama huraan si aan mar walba dib loogu
  // celin "aan la akhrin" ogeysiin horeba la arkay.
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') return;
    if (!settings.notificationPrefs.feeReminders) return;
    const month = currentMonthValue();
    students
      .filter((s) => getMonthlyFeeStatus(s, feePayments, month) === 'unpaid')
      .forEach((s) => {
        const notifId = `fee_${s.id}_${month}`;
        if (rawNotifications.some((n) => n.id === notifId)) return;
        createFeeNotification({
          schoolCode: profile.schoolCode,
          studentId: s.id,
          studentName: s.fullName || '',
          className: s.className || '',
          month,
        }).catch((err) => reportError('Khalad ayaa dhacay markii ogeysiiska lacagta la abuurayay:', err));
      });
  }, [students, feePayments, rawNotifications, profile?.schoolCode, profile?.accountType, settings.notificationPrefs.feeReminders]);

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
