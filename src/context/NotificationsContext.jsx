import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSchoolData } from './SchoolDataContext';
import { useSettings } from './SettingsContext';
import { subscribeToAllNotifications, markNotificationsRead, deleteNotificationDoc, dismissFeeNotification, createFeeNotification } from '../firebase/notifications';
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

  // "classTeacherId" (Teacher Firestore Hardening, 2026-08-02): macallinku
  // query-giisu waa in uu si toos ah u xaddidan yahay type=='absent' +
  // fasalladiisa (firestore.rules-ku hadda ku tiirsan yahay), haddii kale
  // (owner) query-gu waa schoolCode-wide sida hore. Macallin aan ku xirneyn
  // diiwaanka Teachers — lama sameeyo query, waa madhan.
  useEffect(() => {
    if (!profile?.schoolCode || profile?.accountType !== 'staff') {
      setRawNotifications([]);
      return undefined;
    }
    if (profile?.role === 'teacher' && !profile?.teacherDocId) {
      setRawNotifications([]);
      return undefined;
    }
    const classTeacherId = profile?.role === 'teacher' ? profile.teacherDocId : null;
    const unsubscribe = subscribeToAllNotifications(
      profile.schoolCode,
      classTeacherId,
      setRawNotifications,
      (err) => reportError('Khalad ayaa dhacay markii ogeysiisyada laga soo akhriyay:', err)
    );
    return unsubscribe;
  }, [profile?.schoolCode, profile?.accountType, profile?.role, profile?.teacherDocId]);

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

  // PRINCIPLE-KA GUUD (Teacher Role Scoping, 2026-08-02): macallinku waa in
  // uu arkaa KALIYA ogeysiisyada la xiriira fasalladiisa gaarka ah — Finance
  // ('fee') gebi ahaanba waa mamnuuc isaga (fiiri Overview.jsx/finance
  // rules). 'absent' horeba si sax ah SERVER-KA (Firestore query,
  // classTeacherId — stable) looga soo xaddiday rawNotifications (fiiri
  // firebase/notifications.js: subscribeToAllNotifications), sidaas darteed
  // halkan uma baahna dib-u-shaandhayn client ah.
  //
  // Notifications audit HIGH, 2026-08-26: hore halkan waxaa lagu dib-u-
  // shaandhayn jiray "n.className" oo la barbardhigayo myClassNames (magaca
  // HADDA jira fasalka) — laakiin className waa denormalized (wakhtigii
  // ogeysiiska la abuuray). Fasal la magac-beddelo (grade/section edit) →
  // ogeysiisyadii "Maqan" ee fasalkaas hore ayaa si aamusan ah uga bixi
  // jiray liiska macallinka, in kasta oo server-ku si sax ah u soo celiyay
  // (isla khaladkii Attendance.jsx la saxay). className check-ga waa la saaray.
  // "dismissedByStaff" (Notifications audit MEDIUM, 2026-08-26): ogeysiisyada
  // 'fee' waxaa dib-u-abuuri jira effect-ka kore mar kasta oo ardaygu weli
  // yahay 'unpaid' — hore "Tirtir" wuxuu tirtiri jiray doc-ka gebi ahaanba
  // (deleteNotificationDoc), taasoo effect-ka sababi jirtay inuu isla markiiba
  // dib u abuuro (aan la akhrin ahaan), badhanka "Tirtir" u muuqday mid aan
  // waxba samaynayn. Hadda 'fee' waa "soft-dismiss" (dismissFeeNotification,
  // doc-ku wuu sii jiraa Firestore si effect-ku uusan dib u abuurin), waxaana
  // halkan lagaga saarayaa liiska la muujiyo.
  const visibleRawNotifications = useMemo(
    () => rawNotifications.filter((n) => (profile?.role !== 'teacher' || n.type !== 'fee') && !n.dismissedByStaff),
    [rawNotifications, profile?.role]
  );

  const notifications = useMemo(
    () =>
      visibleRawNotifications.map((n) => ({
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
    [visibleRawNotifications, t]
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
    const unreadIds = visibleRawNotifications.filter((n) => !n.readByStaff).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await markNotificationsRead(unreadIds, 'staff');
    } catch (err) {
      reportError('Khalad ayaa dhacay markii ogeysiisyada la calaamadinayay in la akhriyay:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const notif = rawNotifications.find((n) => n.id === id);
      if (notif?.type === 'fee') {
        // fiiri faallada dismissedByStaff kore — hard-delete-ku wuu dib u
        // soo noqon lahaa isla mar (effect-ka xasuusinta lacagta).
        await dismissFeeNotification(id);
      } else {
        await deleteNotificationDoc(id);
      }
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
