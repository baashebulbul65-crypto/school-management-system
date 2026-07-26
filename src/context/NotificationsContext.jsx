import { createContext, useContext, useState, useMemo } from 'react';

const NotificationsContext = createContext(null);

function minutesAgo(mins) {
  return new Date(Date.now() - mins * 60000).toISOString();
}

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'fee',
    title: 'Lacag Cusub Ayaa La Ururiyay',
    description: 'Ismaaciil Cabdi Xasan (Form 1A) wuxuu bixiyay $50 oo ka mid ah lacagta Semester 2-aad.',
    time: minutesAgo(8),
    read: false,
    link: '/dashboard/finance',
  },
  {
    id: 2,
    type: 'attendance',
    title: 'Heerka Imaanshaha Hoos U Dhacay',
    description: 'Form 3A waxay maanta gaadhay heer imaansho ah oo ka hooseeya 80% — 3 arday ayaa maqan.',
    time: minutesAgo(35),
    read: false,
    link: '/dashboard/attendance',
  },
  {
    id: 3,
    type: 'exam',
    title: 'Buundooyin Cusub Waa La Geliyay',
    description: 'Buundooyinka Imtixaanka Midterm ee Xisaabta (Form 1A) way dhammaadeen — natiijooyinka waa diyaar.',
    time: minutesAgo(120),
    read: false,
    link: '/dashboard/exams',
  },
  {
    id: 4,
    type: 'message',
    title: 'Fariin Cusub Oo Ka Timid Waalid',
    description: 'Waalidka Sacdiyo Xasan Nuur wuxuu ku weydiiyay xaalada mushaharka fasalka.',
    time: minutesAgo(200),
    read: true,
  },
  {
    id: 5,
    type: 'system',
    title: 'Diiwaan Gelin Cusub',
    description: 'Macallin cusub oo la yidhaahdo "Cabdiraxman Xasan" ayaa lagu daray nidaamka.',
    time: minutesAgo(420),
    read: true,
    link: '/dashboard/teachers',
  },
  {
    id: 6,
    type: 'fee',
    title: 'Lacag Dib U Dhacday',
    description: 'Cabdiraxman Yoonis (Form 1A) wuxuu haystaa lacag dib u dhacday oo dhan $20.',
    time: minutesAgo(1440),
    read: true,
    link: '/dashboard/finance',
  },
];

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (notif) => {
    setNotifications((prev) => [{ ...notif, id: Date.now(), time: new Date().toISOString(), read: false }, ...prev]);
  };

  const value = { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, addNotification };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications waa in loo isticmaalaa gudaha <NotificationsProvider>');
  }
  return context;
}