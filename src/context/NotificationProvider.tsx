import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { NotificationContext, type AppNotification } from './useNotifications';

const STORAGE_KEY = 'coherent_notifications_v2';

const initialDefaultNotifications: AppNotification[] = [
  {
    id: 'init_1',
    icon: '🗓️',
    title: 'Upcoming Session',
    description: 'Dr. Amelia Chen · 14 Sep at 10:30',
    time: '15m ago',
    read: false,
    link: '/bookings?tab=calendar',
    category: 'booking',
    createdAt: Date.now() - 15 * 60 * 1000,
  },
  {
    id: 'init_2',
    icon: '✨',
    title: 'Mindfulness Practice',
    description: 'A 5-minute breathing exercise is ready for you.',
    time: '45m ago',
    read: false,
    link: '/ai-support',
    category: 'wellness',
    createdAt: Date.now() - 45 * 60 * 1000,
  },
  {
    id: 'init_3',
    icon: '🌱',
    title: 'Gentle Reminder',
    description: 'Take three deep breaths. You are doing fine.',
    time: '2h ago',
    read: true,
    link: '/ai-support',
    category: 'wellness',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
  },
];

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return initialDefaultNotifications;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // Storage error ignored
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = ({
    icon,
    title,
    description,
    link = '/ai-support',
    category = 'system',
  }: {
    icon: string;
    title: string;
    description: string;
    link?: string;
    category?: 'booking' | 'quota' | 'wellness' | 'system';
  }) => {
    const newItem: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      icon,
      title,
      description,
      time: 'Just now',
      read: false,
      link,
      category,
      createdAt: Date.now(),
    };

    setNotifications((prev) => [newItem, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications,
    }),
    [notifications, unreadCount]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
