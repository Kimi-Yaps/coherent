import { createContext, useContext } from 'react';

export interface AppNotification {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  link: string;
  category?: 'booking' | 'quota' | 'wellness' | 'system';
  createdAt: number;
}

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (item: {
    icon: string;
    title: string;
    description: string;
    link?: string;
    category?: 'booking' | 'quota' | 'wellness' | 'system';
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
